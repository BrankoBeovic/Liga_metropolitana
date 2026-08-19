'use client'

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useFormStatus } from 'react-dom'

import { cn } from '@/lib/cn'

/**
 * Los campos de los formularios publicos.
 *
 * Viven aparte de los del CMS porque son otro sistema de color: el admin se
 * quedo claro y el sitio es oscuro (CLAUDE.md seccion 5). Reusar aquellos aca
 * habria significado un componente con una bandera de tema, que es la forma
 * larga de tener dos componentes.
 *
 * Los tres comparten estas medidas y no es casualidad: `h-12` son 48px, por
 * encima de los 44 que pide CLAUDE.md, y el `focus-visible` dorado es el mismo
 * anillo que usan los botones del sitio.
 */
const BASE_CAMPO =
  'bg-editorial text-ink placeholder:text-ink/50 focus-visible:ring-accent mt-2 block w-full rounded-xl px-4 text-[15px] ring-1 ring-white/10 outline-none focus-visible:ring-2'

function Etiqueta({
  htmlFor,
  children,
  requerido,
}: {
  htmlFor: string
  children: ReactNode
  requerido?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-display text-ink/75 block text-sm tracking-[0.1em] uppercase"
    >
      {children}
      {/*
        El asterisco es decorativo: quien usa lector de pantalla ya recibe la
        obligatoriedad por el atributo `required` del input. Anunciarlo ademas
        como "asterisco" es ruido.
      */}
      {requerido ? (
        <span aria-hidden className="text-accent">
          {' '}
          *
        </span>
      ) : null}
    </label>
  )
}

export function CampoTexto({
  id,
  label,
  ayuda,
  className,
  ...props
}: {
  id: string
  label: string
  ayuda?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Etiqueta htmlFor={id} requerido={props.required}>
        {label}
      </Etiqueta>
      <input
        id={id}
        {...props}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className={cn(BASE_CAMPO, 'h-12')}
      />
      {ayuda ? (
        <p id={`${id}-ayuda`} className="text-ink/60 mt-1.5 text-xs">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

export function CampoArea({
  id,
  label,
  ayuda,
  className,
  ...props
}: {
  id: string
  label: string
  ayuda?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <Etiqueta htmlFor={id} requerido={props.required}>
        {label}
      </Etiqueta>
      <textarea
        id={id}
        {...props}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className={cn(BASE_CAMPO, 'py-3 leading-relaxed')}
      />
      {ayuda ? (
        <p id={`${id}-ayuda`} className="text-ink/60 mt-1.5 text-xs">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

export function CampoSelect({
  id,
  label,
  ayuda,
  opciones,
  className,
  ...props
}: {
  id: string
  label: string
  ayuda?: string
  opciones: readonly string[]
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <Etiqueta htmlFor={id} requerido={props.required}>
        {label}
      </Etiqueta>
      <select
        id={id}
        {...props}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className={cn(BASE_CAMPO, 'h-12')}
      >
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {ayuda ? (
        <p id={`${id}-ayuda`} className="text-ink/60 mt-1.5 text-xs">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Boton de envio con su estado.
 *
 * `useFormStatus` tiene que leerse desde un componente que este DENTRO del
 * `<form>`, no desde el que lo renderiza: leido afuera devuelve siempre
 * `pending: false` y el boton nunca se bloquea. De ahi que sea un componente
 * propio y no un `<button>` suelto en el formulario.
 *
 * Bloquearlo mientras se manda no es cosmetico: sin eso, dos clics seguidos en
 * una conexion lenta mandan el mismo mensaje dos veces.
 */
export function BotonEnviar({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="font-display bg-accent text-canvas hover:bg-accent-light focus-visible:ring-accent focus-visible:ring-offset-canvas flex min-h-12 items-center rounded-full px-6 text-sm tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
    >
      {pending ? 'Enviando...' : children}
    </button>
  )
}
