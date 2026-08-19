'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'

import { InstagramIcon } from '@/components/ui/BrandIcons'
import { cn } from '@/lib/cn'
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  NAV_LINKS,
  SITE_NAME,
} from '@/lib/navigation'

/**
 * Navegacion en panel lateral, para los anchos donde la barra no se muestra.
 *
 * Se esconde desde `md`, que es donde `DesktopNav` ya lista las cuatro
 * secciones: tener barra y boton de menu al mismo tiempo ofrece dos caminos al
 * mismo lugar.
 *
 * El panel es Radix y no un div con `useState`: trae cierre con Escape, foco
 * atrapado dentro del panel, `aria-modal` y el scroll de la pagina bloqueado
 * mientras esta abierto. Un panel hecho a mano casi siempre se olvida de
 * alguna de esas.
 *
 * Sin estado propio: se cierra porque cada enlace esta envuelto en un
 * `Dialog.Close`. La alternativa era un efecto que llamara a setState al
 * cambiar el pathname, que dispara un render en cascada y que ademas la regla
 * del React Compiler marca como error.
 */
export function SiteNav() {
  const pathname = usePathname()

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Abrir menú"
        className="text-ink flex min-h-11 items-center gap-2 rounded-full px-3 transition-colors hover:bg-white/10 md:hidden"
      >
        <Menu className="size-6" aria-hidden />
        <span className="font-display hidden text-sm tracking-[0.1em] uppercase sm:inline">
          Menú
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'bg-editorial fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col',
            'shadow-2xl ring-1 ring-white/10'
          )}
        >
          <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
          <Dialog.Description className="sr-only">
            Secciones de {SITE_NAME}.
          </Dialog.Description>

          <div className="flex items-center justify-end border-b border-white/10 p-4">
            <Dialog.Close
              aria-label="Cerrar menú"
              className="text-ink flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <X className="size-6" aria-hidden />
            </Dialog.Close>
          </div>

          <nav
            aria-label="Navegación principal"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <p className="font-display text-ink/60 px-3 text-xs tracking-[0.2em] uppercase">
              El sitio
            </p>
            <ul className="mt-2">
              {NAV_LINKS.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  activo={pathname === link.href}
                >
                  {link.label}
                </NavItem>
              ))}
            </ul>

            {/*
              Instagram cierra el panel porque es el canal donde la Liga
              publica a diario: en la practica es una seccion mas, aunque viva
              fuera del sitio. Va con su handle a la vista y no solo con el
              icono, que aca hay ancho de sobra para escribirlo.
            */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="me noopener noreferrer"
              className="text-ink/75 hover:text-ink mt-8 flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors hover:bg-white/10"
            >
              <InstagramIcon className="size-5" />
              {INSTAGRAM_HANDLE}
              <span className="sr-only">
                {' '}
                (se abre en Instagram, en una pestaña nueva)
              </span>
            </a>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function NavItem({
  href,
  activo,
  children,
}: {
  href: string
  activo: boolean
  children: ReactNode
}) {
  return (
    <li>
      {/*
        `asChild` hace que Radix use el Link como disparador de cierre en vez de
        envolverlo en un boton, asi el panel se cierra al navegar sin duplicar
        elementos interactivos.
      */}
      <Dialog.Close asChild>
        <Link
          href={href}
          aria-current={activo ? 'page' : undefined}
          // min-h-11: los 44px de area tactil que pide CLAUDE.md.
          className={cn(
            'font-display flex min-h-11 items-center rounded-lg px-3 text-xl tracking-[0.06em] uppercase transition-colors',
            activo ? 'text-accent' : 'text-ink hover:bg-white/10'
          )}
        >
          {children}
        </Link>
      </Dialog.Close>
    </li>
  )
}
