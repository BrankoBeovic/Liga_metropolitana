import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type BadgeVariant = 'accent' | 'glass' | 'outline'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  /**
   * Categoria de la nota, estado activo.
   *
   * Texto oscuro sobre el dorado, no blanco. Medido: blanco sobre `#D4A03D`
   * da 2.36:1 y no llega ni cerca de AA; el canvas sobre el mismo dorado da
   * 8.29:1. El dorado del sistema es un color claro, aunque el sitio sea
   * oscuro, y eso invierte la regla habitual.
   */
  accent: 'bg-accent text-canvas',
  /**
   * Glassmorphism para badges apoyados sobre una portada. El fondo
   * semitransparente mas el blur mantienen legible el texto sin importar que
   * haya debajo.
   */
  glass: 'bg-canvas/55 text-ink backdrop-blur-md ring-1 ring-white/20',
  outline: 'text-ink ring-1 ring-white/15',
}

/**
 * Etiqueta corta en tipografia display.
 *
 * Server Component: no tiene estado ni interaccion.
 *
 * Sin `font-bold`: Bebas Neue tiene un solo peso (400). Pedir negrita hace que
 * el navegador la sintetice engordando los trazos, que en una tipografia ya
 * condensada cierra los contraformas y ensucia el texto en mayusculas.
 */
export function Badge({ children, variant = 'accent', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-display inline-flex items-center rounded-full px-3 py-1 text-xs tracking-[0.14em] uppercase',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
