import Image from 'next/image'

import { FeaturedLayout } from '@/components/articles/FeaturedLayout'
import { JugadorForm } from '@/components/forms/JugadorForm'
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

/** Cuantas notas entran en el bloque destacado: 1 grande + 3 en la barra. */
const DESTACADAS = 4

/**
 * Portada.
 *
 * El orden de los bloques es una decision editorial y no el orden en que se
 * fueron escribiendo: hero, quienes somos, lo que publicamos a diario, las
 * noticias, quienes nos apoyan y recien al final el llamado a jugadores sin
 * equipo. Primero se explica la Liga y despues se le pide algo a quien llego.
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
          Sin token de Instagram igual hay Reels de muestra, para que el
          carrusel se pueda mostrar. Si la lista llegara vacia (un fallo al
          armar la muestra), el encabezado no se dibuja: un titulo sobre un
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
            title="Solo"
            accent="noticias"
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
          El formulario de jugadores cierra la portada.

          Es el mismo `JugadorForm` de `/jugadores`, sin duplicar nada: la
          Server Action, la validacion y el antispam son los de alla. Lo unico
          que cambia es el envoltorio, porque aca no van los tres pasos ni el
          encabezado de pagina.

          Va ultimo a proposito: pedirle a alguien que deje su ficha tiene
          sentido despues de haberle mostrado que es la Liga, que publica y
          quien la apoya, no antes.
        */}
        <section aria-labelledby="jugadores-titulo" className="mt-20">
          {/*
            Sin enlace a `/jugadores`, a diferencia del encabezado de noticias.

            Alla el "Ver todas" lleva a algo que no esta en la portada. Aca el
            formulario completo esta justo debajo, asi que el enlace mandaba a
            otra pagina a hacer lo mismo que ya se podia hacer sin moverse.
          */}
          <SectionHeading
            id="jugadores-titulo"
            title="¿Quieres jugar pero no tienes"
            accent="equipo?"
          />
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,38rem)] lg:gap-16">
            <div>
              <p className="text-ink/75 text-lg leading-relaxed text-pretty">
                Si quieres jugar y no tienes club, déjanos tus datos. La Liga te
                contacta cuando un equipo esté buscando gente en tu puesto. El
                RUT no se publica: lo ve solo el equipo de la Liga.
              </p>

              {/*
                La foto llena la columna que quedaba vacia al lado del
                formulario, y ademas hace un trabajo concreto: muestra a que se
                esta apuntando uno cuando deja sus datos.

                **El archivo mide 1600px de ancho, y el numero no es al azar.**
                El hueco llega a 648px, o sea 1296 en una pantalla de densidad
                doble. La primera version de esta foto tenia 617px de ancho y el
                navegador la estiraba un 60% para llenarlo: se veia blanda.
                1600 cubre el peor caso con margen y pesa 294 KB.

                **Se recorta a 4:3 y el original es vertical (1600x1999).** El
                recorte se corre al 35% de la altura: centrado, la punta de la
                copa quedaba pegada al borde de arriba y se leia como cortada.
                Subirlo deja la copa entera con aire y se lleva un poco mas de
                pierna abajo, que es exactamente el cambio que pidio el equipo.

                El 35% no es tanteo: el rango de desplazamiento son 799px -la
                altura del archivo menos la ventana visible de 1200- y el 35%
                cae en 280, que es el recorte que se genero con ffmpeg y se
                miro antes de escribirlo. Si se cambia la foto, hay que rehacer
                esa cuenta con las medidas nuevas.

                `loading` queda en el `lazy` por defecto: esta seccion cierra la
                portada, muy por debajo del pliegue, y pedirla temprano solo le
                robaria ancho de banda al video del Hero (CLAUDE.md seccion 4).
              */}
              <Image
                src="/campeones-2025.jpg"
                alt="El equipo campeón de la Liga celebrando con la copa en alto en el centro de la cancha."
                width={1600}
                height={1999}
                sizes="(min-width: 1024px) 40rem, 100vw"
                className="mt-8 aspect-[4/3] w-full rounded-2xl object-cover object-[center_35%] ring-1 ring-white/10"
              />
            </div>
            <JugadorForm />
          </div>
        </section>
      </div>
    </>
  )
}
