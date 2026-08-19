import { getSponsors } from '@/lib/posts'

import { SponsorCard } from './SponsorCard'

/**
 * Bloque de sponsors de la portada.
 *
 * Modulo propio, sin scripts de terceros ni redes publicitarias: los logos
 * salen de nuestra base y las imagenes de nuestro Storage. Eso evita el
 * JavaScript de terceros que suele arruinar los Core Web Vitals y el
 * seguimiento de los lectores por parte de una red publicitaria.
 *
 * Los sponsors de este proyecto son solo esto: logos en la landing. No hay
 * espacios vendidos en la nota ni banners laterales (CLAUDE.md seccion 4).
 *
 * Si no hay sponsors activos no renderiza nada. Un titulo de seccion sobre una
 * grilla vacia se ve peor que la ausencia de la seccion.
 */
export async function SponsorsSection() {
  const sponsors = await getSponsors()
  if (sponsors.length === 0) return null

  return (
    <section
      aria-labelledby="sponsors-titulo"
      className="border-t border-white/10 pt-10"
    >
      <h2
        id="sponsors-titulo"
        className="font-display text-ink/60 text-center text-xs tracking-[0.2em] uppercase"
      >
        Con el apoyo de
      </h2>

      <ul className="mt-8 grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {sponsors.map((sponsor) => (
          <li key={sponsor.id} className="flex">
            <SponsorCard sponsor={sponsor} />
          </li>
        ))}
      </ul>
    </section>
  )
}
