import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/PageHeader'
import { urlAbsoluta } from '@/lib/site'

import { BAJADA, CIERRE, ES_RELLENO, HITOS, INTRO } from './contenido'

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

      {/*
        El aviso solo aparece con el texto de relleno puesto, y desaparece solo
        al cambiar la bandera. Sin el, cualquiera que abra la pagina en una
        vista previa va a creer que asi va a salir publicada.
      */}
      {ES_RELLENO ? (
        <p
          role="status"
          className="border-accent/40 bg-accent/10 text-ink mt-8 max-w-3xl rounded-xl border px-4 py-3 text-sm"
        >
          <b className="font-display tracking-wide uppercase">
            Página en preparación.
          </b>{' '}
          El texto que sigue es de relleno mientras la Liga prepara su historia.
          La página no está indexada en buscadores.
        </p>
      ) : null}

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
          Linea de tiempo con un solo carril.

          El borde vertical vive en el `<ol>` y no en cada `<li>`: puesto en los
          items, el ultimo dejaba el trazo colgando debajo de su punto. Los
          puntos se dibujan con `before` sobre ese borde.
        */}
        <ol className="border-ink/15 mt-8 max-w-[38rem] border-l pl-8">
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
          ¿Quieres jugar?
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </section>
    </div>
  )
}
