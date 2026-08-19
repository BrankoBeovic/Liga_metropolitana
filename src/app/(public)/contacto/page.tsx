import type { Metadata } from 'next'

import { ContactoForm } from '@/components/forms/ContactoForm'
import { InstagramIcon } from '@/components/ui/BrandIcons'
import { PageHeader } from '@/components/ui/PageHeader'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_NAME } from '@/lib/navigation'
import { urlAbsoluta } from '@/lib/site'

const TITULO = 'Contacto'
const BAJADA =
  'Escríbenos por cualquier duda sobre la Liga, los partidos o cómo participar. Respondemos al correo que dejes acá.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/contacto') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/contacto'),
  },
}

/**
 * Pagina de contacto.
 *
 * Estatica: el formulario se manda con una Server Action, que no obliga a la
 * pagina a ser dinamica. Lo unico que baja al navegador son los campos.
 *
 * El JSON-LD `ContactPage` es lo que le dice a Google que esta es la pagina de
 * contacto del medio, que es una de las señales de E-E-A-T con las que evalua
 * quien esta detras del sitio.
 */
export default function ContactoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `${TITULO} - ${SITE_NAME}`,
    description: BAJADA,
    url: urlAbsoluta('/contacto'),
    mainEntity: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: urlAbsoluta('/'),
      sameAs: [INSTAGRAM_URL],
    },
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-10 pb-20 sm:px-8 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <PageHeader titulo="Contacto" bajada={BAJADA} />

      {/*
        Dos columnas desde `lg`: el formulario manda y los otros canales quedan
        al costado. En una sola columna el formulario iria primero igual, que es
        el orden correcto en el DOM para quien navega con teclado.
      */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,38rem)_1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-ink text-2xl tracking-wide uppercase">
            Escríbenos
          </h2>
          <div className="mt-6">
            <ContactoForm />
          </div>
        </div>

        <aside className="bg-editorial h-fit rounded-2xl p-6 ring-1 ring-white/10">
          <h2 className="font-display text-ink text-2xl tracking-wide uppercase">
            Otros canales
          </h2>
          <p className="text-ink/70 mt-3 text-sm leading-relaxed">
            En Instagram publicamos los resultados, la programación y todo lo
            que pasa en la cancha. También respondemos por mensaje directo.
          </p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="me noopener noreferrer"
            className="font-display text-ink hover:bg-ink/10 focus-visible:ring-accent focus-visible:ring-offset-editorial mt-5 inline-flex min-h-11 items-center gap-2.5 rounded-full px-4 text-sm tracking-[0.1em] ring-1 ring-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <InstagramIcon className="size-4" />
            {INSTAGRAM_HANDLE}
            <span className="sr-only">
              {' '}
              (se abre en Instagram, en una pestaña nueva)
            </span>
          </a>

          {/*
            No hay direccion postal ni telefono, y eso es a proposito: no
            tenemos ninguno confirmado. Publicar un dato de contacto que no
            responde es peor que no publicarlo, porque quien escribe cree que
            hizo lo correcto y nunca recibe respuesta.
          */}
        </aside>
      </div>
    </div>
  )
}
