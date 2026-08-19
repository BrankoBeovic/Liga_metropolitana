import { SectionHeading } from '@/components/ui/SectionHeading'

import { ES_RELLENO, RESUMEN } from '@/app/(public)/historia/contenido'

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

      {/*
        El aviso solo aparece mientras el texto sea de relleno, y desaparece
        solo al cambiar la bandera en `contenido.ts`. Sin él, cualquiera que
        mire la portada va a creer que así va a salir publicada.
      */}
      {ES_RELLENO ? (
        <p
          role="status"
          className="border-accent/40 bg-accent/10 text-ink mb-6 max-w-3xl rounded-xl border px-4 py-3 text-sm"
        >
          <b className="font-display tracking-wide uppercase">
            Texto de relleno.
          </b>{' '}
          Se reemplaza en <code>historia/contenido.ts</code> cuando la Liga
          entregue su reseña.
        </p>
      ) : null}

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
