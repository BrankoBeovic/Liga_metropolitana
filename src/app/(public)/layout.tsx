import type { Metadata } from 'next'
import { Bebas_Neue, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { SITE_NAME, SITE_TAGLINE } from '@/lib/navigation'

import '../globals.css'

// Bebas Neue tiene un solo peso: no existe la variante bold.
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

/**
 * Layout raiz PROVISORIO del sitio publico, hermano del de `(admin)`.
 * En la Etapa 5 se completa con el header, el footer y la metadata definitiva
 * (canonica, OpenGraph, Twitter Card).
 */
export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es-CL"
      className={`${bebasNeue.variable} ${plusJakarta.variable}`}
    >
      <body className="bg-canvas text-ink min-h-dvh">{children}</body>
    </html>
  )
}
