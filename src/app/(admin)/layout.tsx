import type { Metadata } from 'next'
import { Exo, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import '../globals.css'

// Exo es variable (100 a 900): a diferencia de las familias anteriores, aca
// `font-bold` si es un peso real y no una negrita sintetica.
const exo = Exo({
  subsets: ['latin'],
  variable: '--font-exo',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

/**
 * `noindex` como segunda capa.
 *
 * La primera es el header `X-Robots-Tag` que pone `src/proxy.ts`, que ademas
 * viaja en las redirecciones. Este metadata cubre el caso de una pagina del
 * CMS que llegue a renderizarse: los dos dicen lo mismo y ninguno depende del
 * otro.
 */
export const metadata: Metadata = {
  title: { default: 'CMS', template: '%s | CMS Liga Metropolitana' },
  robots: { index: false, follow: false },
}

/**
 * Layout raiz del CMS.
 *
 * Es raiz, hermano del de `(public)`: el admin no hereda el header flotante,
 * el footer editorial ni el enlace de saltar al contenido. Son dos productos
 * distintos que comparten el mismo sistema de diseño.
 *
 * `tema-claro` redefine canvas e ink con ambito: el CMS se queda claro como
 * en la fuente, mientras el sitio publico es oscuro. Ver globals.css.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${exo.variable} ${plusJakarta.variable}`}>
      <body className="tema-claro bg-canvas text-ink min-h-dvh">
        {children}
      </body>
    </html>
  )
}
