import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { Marca } from './Marca'

type EmptyStateProps = {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/**
 * Estado vacio con la pelota.
 *
 * La marca hace un trabajo concreto aca: ocupa el hueco de una seccion que
 * todavia no tiene contenido, que es justo el momento donde no hay nada que
 * tapar. A baja opacidad y en escala de grises para que se lea como ausencia y
 * no como una tarjeta mas.
 *
 * Ya no tiene la variante `dark` de la fuente: el sitio publico es oscuro
 * entero, asi que no hay dos fondos contra los que decidir el color. El CMS,
 * que es claro, tambien usa este componente y lo resuelve la cascada: la clase
 * `.tema-claro` del layout de `(admin)` redefine `--color-ink`, y estas
 * utilidades emiten `var()`.
 */
export function EmptyState({
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-ink/15 flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center',
        className
      )}
    >
      <Marca className="size-14 opacity-25 grayscale" />
      <p className="font-display text-ink mt-5 text-lg tracking-wide uppercase">
        {title}
      </p>
      {description ? (
        <p className="text-ink/60 mt-1.5 max-w-sm text-sm">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
