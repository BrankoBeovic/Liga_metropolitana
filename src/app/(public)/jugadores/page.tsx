import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { JugadorForm } from '@/components/forms/JugadorForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { urlAbsoluta } from '@/lib/site'

const TITULO = 'Jugadores'
const BAJADA =
  '¿Quieres jugar pero no tienes equipo? Déjanos tus datos y la Liga te contacta cuando un club busque gente.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/jugadores') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/jugadores'),
  },
}

/**
 * Los tres pasos que se explican arriba del formulario.
 *
 * Estan escritos con lo que el circuito de verdad hace hoy: guardar la ficha
 * y avisar por correo. No hay matching automatico ni publicacion publica de
 * los datos (el RUT no sale al sitio).
 */
const PASOS = [
  {
    titulo: 'Completa el formulario',
    detalle:
      'Nombre, apellido, edad, RUT, posición y una bio corta de cómo juegas. Con eso un club te puede ubicar.',
  },
  {
    titulo: 'Quedas en la lista',
    detalle:
      'La Liga guarda tu ficha y te contacta cuando un equipo esté buscando gente en tu puesto.',
  },
  {
    titulo: 'A la cancha',
    detalle:
      'El club se pone en contacto contigo. De ahí en adelante la conversación es entre ustedes.',
  },
] as const

export default function JugadoresPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante.

        La barra es `fixed`, o sea que esta fuera del flujo y no empuja nada
        hacia abajo. En la portada eso es lo que se busca -el video llega al
        borde de la pantalla- pero en una pagina interior el titulo nacia
        debajo de la pildora. Medido: la barra ocupa hasta 71px desde arriba.
      */}
      <PageHeader titulo={TITULO} bajada={BAJADA} />

      {/*
        Los pasos van ANTES del formulario a proposito: quien llega no sabe si
        completarlo lo publica en internet. Decirle primero que la ficha es
        interna baja la barrera, sobre todo con un RUT de por medio.
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
          Tus datos
        </h2>
        <p className="text-ink/70 mt-2 text-sm">
          Los campos con{' '}
          <span aria-hidden className="text-accent">
            *
          </span>
          <span className="sr-only">asterisco</span> son obligatorios. El RUT no
          se publica en el sitio: lo ve solo el equipo de la Liga.
        </p>

        <div className="mt-6">
          <JugadorForm />
        </div>

        {/*
          El enlace va en su propio renglon y no dentro de la frase.

          Medido, un enlace en linea dentro de un parrafo de 14px deja un
          objetivo tactil de 20px de alto. La altura del renglon sola no
          alcanza: hace falta pedirla, y eso obliga a sacarlo del texto
          corrido (CLAUDE.md seccion 3).
        */}
        <p className="text-ink/60 mt-8 text-sm">
          ¿Tienes equipo y quieres sumarte a la Liga?
        </p>
        <Link
          href="/contacto"
          className="text-accent hover:text-accent-light focus-visible:ring-accent focus-visible:ring-offset-canvas -mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Escríbenos por Contacto
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
