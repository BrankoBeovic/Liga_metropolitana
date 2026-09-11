'use client'

import { Tabs } from 'radix-ui'

import { EquipoForm } from './EquipoForm'
import { JugadorForm } from './JugadorForm'

/** Los tres pasos que se explican arriba del formulario de jugadores. */
const PASOS_JUGADOR = [
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

/** Los tres pasos que se explican arriba del formulario de equipos. */
const PASOS_EQUIPO = [
  {
    titulo: 'Completa el formulario',
    detalle:
      'Nombre del equipo, cantidad de jugadores, año de fundación y una bio corta. Con eso la Liga ya los ubica.',
  },
  {
    titulo: 'Quedan en la lista',
    detalle: 'La Liga guarda la ficha y se pone en contacto con ustedes.',
  },
  {
    titulo: 'A la cancha',
    detalle:
      'La Liga coordina con el equipo los pasos para sumarse a la competencia.',
  },
] as const

const ESTILO_TRIGGER =
  'font-display flex min-h-11 items-center rounded-full px-5 text-sm tracking-[0.1em] uppercase ring-1 ring-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none data-[state=active]:bg-accent data-[state=active]:text-canvas data-[state=inactive]:bg-editorial data-[state=inactive]:text-ink data-[state=inactive]:hover:text-accent'

/**
 * Los pasos de una tarjeta numerada. Comparte marcado entre jugador y equipo.
 */
function Pasos({
  pasos,
}: {
  pasos: readonly { titulo: string; detalle: string }[]
}) {
  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-3">
      {pasos.map((paso, i) => (
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
          <h3 className="font-display text-ink mt-3 text-xl tracking-wide uppercase">
            {paso.titulo}
          </h3>
          <p className="text-ink/70 mt-1.5 text-sm leading-relaxed">
            {paso.detalle}
          </p>
        </li>
      ))}
    </ol>
  )
}

/**
 * Las dos alternativas de `/inscripciones`, como pestañas de verdad: solo se
 * ve un formulario a la vez, elegido por el botón que se apriete.
 *
 * Es un componente cliente aparte y no la pagina entera porque `metadata`
 * solo se puede exportar desde un Server Component. `Tabs` es de `radix-ui`,
 * el mismo paquete que ya usa `MenuLateral` para el `Dialog` del menu.
 *
 * Sin JavaScript se ve solo la pestaña por defecto (jugador): Radix renderiza
 * en el servidor unicamente el `Tabs.Content` de `defaultValue`, asi que quien
 * navega sin JS puede completar ese formulario igual, aunque no pueda
 * cambiar de pestaña. Es la misma degradacion que ya acepta este codebase
 * para el `Dialog` del menu, que tampoco abre sin JavaScript.
 */
export function InscripcionesTabs() {
  return (
    <Tabs.Root defaultValue="jugador">
      <Tabs.List
        aria-label="Tipo de inscripción"
        className="mt-8 flex flex-wrap gap-3"
      >
        <Tabs.Trigger value="jugador" className={ESTILO_TRIGGER}>
          Soy jugador
        </Tabs.Trigger>
        <Tabs.Trigger value="equipo" className={ESTILO_TRIGGER}>
          Tengo un equipo
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="jugador" className="mt-10">
        <p className="text-ink/70 max-w-[38rem] text-sm leading-relaxed">
          ¿Quieres jugar pero no tienes equipo? Déjanos tus datos y la Liga te
          contacta cuando un club busque gente.
        </p>

        {/*
          Los pasos van ANTES del formulario a proposito: quien llega no sabe
          si completarlo lo publica en internet. Decirle primero que la ficha
          es interna baja la barrera, sobre todo con un RUT de por medio.
        */}
        <Pasos pasos={PASOS_JUGADOR} />

        <div className="mt-10 max-w-[38rem]">
          <h2 className="font-display text-ink text-2xl tracking-wide uppercase">
            Tus datos
          </h2>
          <p className="text-ink/70 mt-2 text-sm">
            Los campos con{' '}
            <span aria-hidden className="text-accent">
              *
            </span>
            <span className="sr-only">asterisco</span> son obligatorios. El RUT
            no se publica en el sitio: lo ve solo el equipo de la Liga.
          </p>

          <div className="mt-6">
            <JugadorForm />
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content value="equipo" className="mt-10">
        <p className="text-ink/70 max-w-[38rem] text-sm leading-relaxed">
          ¿Tienes un equipo y quieren sumarse a la Liga? Cuéntanos lo básico y
          nos ponemos en contacto.
        </p>

        <Pasos pasos={PASOS_EQUIPO} />

        <div className="mt-10 max-w-[38rem]">
          <h2 className="font-display text-ink text-2xl tracking-wide uppercase">
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
            <EquipoForm />
          </div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  )
}
