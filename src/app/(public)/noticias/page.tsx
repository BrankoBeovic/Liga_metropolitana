import type { Metadata } from 'next'

import { ListaNoticias } from '@/components/noticias/ListaNoticias'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getCategories } from '@/lib/categories'
import { getFeedPosts } from '@/lib/posts'
import { urlAbsoluta } from '@/lib/site'

/**
 * Revalidacion cada 5 minutos, igual que la portada.
 *
 * Publicar desde el CMS no espera: las acciones de `/admin/noticias` invalidan
 * esta ruta en el momento. Este numero es el respaldo por si esa llamada falla.
 */
export const revalidate = 300

/**
 * Tope de noticias que se traen.
 *
 * No hay paginado, y con el volumen de una liga -decenas de notas por
 * temporada- no hace falta: sesenta tarjetas pesan poco y el filtro por
 * categoria es instantaneo porque ya estan todas en la pagina.
 *
 * El dia que esto se acerque al tope hay que paginar de verdad, no subir el
 * numero: sesenta tarjetas con su portada ya son varios cientos de kilobytes
 * de imagenes.
 */
const MAXIMO = 60

const TITULO = 'Noticias'
const BAJADA =
  'Todo lo que pasa en la Liga Metropolitana: resultados, calendario y novedades institucionales.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/noticias') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/noticias'),
  },
}

export default async function NoticiasPage() {
  const [noticias, categorias] = await Promise.all([
    getFeedPosts(MAXIMO),
    getCategories(),
  ])

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante, que al ser
        `fixed` esta fuera del flujo y no empuja nada hacia abajo.
      */}
      <PageHeader titulo="Noticias" bajada={BAJADA} />

      {noticias.length > 0 ? (
        <div className="mt-10">
          {/*
            Las categorias se pasan desde el servidor y no se deducen de las
            noticias: asi los dos filtros existen desde el primer dia, incluso
            antes de que se publique la primera nota institucional. Deducirlas
            del contenido haria aparecer y desaparecer botones segun lo que haya
            publicado, que se lee como un error.
          */}
          <ListaNoticias noticias={noticias} categorias={categorias} />
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          title="Todavía no hay noticias publicadas"
          description="En cuanto se publique la primera nota desde el panel, va a aparecer acá."
        />
      )}
    </div>
  )
}
