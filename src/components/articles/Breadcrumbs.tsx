import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { SITE_URL } from '@/lib/site'

export type Miga = {
  label: string
  /** Ruta relativa. Sin `href` la miga se dibuja como texto, no como enlace. */
  href?: string
}

type BreadcrumbsProps = {
  items: readonly Miga[]
}

/**
 * Breadcrumbs con su JSON-LD `BreadcrumbList`.
 *
 * El structured data va junto al marcado visible y no suelto en la pagina, asi
 * no se pueden desincronizar: si alguien cambia las migas, cambia el JSON-LD en
 * el mismo lugar. Google exige que el JSON-LD describa contenido que el usuario
 * efectivamente ve.
 *
 * Las URLs del JSON-LD tienen que ser absolutas, aunque los enlaces del marcado
 * sean relativos.
 *
 * **Una miga sin `href` es un caso normal aca, no una excepcion**: este sitio
 * no tiene paginas de categoria (CLAUDE.md seccion 4), asi que la categoria de
 * la nota se muestra como texto. Un `ListItem` sin `item` es valido en el
 * esquema y es exactamente lo que corresponde: describe un escalon de la
 * jerarquia que no tiene pagina propia.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // El contenido es un objeto que armamos nosotros, no entrada de
        // usuario. Se escapa `<` igual, por si un titulo trae markup.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <nav aria-label="Migas de pan">
        <ol className="text-ink/60 flex flex-wrap items-center gap-1 text-xs">
          {items.map((item, i) => {
            const ultima = i === items.length - 1
            return (
              <li key={item.label} className="flex items-center gap-1">
                {item.href && !ultima ? (
                  <Link
                    href={item.href}
                    className="hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={ultima ? 'page' : undefined}
                    className="text-ink/75"
                  >
                    {item.label}
                  </span>
                )}
                {!ultima ? (
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 shrink-0 opacity-50"
                  />
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
