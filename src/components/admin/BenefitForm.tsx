'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarBeneficio,
  type EstadoBeneficio,
} from '@/app/(admin)/admin/convenios/actions'
import { ACCEPT_IMAGENES, MAX_IMAGEN_MB, revisarImagen } from '@/lib/imagenes'
import type { Benefit } from '@/lib/benefits'

const ESTADO_INICIAL: EstadoBeneficio = { error: null, ok: null }

type BenefitFormProps = {
  /** Si viene, el formulario edita. Si no, crea. */
  beneficio?: Benefit & { display_order: number }
}

/**
 * Alta y edicion de un convenio o beneficio.
 *
 * Calcado de `SponsorForm`, con dos diferencias: `description` es un
 * `<textarea>` obligatorio (acá el texto es lo que explica el beneficio) y el
 * logo es opcional -sin logo elegido, `guardarBeneficio` simplemente guarda
 * `logo_url: null`, a diferencia de sponsors que exige uno.
 */
export function BenefitForm({ beneficio }: BenefitFormProps) {
  const [estado, formAction] = useActionState(guardarBeneficio, ESTADO_INICIAL)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(
    beneficio?.logo_url ?? null
  )
  const [avisoLogo, setAvisoLogo] = useState<string | null>(null)

  const idBase = beneficio?.id ?? 'nuevo'

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {beneficio ? (
        <input type="hidden" name="id" value={beneficio.id} />
      ) : null}
      <input
        type="hidden"
        name="logo_actual"
        value={beneficio?.logo_url ?? ''}
      />

      <Campo
        id={`name-${idBase}`}
        name="name"
        label="Nombre"
        defaultValue={beneficio?.name}
        required
      />

      <Campo
        id={`link-${idBase}`}
        name="link_url"
        type="url"
        label="Link (opcional)"
        placeholder="https://ejemplo.cl"
        defaultValue={beneficio?.link_url ?? ''}
      />

      <div className="sm:col-span-2">
        <label
          htmlFor={`desc-${idBase}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Descripción
        </label>
        <textarea
          id={`desc-${idBase}`}
          name="description"
          required
          rows={3}
          maxLength={400}
          defaultValue={beneficio?.description}
          placeholder="En qué consiste el beneficio y cómo se usa."
          className="focus:border-accent focus:ring-accent/20 mt-1.5 block w-full rounded-lg border border-black/10 px-3 py-2.5 text-[15px] outline-none focus:ring-4"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`logo-${idBase}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Logo (opcional)
        </label>

        <div className="mt-1.5 flex items-center gap-4">
          {vistaPrevia ? (
            <Image
              src={vistaPrevia}
              alt=""
              aria-hidden
              width={64}
              height={64}
              unoptimized
              className="size-12 rounded-lg object-contain ring-1 ring-black/5"
            />
          ) : null}

          <input
            id={`logo-${idBase}`}
            name="logo"
            type="file"
            accept={ACCEPT_IMAGENES}
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              const aviso = archivo ? revisarImagen(archivo) : null
              setAvisoLogo(aviso)
              if (aviso) e.target.value = ''
              setVistaPrevia(
                archivo && !aviso
                  ? URL.createObjectURL(archivo)
                  : (beneficio?.logo_url ?? null)
              )
            }}
            className="text-ink/70 file:bg-accent/10 file:text-accent block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-3 file:text-sm file:font-medium"
          />
        </div>
        {avisoLogo ? (
          <p role="alert" className="text-accent mt-1.5 text-xs font-medium">
            {avisoLogo}
          </p>
        ) : (
          <p className="text-ink/45 mt-1.5 text-xs">
            PNG, JPG, WebP, AVIF o SVG. Hasta {MAX_IMAGEN_MB} MB. Sin logo, la
            tarjeta muestra un ícono genérico.
            {beneficio ? ' Si no eliges uno nuevo, se mantiene el actual.' : ''}
          </p>
        )}
      </div>

      <Campo
        id={`orden-${idBase}`}
        name="display_order"
        type="number"
        label="Orden"
        defaultValue={String(beneficio?.display_order ?? 0)}
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
        <Guardar nuevo={!beneficio} />
      </div>
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
        {...props}
        className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
      />
    </div>
  )
}

function Guardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent font-display h-11 rounded-lg px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
    >
      {pending
        ? 'Guardando...'
        : nuevo
          ? 'Agregar convenio'
          : 'Guardar cambios'}
    </button>
  )
}
