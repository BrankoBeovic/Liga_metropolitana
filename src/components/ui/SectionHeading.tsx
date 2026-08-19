import Link from 'next/link'

import { cn } from '@/lib/cn'

import { RevealText } from './RevealText'

type SectionHeadingProps = {
  /** Va en el h2, para que la seccion lo referencie con aria-labelledby. */
  id?: string
  /** Primera parte del titulo, en color de texto normal. */
  title: string
  /** Segunda parte, en color de acento. "Lo" + "último". */
  accent?: string
  subtitle?: string
  /** Nota al margen derecho: "Actualizado hoy". */
  meta?: string
  href?: string
  hrefLabel?: string
  className?: string
}

/**
 * Encabezado de seccion.
 *
 * El titulo se parte en dos para poder pintar la segunda palabra con el color
 * de acento. El acento cae siempre en la palabra que identifica la seccion, no
 * en la primera.
 *
 * Sin la variante `dark` de la fuente: aca todo el sitio es oscuro, asi que no
 * hay dos juegos de color que elegir.
 *
 * El titulo no lleva `tracking` propio: en mayusculas, el espaciado que trae
 * Exo alcanza, y sumarle mas separa las palabras hasta que un titulo de dos
 * partes deja de leerse como una unidad.
 */
export function SectionHeading({
  id,
  title,
  accent,
  subtitle,
  meta,
  href,
  hrefLabel = 'Ver todo',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2',
        className
      )}
    >
      <div className="min-w-0">
        <h2
          id={id}
          className="font-display text-ink text-2xl leading-tight tracking-wide uppercase sm:text-3xl"
        >
          <RevealText>
            {title}
            {accent ? <span className="text-accent"> {accent}</span> : null}
          </RevealText>
        </h2>

        {subtitle ? (
          <p className="text-ink/60 mt-1.5 text-[13px]">{subtitle}</p>
        ) : null}
      </div>

      {meta || href ? (
        <div className="flex shrink-0 items-center gap-4">
          {meta ? (
            <span className="text-ink/60 text-[13px]">{meta}</span>
          ) : null}
          {href ? (
            <Link
              href={href}
              className="font-display text-ink/60 hover:text-accent flex min-h-11 items-center text-xs tracking-[0.16em] uppercase transition-colors"
            >
              {hrefLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
