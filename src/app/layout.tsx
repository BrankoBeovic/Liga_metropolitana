import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * Layout raiz PROVISORIO, solo para que las cuatro compuertas de la Etapa 1
 * (type-check, lint, format:check, build) tengan algo que verificar.
 * Se reemplaza en la Etapa 5 por los dos layouts definitivos, (public) y
 * (admin), con sus fuentes y su metadata.
 */
export const metadata: Metadata = {
  title: 'Liga Metropolitana',
  description: 'El maxibasquetbol chileno desde 1989',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  )
}
