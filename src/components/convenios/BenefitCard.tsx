import { ArrowUpRight, HeartHandshake } from 'lucide-react'
import Image from 'next/image'

import type { Benefit } from '@/lib/benefits'

type BenefitCardProps = {
  benefit: Benefit
}

/**
 * Tarjeta de un convenio o beneficio.
 *
 * A diferencia de `SponsorCard` (solo el logo), acá el texto es lo que
 * explica el beneficio, así que la tarjeta lleva nombre y descripción
 * siempre. El logo y el link son opcionales -el seguro médico de la Liga
 * puede no tener ninguno de los dos- y cada uno se dibuja solo si vino.
 */
export function BenefitCard({ benefit }: BenefitCardProps) {
  const contenido = (
    <>
      <div className="flex items-start gap-3">
        {benefit.logo_url ? (
          <Image
            src={benefit.logo_url}
            alt=""
            aria-hidden
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-contain ring-1 ring-white/10"
          />
        ) : (
          <span
            aria-hidden
            className="bg-accent/15 text-accent flex size-12 shrink-0 items-center justify-center rounded-lg"
          >
            <HeartHandshake className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-ink text-xl leading-tight tracking-wide uppercase">
            {benefit.name}
          </h3>
        </div>
      </div>

      <p className="text-ink/70 mt-3 text-sm leading-relaxed">
        {benefit.description}
      </p>
    </>
  )

  const clases =
    'bg-editorial flex h-full flex-col rounded-2xl p-5 ring-1 ring-white/10'

  if (!benefit.link_url) {
    return <article className={clases}>{contenido}</article>
  }

  return (
    <a
      href={benefit.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${clases} focus-visible:ring-accent transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none`}
    >
      {contenido}
      <span className="text-accent mt-auto flex items-center gap-1 pt-5 text-xs font-medium">
        Más información
        <ArrowUpRight aria-hidden className="size-3.5" />
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </span>
    </a>
  )
}
