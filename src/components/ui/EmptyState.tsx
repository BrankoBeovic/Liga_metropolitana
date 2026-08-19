import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type EmptyStateProps = {
  title: string
  description?: string
  /** Sobre fondo editorial oscuro invierte los colores. */
  dark?: boolean
  children?: ReactNode
  className?: string
}

/**
 * Estado vacio.
 *
 * El logo de marca entra en la Etapa 5. Hasta entonces el hueco se marca con
 * un recuadro punteado y el texto, sin un archivo de imagen que todavia no
 * existe.
 */
export function EmptyState({
  title,
  description,
  dark = false,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center',
        dark ? 'border-white/15' : 'border-black/10',
        className
      )}
    >
      <p
        className={cn(
          'font-display mt-1 text-base font-bold tracking-tight',
          dark ? 'text-white' : 'text-ink'
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            'mt-1.5 max-w-sm text-sm',
            dark ? 'text-white/60' : 'text-ink/60'
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
