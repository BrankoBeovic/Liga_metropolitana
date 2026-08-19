import { FeaturedLayout } from '@/components/articles/FeaturedLayout'
import { RecentGrid } from '@/components/articles/RecentGrid'
import { Hero, ID_ULTIMAS } from '@/components/home/Hero'
import { ReelsCarousel } from '@/components/multimedia/ReelsCarousel'
import { SponsorsSection } from '@/components/sponsors/SponsorsSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getReelsInstagram, REELS_EN_PORTADA } from '@/lib/instagram'
import { INSTAGRAM_HANDLE, SITE_NAME, SITE_TAGLINE } from '@/lib/navigation'
import { getFeedPosts, getHeroPosts } from '@/lib/posts'

/**
 * Revalidacion cada 5 minutos.
 *
 * La pagina se sirve estatica y se regenera en segundo plano. Publicar desde el
 * CMS no espera estos 5 minutos: las acciones de `/admin/noticias` llaman a
 * `revalidatePath('/')` y la invalidan en el momento. Este numero es el
 * respaldo por si esa llamada falla.
 */
export const revalidate = 300

/** Cuantas notas entran en el bloque destacado: 1 grande + 2 en la barra. */
const DESTACADAS = 3

/** Portadas del bloque de barrido rapido. Son las cinco columnas de la grilla. */
const RECIENTES = 5

export default async function Portada() {
  const [destacadas, reels] = await Promise.all([
    getHeroPosts(DESTACADAS),
    getReelsInstagram(REELS_EN_PORTADA),
  ])

  // Depende de las destacadas: hay que saber cuales excluir para no repetirlas.
  const recientes = await getFeedPosts(
    RECIENTES,
    destacadas.map((p) => p.id)
  )

  return (
    <>
      {/*
        El h1 va aca y no dentro del Hero, y es `sr-only`.

        La portada de un medio no tiene un titular propio, y lo que dice el
        nombre de la Liga ya esta dicho en letras de tres metros en el video.
        Escribirlo encima seria decirlo dos veces. Buscadores y lectores de
        pantalla lo reciben igual por esta linea.
      */}
      <h1 className="sr-only">
        {SITE_NAME} - {SITE_TAGLINE}
      </h1>

      <Hero />

      <div className="mx-auto max-w-[1400px] px-5 pt-14 pb-20 sm:px-8 lg:px-10">
        <section id={ID_ULTIMAS} aria-labelledby="destacadas-titulo">
          <SectionHeading id="destacadas-titulo" title="Lo" accent="último" />
          {destacadas.length > 0 ? (
            <FeaturedLayout posts={destacadas} />
          ) : (
            <EmptyState
              title="La portada todavía está vacía"
              description="En cuanto se publique la primera nota desde el panel, aparecerá aquí."
            />
          )}
        </section>

        {/*
          La seccion entera desaparece si no hay Reels, que es el estado normal
          mientras no llegue el token de Instagram: un encabezado sobre un
          carrusel vacio se lee como una parte rota del sitio.
        */}
        {reels.length > 0 ? (
          <section aria-labelledby="reels-titulo" className="mt-16">
            <SectionHeading
              id="reels-titulo"
              title="En"
              accent="Instagram"
              meta={INSTAGRAM_HANDLE}
            />
            <ReelsCarousel items={reels} />
          </section>
        ) : null}

        {recientes.length > 0 ? (
          <section aria-labelledby="recientes-titulo" className="mt-16">
            <SectionHeading
              id="recientes-titulo"
              title="Más"
              accent="noticias"
            />
            <RecentGrid posts={recientes} />
          </section>
        ) : null}

        <div className="mt-20">
          <SponsorsSection />
        </div>
      </div>
    </>
  )
}
