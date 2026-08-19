import { ArrowDown } from 'lucide-react'

import { InstagramIcon } from '@/components/ui/BrandIcons'
import { INSTAGRAM_URL } from '@/lib/navigation'

import { HeroVideo } from './HeroVideo'

/**
 * Id del bloque de noticias, para el ancla del boton principal del Hero.
 *
 * Se exporta para que la portada lo ponga en la seccion y las dos puntas del
 * salto no puedan quedar desincronizadas: un ancla rota no da error, solo no
 * hace nada, que es la peor forma de romperse.
 */
export const ID_ULTIMAS = 'ultimas'

/**
 * Hero de la portada.
 *
 * **No hay titular visible encima del video, y es a proposito.** El video es el
 * escudo: dice "LIGA METROPOLITANA" en letras de tres metros. Escribir el mismo
 * nombre encima seria decirlo dos veces y pelearle el centro de la imagen. El
 * h1 de la pagina existe, vive en `page.tsx` y es `sr-only`: buscadores y
 * lectores de pantalla lo reciben igual.
 *
 * **Nada aca arranca en `opacity: 0`.** Es la excepcion critica que fija
 * CLAUDE.md seccion 3: el Hero es lo que mide el LCP, y una animacion de
 * entrada -aunque dure medio segundo- corre esa medicion. Todo el bloque se
 * pinta en su lugar definitivo desde el HTML del servidor.
 *
 * El alto va en `svh` y no en `vh`: en un telefono, `100vh` cuenta la barra de
 * direcciones como si no existiera, asi que el Hero queda mas alto que la
 * pantalla y el borde inferior -donde estan los botones- nace fuera de vista.
 */
export function Hero() {
  return (
    <section
      aria-label="Liga Metropolitana"
      className="relative flex h-[70svh] max-h-[760px] min-h-[440px] w-full items-end overflow-hidden"
    >
      <HeroVideo />

      {/*
        Dos scrims, cada uno con su trabajo.

        El de abajo funde el video con el canvas para que el Hero no termine en
        un corte recto contra el fondo de la pagina. El plano, muy suave,
        oscurece el video entero: sin el, un cuadro claro del video dejaba la
        bajada en 3:1 contra el fondo. Los dos son `aria-hidden` porque no
        aportan nada que leer.
      */}
      <div
        aria-hidden
        className="from-canvas via-canvas/45 absolute inset-0 bg-gradient-to-t to-transparent to-75%"
      />
      <div aria-hidden className="bg-canvas/25 absolute inset-0" />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-10 sm:px-8 sm:pb-14 lg:px-10">
        {/*
          Es el eslogan de `SITE_TAGLINE`, escrito aca en dos partes para poder
          pintar la segunda en el dorado. Si se cambia uno hay que cambiar el
          otro: no se compone desde la constante porque partir una cadena por
          una palabra en runtime es fragil y no aporta nada.
        */}
        <p className="font-display text-ink max-w-2xl text-3xl leading-[1.05] tracking-wide text-balance uppercase sm:text-5xl">
          El maxibásquetbol chileno{' '}
          <span className="text-accent">desde 1989</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/*
            Ancla y no enlace a otra pagina: lleva al bloque de noticias de esta
            misma portada, que es lo que la mayoria vino a buscar.
          */}
          <a
            href={`#${ID_ULTIMAS}`}
            className="font-display bg-accent text-canvas hover:bg-accent-light focus-visible:ring-accent focus-visible:ring-offset-canvas flex min-h-11 items-center gap-2 rounded-full px-5 text-sm tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Últimas noticias
            <ArrowDown aria-hidden className="size-4" />
          </a>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className="font-display text-ink hover:bg-ink/10 focus-visible:ring-accent focus-visible:ring-offset-canvas flex min-h-11 items-center gap-2 rounded-full px-5 text-sm tracking-[0.12em] uppercase ring-1 ring-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <InstagramIcon className="size-4" />
            Instagram
            <span className="sr-only">
              {' '}
              (se abre en Instagram, en una pestaña nueva)
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
