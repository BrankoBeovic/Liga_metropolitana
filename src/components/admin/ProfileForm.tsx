'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarPerfil,
  type EstadoPerfil,
} from '@/app/(admin)/admin/perfil/actions'
import type { MiembroEquipo } from '@/lib/profiles'

const ESTADO_INICIAL: EstadoPerfil = { error: null, ok: null }

/** Mismo tope que valida la Server Action. */
const MAX_BIO = 400

/*
  Sin la casilla `show_in_team` de la fuente: este sitio no tiene pagina de
  equipo. La columna sigue en la base por si algun dia la hay.
*/
export type PerfilEditable = MiembroEquipo

type ProfileFormProps = {
  perfil: PerfilEditable
}

export function ProfileForm({ perfil }: ProfileFormProps) {
  const [estado, formAction] = useActionState(guardarPerfil, ESTADO_INICIAL)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(
    perfil.avatar_url
  )
  const [largoBio, setLargoBio] = useState((perfil.bio ?? '').length)

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <input
        type="hidden"
        name="avatar_actual"
        value={perfil.avatar_url ?? ''}
      />

      <div className="sm:col-span-2">
        <label
          htmlFor="avatar"
          className="text-ink/70 block text-sm font-medium"
        >
          Foto
        </label>

        <div className="mt-1.5 flex items-center gap-4">
          {/*
            Marco circular, que es como se ve en la tarjeta del equipo y en la
            firma al pie de la nota. Un cuadrado aca haria elegir la foto sin
            ver que el recorte redondo se come las esquinas.
          */}
          {vistaPrevia ? (
            <Image
              src={vistaPrevia}
              alt=""
              aria-hidden
              width={72}
              height={72}
              unoptimized={vistaPrevia.startsWith('blob:')}
              className="size-18 shrink-0 rounded-full object-cover ring-1 ring-black/5"
            />
          ) : (
            <span
              aria-hidden
              className="bg-accent/12 text-accent font-display flex size-18 shrink-0 items-center justify-center rounded-full text-lg ring-1 ring-black/5"
            >
              {perfil.full_name.slice(0, 1)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                setVistaPrevia(
                  archivo ? URL.createObjectURL(archivo) : perfil.avatar_url
                )
              }}
              className="text-ink/70 file:bg-accent/10 file:text-accent block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-3 file:text-sm file:font-medium"
            />
            <p className="text-ink/45 mt-1.5 text-xs">
              Cuadrada queda mejor. PNG, JPG, WebP o AVIF, hasta 5 MB. Sin foto
              se usa el escudo de la liga.
            </p>
          </div>
        </div>
      </div>

      <Campo
        id="full_name"
        name="full_name"
        label="Nombre"
        defaultValue={perfil.full_name}
        required
        ayuda="Es la firma que aparece en tus notas."
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <label htmlFor="bio" className="text-ink/70 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={MAX_BIO}
          defaultValue={perfil.bio ?? ''}
          onChange={(e) => setLargoBio(e.target.value.length)}
          aria-describedby="bio-ayuda"
          className="focus:border-accent focus:ring-accent/20 mt-1.5 block w-full rounded-lg border border-black/10 px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:ring-4"
        />
        <div className="mt-1.5 flex flex-wrap justify-between gap-2">
          <p id="bio-ayuda" className="text-ink/45 text-xs">
            Un par de líneas: qué cubres y desde cuándo. Se ve al pie de cada
            nota tuya.
          </p>
          <p
            className={
              largoBio > MAX_BIO - 40
                ? 'text-accent shrink-0 text-xs font-bold tabular-nums'
                : 'text-ink/45 shrink-0 text-xs tabular-nums'
            }
          >
            {largoBio}/{MAX_BIO}
          </p>
        </div>
      </div>

      <Campo
        id="twitter_url"
        name="twitter_url"
        type="url"
        label="X"
        placeholder="https://x.com/tucuenta"
        defaultValue={perfil.twitter_url ?? ''}
        ayuda="Opcional."
      />

      <Campo
        id="instagram_url"
        name="instagram_url"
        type="url"
        label="Instagram"
        placeholder="https://www.instagram.com/tucuenta"
        defaultValue={perfil.instagram_url ?? ''}
        ayuda="Opcional."
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
        {...props}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
      />
      {ayuda ? (
        <p id={`${id}-ayuda`} className="text-ink/45 mt-1.5 text-xs">
          {ayuda}
        </p>
      ) : null}
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
      {pending ? 'Guardando...' : 'Guardar cambios'}
    </button>
  )
}
