import 'server-only'

import type { Database } from '@/types/database.types'

import { supabasePublic } from './supabase/public'

type PostRow = Database['public']['Tables']['posts']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

/** Un post con su categoria y su autor ya resueltos. */
export type PostWithRelations = Pick<
  PostRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'cover_image_url'
  | 'cover_image_alt'
  | 'published_at'
  | 'reading_time_minutes'
  | 'is_featured'
  | 'is_anonymous'
> & {
  category: Pick<CategoryRow, 'name' | 'slug'> | null
  author: Pick<ProfileRow, 'full_name' | 'avatar_url'> | null
}

/**
 * Las columnas que necesitan las tarjetas del feed y del Hero Grid.
 *
 * Se listan explicitamente en vez de usar `*`: `content` es el JSON completo
 * de TipTap y traerlo para veinte tarjetas que solo muestran titulo y bajada
 * multiplica el payload sin que nada lo use.
 */
const CARD_COLUMNS =
  'id, slug, title, excerpt, cover_image_url, cover_image_alt, published_at, reading_time_minutes, is_featured, is_anonymous, category:categories(name, slug), author:profiles(full_name, avatar_url)'

/**
 * Igual que CARD_COLUMNS pero con `!inner` en la categoria.
 *
 * Hace falta cuando se filtra POR una columna de la tabla unida. Sin `!inner`,
 * PostgREST no descarta la fila padre: devuelve el post igual y pone la
 * relacion en `null`. Como el `limit` se aplica antes, la consulta termina
 * trayendo las N notas mas recientes de cualquier categoria, todas con
 * `category: null`, y filtrarlas despues en JS deja la lista vacia.
 *
 * Va escrito literal y no derivado de CARD_COLUMNS con un `replace`: el tipado
 * de supabase-js infiere la forma del resultado desde el string literal, y
 * construirlo en runtime lo deja en `GenericStringError`.
 */
const CARD_COLUMNS_CATEGORIA_INNER =
  'id, slug, title, excerpt, cover_image_url, cover_image_alt, published_at, reading_time_minutes, is_featured, is_anonymous, category:categories!inner(name, slug), author:profiles(full_name, avatar_url)'

/**
 * El filtro de publicados.
 *
 * Duplica lo que ya hace la politica RLS a proposito. RLS es la garantia de
 * seguridad; esto es para que el planificador de Postgres pueda usar el indice
 * parcial `posts_published_feed_idx`, que solo cubre las filas publicadas.
 */
function soloPublicados<
  T extends {
    eq: (c: string, v: string) => T
    lte: (c: string, v: string) => T
  },
>(query: T): T {
  return query
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
}

/**
 * Posts del Hero Grid: la principal se elige, las laterales son lo mas
 * reciente.
 *
 * Antes esto ordenaba por `is_featured desc, published_at desc` y cortaba en
 * tres, y esa sola linea hacia que el bloque llamado "Lo ultimo" mostrara
 * cosas que no eran lo ultimo: una nota destacada no se quedaba solo con la
 * foto grande, tambien empujaba a las dos tarjetas laterales. Con dos
 * destacadas del 17 de agosto, la nota del 18 -la mas reciente del sitio-
 * salia tercera y la segunda mas reciente no salia.
 *
 * El reparto ahora separa las dos decisiones, que es el mismo criterio que ya
 * se aplico en `categories` con `show_in_home` y en `sponsors` con
 * `is_featured`:
 *
 * - `is_featured` elige LA principal, la foto grande. La base garantiza que
 *   sea una sola (indice `posts_una_sola_destacada` mas su trigger).
 * - Las laterales son las mas recientes por `published_at` que no sean esa.
 *
 * Sin ninguna destacada, la principal pasa a ser la mas reciente y el bloque
 * queda cronologico puro. Es degradacion natural, no un caso de error: la
 * portada nunca se queda vacia por una casilla sin marcar.
 *
 * Son dos consultas y no una porque ya no hay un solo orden que devuelva las
 * dos cosas: la principal se define por una condicion y las laterales por otra.
 * Van en paralelo, asi que cuestan un round-trip, no dos.
 */
export async function getHeroPosts(limit = 3): Promise<PostWithRelations[]> {
  const [destacada, recientes] = await Promise.all([
    soloPublicados(supabasePublic.from('posts').select(CARD_COLUMNS))
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    /*
      Alcanza con pedir `limit`, y el numero es justo. Si la destacada esta
      entre las recientes -que es lo habitual- al filtrarla quedan `limit - 1`,
      que son exactamente las laterales que hacen falta. Y si no esta, sobra
      una que el `slice` descarta.
    */
    soloPublicados(supabasePublic.from('posts').select(CARD_COLUMNS))
      .order('published_at', { ascending: false })
      .limit(limit),
  ])

  if (recientes.error) {
    console.error(
      'No se pudieron leer los posts del hero:',
      recientes.error.message
    )
    return []
  }

  /*
    Un error al leer la destacada no vacia la portada: se sigue con las
    recientes. Perder la nota elegida es un problema; perder el bloque entero
    porque fallo una de las dos consultas es peor.
  */
  if (destacada.error) {
    console.error('No se pudo leer la nota destacada:', destacada.error.message)
  }

  const lista = (recientes.data ?? []) as PostWithRelations[]
  const principal = (destacada.data as PostWithRelations | null) ?? lista[0]
  if (!principal) return []

  return [
    principal,
    ...lista.filter((p) => p.id !== principal.id).slice(0, limit - 1),
  ]
}

/**
 * Feed cronologico.
 *
 * `excludeIds` evita repetir en el feed las notas que ya estan en el Hero Grid.
 */
export async function getFeedPosts(
  limit = 12,
  excludeIds: readonly number[] = []
): Promise<PostWithRelations[]> {
  let query = soloPublicados(
    supabasePublic.from('posts').select(CARD_COLUMNS)
  ).order('published_at', { ascending: false })

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query.limit(limit)

  if (error) {
    console.error('No se pudo leer el feed:', error.message)
    return []
  }
  return (data ?? []) as PostWithRelations[]
}

/**
 * Ultimas notas de una categoria, para los bloques de secciones secundarias.
 *
 * Una consulta por categoria en paralelo. Se podria traer todo de una y
 * agrupar en JS, pero eso obliga a pedir muchas mas filas de las necesarias
 * para garantizar que cada categoria llegue a su cupo.
 */
export async function getPostsPorCategoria(
  slugs: readonly string[],
  porCategoria = 3
): Promise<{ slug: string; name: string; posts: PostWithRelations[] }[]> {
  const resultados = await Promise.all(
    slugs.map(async (slug) => {
      const { data, error } = await soloPublicados(
        supabasePublic.from('posts').select(CARD_COLUMNS_CATEGORIA_INNER)
      )
        .eq('categories.slug', slug)
        .order('published_at', { ascending: false })
        .limit(porCategoria)

      if (error) {
        console.error(
          `No se pudieron leer los posts de ${slug}:`,
          error.message
        )
        return null
      }

      const posts = (data ?? []) as PostWithRelations[]
      if (posts.length === 0) return null

      return { slug, name: posts[0]?.category?.name ?? slug, posts }
    })
  )

  return resultados.filter((r): r is NonNullable<typeof r> => r !== null)
}

/** Un post completo, para la pagina de articulo. */
export type PostCompleto = PostWithRelations &
  // `status` lo necesita la vista previa, para poder decir si lo que se esta
  // mirando es un borrador o una nota que ya salio.
  Pick<PostRow, 'content' | 'created_at' | 'updated_at' | 'status'> & {
    author:
      | (Pick<ProfileRow, 'full_name' | 'avatar_url' | 'bio'> & {
          twitter_url: string | null
          instagram_url: string | null
        })
      | null
  }

// Sin embed de sponsor: este proyecto no tiene agradecimiento al pie de nota
// (posts.sponsor_id no existe en el esquema; ver CLAUDE.md).
const POST_COLUMNS =
  'id, slug, title, excerpt, content, cover_image_url, cover_image_alt, published_at, created_at, updated_at, status, reading_time_minutes, is_featured, is_anonymous, category:categories(name, slug), author:profiles(full_name, avatar_url, bio, twitter_url, instagram_url)'

export async function getPostBySlug(
  slug: string
): Promise<PostCompleto | null> {
  const { data, error } = await soloPublicados(
    supabasePublic.from('posts').select(POST_COLUMNS)
  )
    .eq('slug', slug)
    // maybeSingle y no single: si no existe, `single` devuelve error y esto es
    // un 404 normal, no una falla.
    .maybeSingle()

  if (error) {
    console.error(`No se pudo leer el post ${slug}:`, error.message)
    return null
  }
  return (data as PostCompleto | null) ?? null
}

/**
 * La misma nota, pero sin exigir que este publicada.
 *
 * Es la lectura de la vista previa de borradores. Se separa de `getPostBySlug`
 * en vez de agregarle una bandera, para que no exista ni un camino por el que
 * la pagina publica pueda terminar mostrando un borrador por un parametro mal
 * pasado.
 *
 * Usa el cliente CON cookies y no `supabasePublic`, y esa es toda la
 * autorizacion: `posts_select` deja ver lo no publicado solo al autor de la
 * nota o a un admin. Sin sesion no devuelve nada, asi que la cookie de vista
 * previa por si sola no alcanza para espiar borradores ajenos.
 *
 * Tocar cookies saca a la ruta del render estatico, que es justo lo que
 * CLAUDE.md advierte que hay que evitar. Aca no molesta porque esta funcion
 * corre unicamente cuando el modo borrador esta encendido, y en ese caso Next
 * ya salteo la cache por la cookie `__prerender_bypass`. Para todos los demas
 * la nota sigue saliendo del prerender.
 */
export async function getPostBorrador(
  slug: string
): Promise<PostCompleto | null> {
  const { createClient } = await import('./supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(POST_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error(`No se pudo leer el borrador ${slug}:`, error.message)
    return null
  }
  return (data as PostCompleto | null) ?? null
}

/**
 * Notas relacionadas: misma categoria, excluyendo la actual.
 *
 * Si la categoria no llega al limite, completa con las mas recientes de
 * cualquier seccion. Un bloque de relacionadas a medio llenar se ve peor que
 * uno completo aunque las ultimas sean de otra seccion.
 *
 * El orden es cronologico y nada mas: primero las de la misma categoria de mas
 * nueva a mas vieja, y despues el relleno con el mismo criterio. Una del
 * relleno nunca se adelanta a una de la categoria aunque sea mas reciente.
 *
 * Cuantas entran lo decide quien llama: hoy son cinco, y ese numero vive en la
 * pagina de la nota porque depende de la grilla con la que se dibujan.
 */
export async function getRelatedPosts(
  categorySlug: string | null,
  excluirId: number,
  limit = 3
): Promise<PostWithRelations[]> {
  const mismos = categorySlug
    ? ((
        await soloPublicados(
          supabasePublic.from('posts').select(CARD_COLUMNS_CATEGORIA_INNER)
        )
          .eq('categories.slug', categorySlug)
          .neq('id', excluirId)
          .order('published_at', { ascending: false })
          .limit(limit)
      ).data ?? [])
    : []

  const resultado = mismos as PostWithRelations[]
  if (resultado.length >= limit) return resultado

  const yaVistos = [excluirId, ...resultado.map((p) => p.id)]
  const relleno = await getFeedPosts(limit - resultado.length, yaVistos)
  return [...resultado, ...relleno]
}

/** Slugs publicados, para generateStaticParams y el sitemap. */
export async function getPublishedSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const { data, error } = await soloPublicados(
    supabasePublic.from('posts').select('slug, updated_at')
  ).order('published_at', { ascending: false })

  if (error) {
    console.error('No se pudieron leer los slugs:', error.message)
    return []
  }
  return data ?? []
}

/** Notas de una categoria, para /categoria/[slug]. */
export async function getPostsDeCategoria(
  slug: string,
  limit = 24
): Promise<PostWithRelations[]> {
  const { data, error } = await soloPublicados(
    supabasePublic.from('posts').select(CARD_COLUMNS_CATEGORIA_INNER)
  )
    .eq('categories.slug', slug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`No se pudieron leer los posts de ${slug}:`, error.message)
    return []
  }
  return (data ?? []) as PostWithRelations[]
}

/*
  Los Reels ya no salen de esta tabla.

  Desde que se leen en vivo de la API de Instagram (`lib/instagram.ts`), aca no
  queda nada que consultar: `getMediaItems`, el tipo `MediaItem` y
  `REELS_EN_PORTADA` se fueron con ese cambio. La constante vive ahora al lado
  de quien la usa.
*/

/*
  Los sponsors de este proyecto son solo logos en la landing: sin espacios de
  publicidad vendidos (portada, lateral, pie de nota), sin banners y sin
  selectores. La fuente documenta esa maquinaria por si algun dia se vende.
*/
export type Sponsor = Pick<
  Database['public']['Tables']['sponsors']['Row'],
  'id' | 'name' | 'logo_url' | 'website_url'
>

export async function getSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabasePublic
    .from('sponsors')
    .select('id, name, logo_url, website_url')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error('No se pudieron leer los sponsors:', error.message)
    return []
  }
  return data ?? []
}
