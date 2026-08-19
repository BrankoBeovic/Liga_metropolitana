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
 * El menú de las pantallas angostas: un panel lateral.
 *
 * **La píldora que se despliega en horizontal no sirve acá, y está medido**: en
 * una pantalla de 360px los seis enlaces se dibujaban entre x=290 y x=970, o sea
 * los seis fuera de la pantalla. Necesitan 736px de ancho y no hay forma de que
 * entren.
 *
 * Por eso el corte es `lg` y no `md`: a 768px el header deja 704px útiles y la
 * píldora pide 736. Recién a partir de 1024 entra con aire.
 *
 * El panel es Radix y no un `div` con `useState`: trae cierre con Escape, foco
 * atrapado adentro, el resto de la página marcado como oculto para el lector de
 * pantalla y el scroll bloqueado mientras está abierto. Un panel hecho a mano
 * casi siempre se olvida de alguna de esas.
 *
 * Sin estado propio: se cierra porque cada enlace está envuelto en un
 * `Dialog.Close`. La alternativa era un efecto que llamara a `setState` al
 * cambiar el pathname, que dispara un render en cascada y que además la regla
 * del React Compiler marca como error.
 */
export function MenuLateral() {
  const pathname = usePathname()

  return (
    <Dialog.Root>
      {/*
        El disparador es la misma pastilla de vidrio que el botón de escritorio:
        la barra flota sobre el video y necesita su propio fondo para no perderse
        contra un cuadro claro.
      */}
      <Dialog.Trigger
        aria-label="Abrir menú"
        className="bg-canvas/70 text-ink focus-visible:ring-accent flex size-12 items-center justify-center rounded-full ring-1 ring-white/15 backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
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
                  // Comparación exacta: con `startsWith`, "Inicio" quedaría
                  // marcado como activo en todas las páginas del sitio.
                  activo={pathname === link.href}
                >
                  {link.label}
                </NavItem>
              ))}
            </ul>

            {/*
              Instagram cierra el panel porque es el canal donde la Liga publica
              a diario: en la práctica es una sección más, aunque viva fuera del
              sitio. Va con su handle a la vista y no solo con el icono, que acá
              hay ancho de sobra para escribirlo.
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
        envolverlo en un botón, así el panel se cierra al navegar sin duplicar
        elementos interactivos.
      */}
      <Dialog.Close asChild>
        <Link
          href={href}
          aria-current={activo ? 'page' : undefined}
          // min-h-11: los 44px de área táctil que pide CLAUDE.md.
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
