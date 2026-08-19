'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requerirSesion } from '@/lib/admin/session'
import { borrarDeStorage, subirImagen } from '@/lib/admin/storage'
import { rutaNoticia } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database.types'

export type EstadoArticulo = { error: string | null; ok: string | null }

/**
 * Slug a partir del titulo.
 *
 * `normalize('NFD')` separa cada letra acentuada en letra + tilde, y despues
 * se borran las tildes. Sin eso "Selección" quedaria como "seleccin", porque
 * el filtro de caracteres se come la vocal acentuada entera.
 */
export async function slugify(texto: string): Promise<string> {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Minutos de lectura estimados desde el JSON de TipTap.
 *
 * 200 palabras por minuto, que es el promedio habitual para prosa en español.
 * Se recorre el arbol en vez de medir el largo del JSON: ese incluiria los
 * nombres de los nodos y daria un numero inflado.
 */
function calcularLectura(doc: unknown): number {
  let palabras = 0
  const recorrer = (nodo: unknown): void => {
    if (typeof nodo !== 'object' || nodo === null) return
    const n = nodo as { text?: unknown; content?: unknown[] }
    if (typeof n.text === 'string') {
      palabras += n.text.trim().split(/\s+/).filter(Boolean).length
    }
    if (Array.isArray(n.content)) n.content.forEach(recorrer)
  }
  recorrer(doc)
  return Math.max(1, Math.round(palabras / 200))
}

function refrescar(slug: string) {
  revalidatePath('/')
  revalidatePath(rutaNoticia(slug))
  revalidatePath('/admin/noticias')
  // El sitemap lista las notas publicadas, asi que tambien queda viejo.
  revalidatePath('/sitemap.xml')
}

export async function guardarArticulo(
  _estado: EstadoArticulo,
  formData: FormData
): Promise<EstadoArticulo> {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const id = formData.get('id') ? Number(formData.get('id')) : null
  const titulo = String(formData.get('title') ?? '').trim()
  const bajada = String(formData.get('excerpt') ?? '').trim()
  const categoriaId = Number(formData.get('category_id'))
  const contenidoCrudo = String(formData.get('content') ?? '')
  const destacada = formData.get('is_featured') === 'on'
  const anonima = formData.get('is_anonymous') === 'on'
  const publicar = formData.get('publicar') === '1'
  const portadaActual = String(formData.get('cover_actual') ?? '')
  const portadaAlt = String(formData.get('cover_image_alt') ?? '').trim()
  const archivo = formData.get('cover')

  if (!titulo) return { error: 'El título es obligatorio.', ok: null }
  if (!Number.isFinite(categoriaId) || categoriaId <= 0) {
    return { error: 'Elige una categoría.', ok: null }
  }

  let contenido: Json
  try {
    contenido = JSON.parse(
      contenidoCrudo || '{"type":"doc","content":[]}'
    ) as Json
  } catch {
    return {
      error: 'El cuerpo de la nota llegó dañado. Vuelve a intentarlo.',
      ok: null,
    }
  }

  let portadaUrl = portadaActual
  /*
    La portada anterior, para borrarla de Storage recien DESPUES de que la fila
    quede guardada. Antes no se borraba nunca: cada cambio de portada dejaba el
    archivo viejo sin que nada lo referenciara.

    El orden importa. Si se borrara al subir la nueva y despues el update fuera
    rechazado por RLS, la fila seguiria apuntando a un archivo que ya no existe
    y la nota quedaria con la portada rota.
  */
  let portadaAReemplazar: string | null = null
  /*
    La que se acaba de subir. Si despues la escritura falla, hay que sacarla:
    subio bien pero no quedo referenciada por ninguna fila, asi que seria
    exactamente el mismo huerfano que este cambio viene a evitar.
  */
  let subidaNueva: string | null = null
  if (archivo instanceof File && archivo.size > 0) {
    const subida = await subirImagen('article-covers', archivo)
    if (subida.error !== null) return { error: subida.error, ok: null }
    portadaUrl = subida.url
    subidaNueva = subida.url
    if (portadaActual && portadaActual !== subida.url) {
      portadaAReemplazar = portadaActual
    }
  }

  const slug = (await slugify(titulo)) || `nota-${Date.now()}`

  const fila = {
    title: titulo,
    excerpt: bajada || null,
    content: contenido,
    category_id: categoriaId,
    is_featured: destacada,
    is_anonymous: anonima,
    cover_image_url: portadaUrl || null,
    cover_image_alt: portadaAlt || null,
    reading_time_minutes: calcularLectura(contenido),
  }

  if (id) {
    // El slug NO se regenera al editar. Cambiarlo rompe el enlace que ya
    // circulo y las URLs que Google indexo. Si hace falta cambiarlo, es una
    // decision aparte que ademas necesita una redireccion.
    const actualizacion = publicar
      ? {
          ...fila,
          status: 'published' as const,
          published_at: new Date().toISOString(),
        }
      : fila

    const { data, error } = await supabase
      .from('posts')
      .update(actualizacion)
      .eq('id', id)
      .select('slug')
      .maybeSingle()

    if (error) {
      console.error('No se pudo actualizar la nota:', error.message)
      await borrarDeStorage(subidaNueva)
      return { error: 'No se pudo guardar. Intenta de nuevo.', ok: null }
    }

    /*
      Cero filas y ningun error: la nota existe pero RLS no deja tocarla, porque
      `posts_update` pide ser su autor o admin.

      Sin esta rama el UPDATE no hacia nada y la accion igual redirigia al
      listado diciendo "publicada". Guardar parecia funcionar y no guardaba: el
      caso se veia solo mirando `updated_at` en la base.

      `despublicarArticulo` y `borrarArticulo` ya distinguian los tres casos
      (error, cero filas, listo); este era el unico que faltaba, y era el mas
      usado de los tres.
    */
    if (!data) {
      await borrarDeStorage(subidaNueva)
      return {
        error:
          'Esta nota es de otra persona y solo su autor o un admin pueden editarla. No se guardó ningún cambio.',
        ok: null,
      }
    }

    await borrarDeStorage(portadaAReemplazar)

    refrescar(data.slug)
    // Al listado, no de vuelta al formulario. Guardar es el final de la tarea:
    // quedarse en la pantalla de edicion deja la duda de si el cambio entro.
    // El listado muestra el estado real y el aviso de confirmacion.
    redirect(`/admin/noticias?r=${publicar ? 'publicada' : 'borrador'}`)
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...fila,
      slug,
      // author_id es el usuario de la sesion. La politica RLS exige que
      // coincida con auth.uid(), asi que no se puede publicar a nombre de otro.
      author_id: sesion.userId,
      status: publicar ? 'published' : 'draft',
      published_at: publicar ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .maybeSingle()

  if (error) {
    console.error('No se pudo crear la nota:', error.message)
    await borrarDeStorage(subidaNueva)
    const duplicado = error.code === '23505'
    return {
      error: duplicado
        ? 'Ya existe una nota con ese título. Cámbialo un poco.'
        : 'No se pudo crear la nota.',
      ok: null,
    }
  }

  // Mismo criterio que arriba: sin fila devuelta no hay nada que festejar. En
  // el alta, RLS rechaza con error en vez de filtrar, asi que esto no deberia
  // pasar; queda igual para no volver a redirigir con un exito inventado.
  if (!data) {
    await borrarDeStorage(subidaNueva)
    return { error: 'No se pudo crear la nota. Intenta de nuevo.', ok: null }
  }

  refrescar(data.slug)
  redirect(`/admin/noticias?r=${publicar ? 'publicada' : 'borrador'}`)
}

/**
 * Vuelve al listado diciendo como salio.
 *
 * Estas acciones no devuelven estado a un `useActionState`, porque se disparan
 * desde formularios sueltos por fila. Sin esto, la unica señal de que algo fallo
 * era un `console.error` en el servidor: para quien esta usando el CMS, el boton
 * simplemente no hacia nada.
 */
function volverAlListado(resultado: string): never {
  redirect(`/admin/noticias?r=${resultado}`)
}

/**
 * Por que hay que mirar si volvio una fila.
 *
 * Con RLS, un `update` o un `delete` sobre una nota de otra persona NO da
 * error: la politica la filtra, no se toca nada, y `error` viene en null. Si la
 * accion solo mira `error`, termina sin hacer nada y sin avisar.
 *
 * Ese era el bug de "despublicar no funciona": el boton se clickeaba y no
 * pasaba absolutamente nada.
 */
/**
 * Publica un borrador desde el listado.
 *
 * El camino era de ida: se podia despublicar desde la fila, pero para volver a
 * publicar habia que entrar a editar y buscar el boton adentro del formulario.
 *
 * `published_at` se respeta si ya existe. Una nota que salio, se despublico y
 * vuelve a salir es la misma nota, no una nueva, y pisarle la fecha la mandaria
 * al tope del feed como si fuera de hoy. Solo se pone la fecha actual cuando
 * nunca se publico, que ademas es obligatorio: la restriccion
 * `posts_published_needs_date` no admite una publicada sin fecha.
 */
export async function publicarArticulo(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  if (!Number.isFinite(id)) volverAlListado('error')

  const supabase = await createClient()

  // Se lee antes para no pisar la fecha original. Si RLS no deja verla, el
  // update de abajo tampoco va a tocar nada y se avisa igual.
  const { data: antes } = await supabase
    .from('posts')
    .select('published_at')
    .eq('id', id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      published_at: antes?.published_at ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select('slug')
    .maybeSingle()

  if (error) {
    console.error('No se pudo publicar:', error.message)
    volverAlListado('error')
  }
  if (!data) volverAlListado('sin-permiso')

  refrescar(data.slug)
  volverAlListado('publicada')
}

export async function despublicarArticulo(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  if (!Number.isFinite(id)) volverAlListado('error')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .update({ status: 'draft' })
    .eq('id', id)
    .select('slug')
    .maybeSingle()

  if (error) {
    console.error('No se pudo despublicar:', error.message)
    volverAlListado('error')
  }
  if (!data) volverAlListado('sin-permiso')

  refrescar(data.slug)
  volverAlListado('despublicada')
}

export async function borrarArticulo(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  if (!Number.isFinite(id)) volverAlListado('error')

  const supabase = await createClient()

  // El slug se lee antes de borrar porque despues ya no esta, y hace falta
  // para invalidar las paginas publicas que mostraban la nota.
  const { data: antes } = await supabase
    .from('posts')
    .select('slug, cover_image_url')
    .eq('id', id)
    .maybeSingle()

  const { data: borradas, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('No se pudo borrar la nota:', error.message)
    volverAlListado('error')
  }
  if (!borradas || borradas.length === 0) volverAlListado('sin-permiso')

  // La portada muere con la nota: nadie mas la referencia.
  await borrarDeStorage(antes?.cover_image_url)

  if (antes) refrescar(antes.slug)
  volverAlListado('borrada')
}
