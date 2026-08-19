import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { InscripcionForm } from '@/components/forms/InscripcionForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { urlAbsoluta } from '@/lib/site'

const TITULO = 'Inscríbete'
const BAJADA =
  'Suma a tu equipo a la Liga Metropolitana. Déjanos tus datos y te contamos cómo sigue: categorías, fechas y lo que necesitas para competir.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/inscribete') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/inscribete'),
  },
}

/**
 * Los tres pasos que se explican arriba del formulario.
 *
 * Estan escritos con lo que el circuito de verdad hace hoy -mandar un correo y
 * esperar respuesta- y no con un proceso administrativo que nadie confirmo. En
 * cuanto la Liga defina plazos, cuotas o documentacion, esto es lo primero que
 * hay que actualizar.
 */
const PASOS = [
  {
    titulo: 'Completa el formulario',
    detalle:
      'Con el nombre del equipo, la categoría en la que quieren jugar y a quién contactar.',
  },
  {
    titulo: 'Te respondemos',
    detalle:
      'La Liga se contacta por correo para contarte fechas, sedes y qué documentación hace falta.',
  },
  {
    titulo: 'A la cancha',
    detalle:
      'Confirmado el cupo, el equipo entra en la programación de la temporada.',
  },
] as const

export default function InscribetePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-10 pb-20 sm:px-8 lg:px-10">
      <PageHeader titulo="Inscríbete" bajada={BAJADA} />

      {/*
        Los pasos van ANTES del formulario a proposito: quien llega no sabe si
        completarlo lo compromete a algo. Decirle primero que esto abre una
        conversacion y no una inscripcion definitiva baja bastante la barrera.
      */}
      <ol className="mt-12 grid gap-4 sm:grid-cols-3">
        {PASOS.map((paso, i) => (
          <li
            key={paso.titulo}
            className="bg-editorial rounded-2xl p-5 ring-1 ring-white/10"
          >
            <span
              aria-hidden
              className="font-display bg-accent/15 text-accent flex size-9 items-center justify-center rounded-full text-base"
            >
              {i + 1}
            </span>
            <h2 className="font-display text-ink mt-3 text-xl tracking-wide uppercase">
              {paso.titulo}
            </h2>
            <p className="text-ink/70 mt-1.5 text-sm leading-relaxed">
              {paso.detalle}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-14 max-w-[38rem]">
        <h2 className="font-display text-ink text-3xl tracking-wide uppercase">
          Datos del equipo
        </h2>
        <p className="text-ink/70 mt-2 text-sm">
          Los campos con{' '}
          <span aria-hidden className="text-accent">
            *
          </span>
          <span className="sr-only">asterisco</span> son obligatorios.
        </p>

        <div className="mt-6">
          <InscripcionForm />
        </div>

        {/*
          El enlace va en su propio renglon y no dentro de la frase.

          Medido, un enlace en linea dentro de un parrafo de 14px deja un
          objetivo tactil de 20px de alto. La altura del renglon sola no
          alcanza: hace falta pedirla, y eso obliga a sacarlo del texto
          corrido (CLAUDE.md seccion 3).
        */}
        <p className="text-ink/60 mt-8 text-sm">
          ¿Buscas las bases o el reglamento?
        </p>
        <Link
          href="/documentos"
          className="text-accent hover:text-accent-light focus-visible:ring-accent focus-visible:ring-offset-canvas -mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Están en Documentos
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
