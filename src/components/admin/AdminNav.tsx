'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'

type AdminNavProps = {
  esAdmin: boolean
}

/*
  No hay entrada de "Reels".

  Desde que se leen en vivo de la API de Instagram, no hay nada que administrar:
  lo que se publica en la cuenta aparece en el sitio solo. Una pantalla para
  cargarlos habria seguido aceptando datos que nadie lee.
*/
const ENLACES = [
  { href: '/admin/dashboard', label: 'Inicio', soloAdmin: false },
  { href: '/admin/noticias', label: 'Noticias', soloAdmin: false },
  { href: '/admin/categorias', label: 'Categorías', soloAdmin: true },
  // Sponsors no es exclusivo del admin: lo administra todo el equipo.
  { href: '/admin/sponsors', label: 'Sponsors', soloAdmin: false },
  // Los PDFs de /documentos. Tambien los administra todo el equipo.
  { href: '/admin/documentos', label: 'Documentos', soloAdmin: false },
  { href: '/admin/jugadores', label: 'Jugadores', soloAdmin: false },
  /*
    "Mi perfil" va en la barra y no colgado del nombre del usuario, que seria
    el lugar habitual: ese nombre esta oculto abajo de `sm`, y un unico camino
    que desaparece en telefono no es un camino. Aca funciona en todos los
    anchos, porque la barra scrollea.
  */
  { href: '/admin/perfil', label: 'Mi perfil', soloAdmin: false },
] as const

/**
 * Navegacion del CMS.
 *
 * Las secciones de admin no se muestran al editor. No es seguridad (esa la da
 * RLS y el chequeo de rol en cada pagina): es no ofrecerle una puerta que se
 * le va a cerrar en la cara.
 */
export function AdminNav({ esAdmin }: AdminNavProps) {
  const pathname = usePathname()
  const visibles = ENLACES.filter((e) => esAdmin || !e.soloAdmin)

  return (
    <nav aria-label="Secciones del CMS" className="min-w-0 flex-1">
      <ul className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {visibles.map((enlace) => {
          const activo =
            pathname === enlace.href || pathname.startsWith(`${enlace.href}/`)
          return (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'font-display flex min-h-11 items-center rounded-lg px-3 text-sm font-bold whitespace-nowrap transition-colors',
                  activo
                    ? 'text-accent bg-accent/8'
                    : 'text-ink/60 hover:text-ink'
                )}
              >
                {enlace.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
