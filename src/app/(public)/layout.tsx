import type { Metadata, Viewport } from 'next'
import { Exo, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/navigation'
import { SITE_URL } from '@/lib/site'

import '../globals.css'

/**
 * Tipografia display.
 *
 * Exo, que reemplazo a Julius Sans One. **Cambia dos reglas que venian de las
 * dos familias anteriores**, porque Exo no tiene sus limitaciones:
 *
 * - **Tiene pesos de verdad** (es variable, de 100 a 900), asi que `font-bold`
 *   ya no es una negrita sintetica del navegador. Hoy no se usa en ningun lado
 *   y los titulos siguen en 400, pero es una puerta que antes estaba cerrada.
 * - **Tiene minusculas de verdad**, no versalitas. El `uppercase` que llevan
 *   todos los titulos ya no es una obligacion tecnica sino una decision de
 *   diseño: sacarlo ahora es valido y no rompe nada.
 *
 * Se carga como fuente variable -sin `weight`- para tener todo el rango sin
 * pedir varios archivos.
 *
 * `display: swap` para que el texto sea legible mientras baja la fuente, en vez
 * de dejar el hueco en blanco que penaliza el LCP.
 */
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
 * `metadataBase` es lo que convierte en absolutas las rutas relativas de
 * OpenGraph y de los canonical. Sin el, Next avisa en el build y las imagenes
 * compartidas salen con URLs relativas, que ninguna red social resuelve.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Maxibásquetbol chileno`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'es_CL',
    title: `${SITE_NAME} - Maxibásquetbol chileno`,
    description: SITE_TAGLINE,
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Maxibásquetbol chileno`,
    description: SITE_TAGLINE,
    images: ['/og.jpg'],
  },
}

/**
 * `themeColor` pinta la barra del navegador en movil del color del sitio, y
 * `colorScheme: 'dark'` le avisa al navegador que los controles nativos
 * (barras de scroll, campos de formulario) van en su version oscura. Sin lo
 * segundo, una barra de scroll blanca corta el borde de la pagina.
 *
 * Van en `viewport` y no en `metadata`: Next las movio ahi y en `metadata`
 * quedan ignoradas con un aviso en el build.
 */
export const viewport: Viewport = {
  themeColor: '#0B0C0E',
  colorScheme: 'dark',
}

/**
 * Layout raiz del sitio publico.
 *
 * Es raiz y no anidado a proposito: al vivir dentro del grupo `(public)`, el
 * CMS tiene el suyo en `(admin)` sin heredar ni el header, ni el footer, ni el
 * enlace de saltar al contenido.
 *
 * `lang="es-CL"` y no `es` a secas: el sitio es chileno y las fechas se
 * formatean con ese locale (`lib/format.ts`). Declarar lo mismo en el HTML
 * evita que un lector de pantalla lea los numeros con otra pronunciacion.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL" className={`${exo.variable} ${plusJakarta.variable}`}>
      <body className="bg-canvas text-ink flex min-h-dvh flex-col">
        {/* Primer tabulador de la pagina: deja saltar la navegacion. */}
        <a
          href="#contenido"
          className="focus:bg-accent focus:text-canvas font-display sr-only tracking-[0.1em] uppercase focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2"
        >
          Saltar al contenido
        </a>

        <Header />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
