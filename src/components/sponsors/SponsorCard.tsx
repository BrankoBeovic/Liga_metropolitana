import Image from 'next/image'

import type { Sponsor } from '@/lib/posts'

type SponsorCardProps = {
  sponsor: Sponsor
}

/**
 * Tarjeta de sponsor: solo el logo, enlazado al sitio de la marca.
 *
 * `rel="sponsored noopener noreferrer"` no es opcional: `sponsored` le dice a
 * Google que el enlace es una relacion comercial, y sin eso el sitio queda
 * expuesto a una penalizacion por enlaces pagos sin declarar.
 *
 * El logo arranca en escala de grises y recupera el color en hover: los logos
 * de distintas marcas juntos pelean entre si por atencion y ensucian la pagina.
 * En gris conviven, y el color vuelve cuando alguien se interesa.
 *
 * **`brightness-0 invert` antes del gris**: la mayoria de los logos llegan
 * pensados para fondo claro, o sea en negro o en colores oscuros, y sobre el
 * canvas de este sitio desaparecen. El filtro los aplana a blanco, que es el
 * tratamiento habitual de una barra de auspiciadores sobre oscuro. El color
 * real vuelve en el hover, donde ya hay atencion puesta.
 */
export function SponsorCard({ sponsor }: SponsorCardProps) {
  return (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="focus-visible:ring-accent group flex min-h-24 w-full items-center justify-center rounded-xl px-6 py-5 ring-1 ring-white/10 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:outline-none"
    >
      <Image
        src={sponsor.logo_url}
        alt={sponsor.name}
        width={160}
        height={64}
        sizes="160px"
        className="h-12 w-auto object-contain opacity-70 brightness-0 invert transition duration-300 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0"
      />
    </a>
  )
}
