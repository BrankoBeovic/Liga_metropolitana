'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  cambiarPassword,
  type EstadoPassword,
} from '@/app/(admin)/admin/perfil/actions'

const ESTADO_INICIAL: EstadoPassword = { error: null, ok: null }

/** Mismo minimo que valida la Server Action. */
const MIN_PASSWORD = 8

/**
 * Cambio de contraseña.
 *
 * Va en su propio formulario y no dentro del de perfil a proposito: son dos
 * tareas distintas y guardar la bio no deberia pedir la contraseña actual.
 */
export function PasswordForm() {
  const [estado, formAction] = useActionState(cambiarPassword, ESTADO_INICIAL)

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {/*
        `autoComplete` no es decorativo: le dice al gestor de contraseñas cual
        es cual. Sin esto ofrece la actual en los tres campos y despues guarda
        la equivocada.
      */}
      <Campo
        id="actual"
        name="actual"
        label="Contraseña actual"
        autoComplete="current-password"
        className="sm:col-span-2"
      />

      <Campo
        id="nueva"
        name="nueva"
        label="Contraseña nueva"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        ayuda={`Al menos ${MIN_PASSWORD} caracteres.`}
      />

      <Campo
        id="confirmacion"
        name="confirmacion"
        label="Repetir la nueva"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
      />

      {estado.error ? (
        <p role="alert" className="text-accent text-sm sm:col-span-2">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="text-sm text-green-700 sm:col-span-2">
          {estado.ok}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Guardar />
      </div>
    </form>
  )
}

function Campo({
  id,
  label,
  ayuda,
  className,
  ...props
}: {
  id: string
  label: string
  ayuda?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-ink/70 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="password"
        required
        {...props}
        className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
      />
      {ayuda ? <p className="text-ink/45 mt-1.5 text-xs">{ayuda}</p> : null}
    </div>
  )
}

function Guardar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent font-display h-11 rounded-lg px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? 'Cambiando...' : 'Cambiar contraseña'}
    </button>
  )
}
