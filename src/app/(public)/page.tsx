import { FeaturedLayout } from '@/components/articles/FeaturedLayout'
import { InscripcionForm } from '@/components/forms/InscripcionForm'
import { Hero } from '@/components/home/Hero'
import { Legado } from '@/components/home/Legado'
import { ReelsCarousel } from '@/components/multimedia/ReelsCarousel'
import { SponsorsSection } from '@/components/sponsors/SponsorsSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getReelsInstagram, REELS_EN_PORTADA } from '@/lib/instagram'
import { INSTAGRAM_HANDLE, SITE_NAME, SITE_TAGLINE } from '@/lib/navigation'
import { getHeroPosts } from '@/lib/posts'

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

/**
 * Portada.
 *
 * El orden de los bloques es una decision editorial y no el orden en que se
 * fueron escribiendo: hero, quienes somos, lo que publicamos a diario, las
 * noticias, quienes nos apoyan y recien al final el pedido de inscripcion.
 * Primero se explica la Liga y despues se le pide algo a quien llego.
 */
export default async function Portada() {
  const [destacadas, reels] = await Promise.all([
    getHeroPosts(DESTACADAS),
    getReelsInstagram(REELS_EN_PORTADA),
  ])

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
        <Legado />

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

        <section
          id="noticias"
          aria-labelledby="destacadas-titulo"
          className="mt-16"
        >
          {/*
            El "Ver todas" reemplaza al bloque "Mas noticias" que estaba aca
            abajo: ahora el resto de las notas vive en `/noticias`, con su
            filtro por categoria, y repetir una grilla de cinco en la portada
            era mostrar dos veces lo mismo.
          */}
          <SectionHeading
            id="destacadas-titulo"
            title="Lo"
            accent="último"
            href="/noticias"
            hrefLabel="Ver todas"
          />
          {destacadas.length > 0 ? (
            <FeaturedLayout posts={destacadas} />
          ) : (
            <EmptyState
              title="La portada todavía está vacía"
              description="En cuanto se publique la primera nota desde el panel, aparecerá aquí."
            />
          )}
        </section>

        <div className="mt-20">
          <SponsorsSection />
        </div>

        {/*
          El formulario de inscripcion cierra la portada.

          Es el mismo `InscripcionForm` de `/inscribete`, sin duplicar nada: la
          Server Action, la validacion y el antispam son los de alla. Lo unico
          que cambia es el envoltorio, porque aca no van los tres pasos ni el
          encabezado de pagina.

          Va ultimo a proposito: pedirle a alguien que inscriba un equipo tiene
          sentido despues de haberle mostrado que es la Liga, que publica y
          quien la apoya, no antes.
        */}
        <section aria-labelledby="inscripcion-titulo" className="mt-20">
          <SectionHeading
            id="inscripcion-titulo"
            title="Súmate a la"
            accent="Liga"
          />
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,38rem)] lg:gap-16">
            <p className="text-ink/75 text-lg leading-relaxed text-pretty">
              Déjanos los datos de tu equipo y la Liga se contacta contigo para
              contarte fechas, sedes y qué necesitas para competir.
            </p>
            <InscripcionForm />
          </div>
        </section>
      </div>
    </>
  )
}
