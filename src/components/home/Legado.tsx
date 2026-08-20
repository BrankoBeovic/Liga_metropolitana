import { SectionHeading } from '@/components/ui/SectionHeading'

import { RESUMEN } from '@/app/(public)/historia/contenido'

/**
 * Bloque "Legado" de la portada: un resumen corto de la historia de la Liga.
 *
 * Va inmediatamente después del hero y antes de todo lo demás. Es lo que
 * responde "qué es esto" a alguien que llegó por primera vez, antes de pedirle
 * que lea noticias o que deje su ficha de jugador.
 *
 * **El texto no está escrito acá.** Sale de `(public)/historia/contenido.ts`,
 * el mismo archivo que alimenta la página `/historia`: así el día que llegue la
 * historia de verdad se reemplaza en un solo lugar y las dos quedan
 * consistentes. Hoy es relleno.
 *
 * Dos columnas desde `md`. Un resumen breve en una sola columna de 608px deja
 * media pantalla vacía justo debajo del hero, que es el peor lugar del sitio
 * para un hueco.
 */
export function Legado() {
  return (
    <section aria-labelledby="legado-titulo">
      <SectionHeading id="legado-titulo" title="Nuestro" accent="legado" />

      <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
        {RESUMEN.map((parrafo) => (
          <p
            key={parrafo.slice(0, 24)}
            className="text-ink/85 text-lg leading-[1.75]"
          >
            {parrafo}
          </p>
        ))}
      </div>
    </section>
  )
}
