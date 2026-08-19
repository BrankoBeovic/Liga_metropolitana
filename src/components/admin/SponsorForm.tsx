'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarSponsor,
  type EstadoSponsor,
} from '@/app/(admin)/admin/sponsors/actions'
import { ACCEPT_IMAGENES, MAX_IMAGEN_MB, revisarImagen } from '@/lib/imagenes'
import type { Sponsor } from '@/lib/posts'

const ESTADO_INICIAL: EstadoSponsor = { error: null, ok: null }

type SponsorFormProps = {
  /** Si viene, el formulario edita. Si no, crea. */
  sponsor?: Sponsor & { display_order: number }
}

export function SponsorForm({ sponsor }: SponsorFormProps) {
  const [estado, formAction] = useActionState(guardarSponsor, ESTADO_INICIAL)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(
    sponsor?.logo_url ?? null
  )
  /*
    Aviso de peso en el navegador, ademas del que ya hace el servidor.

    Un archivo demasiado grande revienta contra el `bodySizeLimit` de las Server
    Actions, y eso pasa antes de que corra nuestro codigo: el usuario ve que
    guardar no hace nada, sin ningun mensaje. Revisarlo al elegir el archivo
    convierte ese silencio en una explicacion.
  */
  const [avisoLogo, setAvisoLogo] = useState<string | null>(null)

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {sponsor ? <input type="hidden" name="id" value={sponsor.id} /> : null}
      <input type="hidden" name="logo_actual" value={sponsor?.logo_url ?? ''} />

      <Campo
        id={`name-${sponsor?.id ?? 'nuevo'}`}
        name="name"
        label="Nombre"
        defaultValue={sponsor?.name}
        required
      />

      <Campo
        id={`web-${sponsor?.id ?? 'nuevo'}`}
        name="website_url"
        type="url"
        label="Sitio web"
        placeholder="https://ejemplo.cl"
        defaultValue={sponsor?.website_url}
        required
      />

      <div className="sm:col-span-2">
        <label
          htmlFor={`logo-${sponsor?.id ?? 'nuevo'}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Logo
        </label>

        <div className="mt-1.5 flex items-center gap-4">
          {vistaPrevia ? (
            // Vista previa local antes de subir: sin esto el usuario no sabe
            // si eligio el archivo correcto hasta despues de guardar.
            <Image
              src={vistaPrevia}
              alt=""
              aria-hidden
              width={96}
              height={48}
              unoptimized
              className="h-12 w-24 rounded-lg object-contain ring-1 ring-black/5"
            />
          ) : null}

          <input
            id={`logo-${sponsor?.id ?? 'nuevo'}`}
            name="logo"
            type="file"
            accept={ACCEPT_IMAGENES}
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              const aviso = archivo ? revisarImagen(archivo) : null
              setAvisoLogo(aviso)
              // Un archivo que no sirve se descarta en el acto: si quedara
              // elegido, el boton de guardar prometeria algo que va a fallar.
              if (aviso) e.target.value = ''
              setVistaPrevia(
                archivo && !aviso
                  ? URL.createObjectURL(archivo)
                  : (sponsor?.logo_url ?? null)
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
            PNG, JPG, WebP, AVIF o SVG. Hasta {MAX_IMAGEN_MB} MB. Va en la
            sección de sponsors de la portada.
            {sponsor ? ' Si no eliges uno nuevo, se mantiene el actual.' : ''}
          </p>
        )}
      </div>

      {/*
        No hay casilla de visibilidad: era el mismo `is_active` que el boton
        "Ocultar/Mostrar" de la fila, con el dato repetido en dos controles de
        la misma pantalla. Queda el boton, que esta siempre a la vista y no
        obliga a desplegar "Editar".

        Tampoco hay campos de banners: este sitio no vende espacios de
        publicidad, los sponsors son solo logos (ver CLAUDE.md).
      */}
      <Campo
        id={`orden-${sponsor?.id ?? 'nuevo'}`}
        name="display_order"
        type="number"
        label="Orden"
        defaultValue={String(sponsor?.display_order ?? 0)}
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
        <Guardar nuevo={!sponsor} />
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
      {pending ? 'Guardando...' : nuevo ? 'Agregar sponsor' : 'Guardar cambios'}
    </button>
  )
}
