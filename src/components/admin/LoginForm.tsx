'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  iniciarSesion,
  type EstadoLogin,
} from '@/app/(admin)/admin/login/actions'

const ESTADO_INICIAL: EstadoLogin = { error: null }

type LoginFormProps = {
  /** A donde volver despues de entrar. Lo pone el proxy al rebotar. */
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [estado, formAction] = useActionState(iniciarSesion, ESTADO_INICIAL)

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <Campo
        id="email"
        name="email"
        type="email"
        label="Correo"
        autoComplete="username"
        placeholder="tu@correo.cl"
      />
      <Campo
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
      />

      {estado.error ? (
        // role="alert" para que el lector de pantalla lo anuncie al aparecer,
        // en vez de dejarlo mudo despues de un intento fallido.
        <p
          role="alert"
          className="text-accent rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm"
        >
          {estado.error}
        </p>
      ) : null}

      <Boton />
    </form>
  )
}

function Campo({
  id,
  label,
  ...props
}: {
  id: string
  label: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="text-ink/70 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        required
        {...props}
        className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
      />
    </div>
  )
}

/**
 * `useFormStatus` tiene que vivir en un hijo del form, no en el mismo
 * componente que lo renderiza: lee el estado del form padre.
 */
function Boton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent font-display h-11 w-full rounded-lg text-sm font-bold tracking-wide text-white transition-opacity disabled:opacity-60"
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  )
}
