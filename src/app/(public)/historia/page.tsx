import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/PageHeader'
import { urlAbsoluta } from '@/lib/site'

import { ACTA, BAJADA, CIERRE, ES_RELLENO, HITOS, INTRO } from './contenido'

const TITULO = 'Historia'

/**
 * `noindex` mientras el texto sea de relleno.
 *
 * La bandera sale de `contenido.ts`, que es donde vive el texto: asi la pagina
 * deja de esconderse en el mismo commit en que aparece la historia de verdad,
 * y no queda escondida para siempre porque nadie se acordo de volver aca.
 *
 * Falta la tercera pata cuando llegue el texto: agregar `/historia` a
 * `src/app/sitemap.ts`.
 */
export const metadata: Metadata = {
  title: TITULO,
  description: ES_RELLENO ? undefined : BAJADA,
  alternates: { canonical: urlAbsoluta('/historia') },
  ...(ES_RELLENO ? { robots: { index: false, follow: false } } : {}),
}

export default function HistoriaPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante.

        La barra es `fixed`, o sea que esta fuera del flujo y no empuja nada
        hacia abajo. En la portada eso es lo que se busca -el video llega al
        borde de la pantalla- pero en una pagina interior el titulo nacia
        debajo de la pildora. Medido: la barra ocupa hasta 71px desde arriba.
      */}
      <PageHeader titulo="Historia" bajada={BAJADA} />

      <div className="mt-12 max-w-[38rem]">
        {INTRO.map((parrafo) => (
          <p
            key={parrafo.slice(0, 24)}
            className="text-ink/85 mt-5 text-lg leading-[1.75] first:mt-0"
          >
            {parrafo}
          </p>
        ))}
      </div>

      <section aria-labelledby="hitos-titulo" className="mt-16">
        <h2
          id="hitos-titulo"
          className="font-display text-ink text-3xl tracking-wide uppercase"
        >
          En el <span className="text-accent">tiempo</span>
        </h2>

        {/*
          La linea de tiempo a la izquierda y el acta a la derecha.

          La columna de la izquierda queda topada en 38rem, que es la medida de
          lectura del sitio (CLAUDE.md seccion 4): la linea de tiempo es texto y
          no puede ensancharse solo porque al lado haya una foto.

          Recien desde `lg` se ponen lado a lado. Abajo de eso el acta va
          debajo, porque en un telefono una foto vertical al lado de un texto
          deja las dos cosas ilegibles.
        */}
        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] lg:gap-16">
          {/*
            Linea de tiempo con un solo carril.

            El borde vertical vive en el `<ol>` y no en cada `<li>`: puesto en
            los items, el ultimo dejaba el trazo colgando debajo de su punto.
            Los puntos se dibujan con `before` sobre ese borde.
          */}
          <ol className="border-ink/15 border-l pl-8">
            {HITOS.map((hito) => (
              <li
                key={hito.anio}
                className="relative mt-10 before:absolute before:top-2 before:-left-[calc(2rem+5px)] before:size-2.5 before:rounded-full before:bg-[var(--color-accent)] first:mt-8"
              >
                <p className="font-display text-accent text-2xl tracking-wide">
                  {hito.anio}
                </p>
                <h3 className="font-display text-ink mt-1 text-xl tracking-wide uppercase">
                  {hito.titulo}
                </h3>
                <p className="text-ink/75 mt-2 leading-relaxed">{hito.texto}</p>
              </li>
            ))}
          </ol>

          {/*
            El acta acompaña el recorrido: `sticky` desde `lg`, para que siga
            en pantalla mientras se baja por los hitos. `self-start` es lo que
            lo hace posible; sin eso el item del grid se estira a lo alto de la
            fila y un elemento tan alto como su contenedor nunca se pega.

            `top-24` deja libre la barra flotante, que ocupa hasta 71px.
          */}
          <figure className="mx-auto max-w-md lg:sticky lg:top-24 lg:mx-0 lg:max-w-none lg:self-start">
            {/*
              La foto entera es el enlace, y va a la imagen original.

              El acta es un manuscrito: al ancho de la columna no se alcanza a
              leer, y la unica forma de leerla de verdad es abrirla en grande.
              Un enlace al archivo hace eso sin lightbox, sin JavaScript y sin
              romper el "abrir en otra pestaña" del navegador.

              `<a>` y no `<Link>`: apunta a un archivo, no a una ruta de la
              aplicacion, igual que los PDF del CMS.
            */}
            <a
              href={ACTA.src}
              target="_blank"
              rel="noopener noreferrer"
              className="group focus-visible:ring-accent focus-visible:ring-offset-canvas block rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
            >
              <Image
                src={ACTA.src}
                alt={ACTA.alt}
                width={ACTA.ancho}
                height={ACTA.alto}
                sizes="(min-width: 1024px) 40rem, (min-width: 640px) 28rem, 100vw"
                className="w-full rounded-2xl ring-1 ring-white/10 transition-[box-shadow,transform] duration-300 group-hover:scale-[1.01] group-hover:ring-white/25"
              />

              <span className="font-display text-ink/70 group-hover:text-accent mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs tracking-[0.14em] uppercase transition-colors">
                {ACTA.enlace}
                <ArrowUpRight aria-hidden className="size-3.5" />
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </span>
            </a>

            <figcaption className="text-ink/60 mt-2 max-w-sm text-sm leading-relaxed">
              <b className="text-ink/85 font-normal">{ACTA.epigrafe}</b>{' '}
              {ACTA.detalle}
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        aria-labelledby="cierre-titulo"
        className="bg-editorial mt-16 max-w-3xl rounded-2xl p-6 ring-1 ring-white/10 sm:p-8"
      >
        <h2
          id="cierre-titulo"
          className="font-display text-ink text-2xl tracking-wide uppercase"
        >
          {CIERRE.titulo}
        </h2>
        <p className="text-ink/75 mt-3 leading-relaxed">{CIERRE.texto}</p>

        <Link
          href="/jugadores"
          className="font-display bg-accent text-canvas hover:bg-accent-light focus-visible:ring-accent focus-visible:ring-offset-editorial mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {CIERRE.boton}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </section>
    </div>
  )
}
