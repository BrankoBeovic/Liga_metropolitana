import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PageHeaderProps = {
  titulo: string
  /** Segunda parte del titulo, en el dorado. Opcional. */
  acento?: string
  bajada?: string
  /** Botones o enlaces al pie del encabezado. */
  children?: ReactNode
  className?: string
}

/**
 * Encabezado de una pagina interior.
 *
 * Lo comparten Historia, Documentos, Inscribete y Contacto para que las cuatro
 * arranquen con el mismo ritmo: un `h1` en display, una bajada de ancho de
 * lectura y una linea dorada corta que las separa del contenido.
 *
 * **Sin animacion de entrada.** Es el primer bloque de la pagina y por lo tanto
 * el candidato natural a LCP en las paginas sin foto grande. Un `opacity: 0`
 * inicial corre esa medicion, que es justo lo que CLAUDE.md pide cuidar en el
 * Hero y vale igual aca.
 *
 * El `h1` va en mayusculas porque Bebas Neue no tiene minusculas de verdad: las
 * mapea a versalitas y un titulo en caja mixta sale con la primera letra alta y
 * el resto bajo.
 */
export function PageHeader({
  titulo,
  acento,
  bajada,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('max-w-3xl', className)}>
      <h1 className="font-display text-ink text-5xl leading-[1.05] tracking-wide text-balance uppercase sm:text-7xl">
        {titulo}
        {acento ? <span className="text-accent"> {acento}</span> : null}
      </h1>

      {/* La regla dorada no es decorado suelto: es lo que separa el titulo de
          la bajada sin meter otro tamaño de tipografia en el medio. */}
      <div aria-hidden className="bg-accent mt-5 h-1 w-16 rounded-full" />

      {bajada ? (
        <p className="text-ink/75 mt-5 text-lg leading-relaxed text-pretty">
          {bajada}
        </p>
      ) : null}

      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  )
}
