'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'
import { NAV_LINKS } from '@/lib/navigation'

/**
 * Barra de navegacion para escritorio.
 *
 * Los enlaces salen de `NAV_LINKS`, que es una lista fija en el codigo: son
 * paginas del sitio, no categorias de noticias (decision registrada en
 * CLAUDE.md). Por eso no hay desplegable "Más" ni reparto entre barra y menu:
 * la fuente los necesitaba para nueve secciones que pedian 1626px; aca son
 * cuatro y entran holgadas.
 *
 * Es cliente unicamente por `usePathname`, que es lo que marca la seccion
 * activa. Resolverlo en el servidor obligaria a leer la URL en el layout y eso
 * saca al sitio del render estatico.
 */
export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Secciones del sitio"
      className="hidden min-w-0 items-center md:flex"
    >
      <ul className="flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const activo = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'font-display flex min-h-11 items-center rounded-full px-3 text-[15px] tracking-[0.08em] whitespace-nowrap uppercase transition-colors',
                  activo ? 'text-accent' : 'text-ink/75 hover:text-accent-light'
                )}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
