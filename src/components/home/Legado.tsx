import Link from 'next/link'

import { SectionHeading } from '@/components/ui/SectionHeading'

import { HITOS } from '@/app/(public)/historia/contenido'

/**
 * Bloque "Legado" de la portada: mini linea de tiempo de los hitos de la
 * Liga.
 *
 * Va inmediatamente después del hero y antes de todo lo demás: es lo que
 * responde "qué es esto" a alguien que llegó por primera vez. Antes era un
 * resumen en texto; ahora es solo año + título de cada hito, clickeable hacia
 * el hito completo en `/historia`, para que la introducción sea rapida de
 * escanear y quien quiera el detalle sepa adonde ir.
 *
 * Los hitos no se repiten aca: salen de `HITOS`, la misma lista que arma la
 * línea de tiempo completa de `/historia`, así que agregar o corregir uno se
 * hace en un solo lugar.
 *
 * La barra que conecta los puntos es un solo `div` absoluto detrás de la
 * grilla, no un borde por tarjeta: puesta en cada item, quedaría partida en
 * el espacio entre columnas.
 */
export function Legado() {
  return (
    <section aria-labelledby="legado-titulo">
      <SectionHeading
        id="legado-titulo"
        title="Nuestro"
        accent="legado"
        href="/historia"
        hrefLabel="Ver toda la historia"
      />

      <div className="relative">
        <div
          aria-hidden
          className="bg-ink/15 absolute top-[5px] right-0 left-0 hidden h-px sm:block"
        />

        <ol className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-5 sm:gap-4">
          {HITOS.map((hito) => (
            <li key={hito.id}>
              <Link
                href={`/historia#${hito.id}`}
                className="group focus-visible:ring-accent focus-visible:ring-offset-canvas block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  className="bg-accent relative z-10 mb-3 hidden size-2.5 rounded-full transition-transform duration-300 group-hover:scale-125 sm:block"
                />
                <span className="font-display text-accent block text-sm tracking-wide">
                  {hito.anio}
                </span>
                <span className="font-display text-ink group-hover:text-accent mt-1 block text-base tracking-wide uppercase transition-colors">
                  {hito.titulo}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
