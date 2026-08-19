import Image from 'next/image'
import Link from 'next/link'

import { SITE_NAME } from '@/lib/navigation'

import { DesktopNav } from './DesktopNav'
import { PanelLink } from './PanelLink'
import { SiteNav } from './SiteNav'

/**
 * Header flotante del sitio publico.
 *
 * Server Component sin consultas: la barra es una lista fija en el codigo, asi
 * que aca no hay nada que leer de la base. La fuente pedia las categorias en
 * cada carga para armar el menu; ese round-trip desaparecio con la decision de
 * la seccion 4 de CLAUDE.md.
 *
 * El glassmorphism necesita las tres cosas juntas: fondo semitransparente,
 * blur y un borde sutil. Sin el borde, el header se funde con el contenido al
 * scrollear, y sobre fondo oscuro eso se nota mas que sobre blanco.
 *
 * **El escudo va acompañado del nombre escrito y no solo.** El escudo ES un
 * lockup con las palabras adentro, pero a 48px de alto sus letras miden menos
 * de cinco pixeles: se lee como una insignia metalica, no como un nombre. El
 * texto al lado es lo que hace legible la marca; el escudo es lo que la hace
 * reconocible.
 */
export function Header() {
  return (
    <header className="bg-canvas/75 sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-10">
        <Link
          href="/"
          /*
            `shrink-0`: la marca nunca se parte ni se encoge.

            `min-h-11` no es decorativo: medido a 360px, el enlace se ajustaba
            al alto del escudo (36px) y quedaba once pixeles por debajo del
            objetivo tactil minimo que pide CLAUDE.md. La altura del contenido
            no alcanza para dimensionar un enlace; hay que pedirla.
          */
          className="focus-visible:ring-accent flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {/*
            El escudo con canal alfa: el fondo del render original quedo
            recortado por luminancia, asi que apoya sobre el canvas sin dejar
            un rectangulo negro alrededor.

            `loading="eager"` porque el header esta arriba de todo y su logo
            no deberia esperar al lazy-loading. No lleva `fetchPriority` ni
            precarga: son 78px de ancho y el que tiene que ganar la carrera por
            el ancho de banda es el poster del Hero, que es el LCP.

            `alt` vacio y aria-hidden: el nombre del sitio ya esta escrito al
            lado, y anunciarlo dos veces en un lector de pantalla es ruido, no
            accesibilidad.
          */}
          <Image
            src="/escudo.png"
            alt=""
            aria-hidden
            width={900}
            height={554}
            loading="eager"
            sizes="(max-width: 640px) 59px, 78px"
            className="h-9 w-auto sm:h-12"
          />
          <span className="font-display text-ink text-lg leading-none tracking-[0.06em] whitespace-nowrap uppercase sm:text-2xl">
            Liga Metropolitana
          </span>
          <span className="sr-only"> - ir al inicio</span>
        </Link>

        <DesktopNav />

        <div className="flex shrink-0 items-center gap-1">
          {/*
            Solo aparece con sesion abierta. Se resuelve en el cliente para no
            sacar al sitio del render estatico.
          */}
          <PanelLink />
          <SiteNav />
        </div>
      </div>

      <span className="sr-only">{SITE_NAME}</span>
    </header>
  )
}
