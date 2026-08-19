'use client'

import NextImage from 'next/image'
import { useState } from 'react'

type ImageUploaderProps = {
  name: string
  label: string
  /** URL ya guardada, si la nota tiene portada. */
  actual?: string | null
  /** Campo oculto que conserva la URL actual si no se elige archivo nuevo. */
  nameActual?: string
  ayuda?: string
}

/**
 * Selector de imagen con vista previa.
 *
 * La vista previa se arma con `URL.createObjectURL`, que no sube nada: muestra
 * el archivo local. Sin esto no se sabe si se eligio el correcto hasta despues
 * de guardar, y si estaba mal hay que repetir todo el formulario.
 *
 * `unoptimized` en la vista previa porque `blob:` no lo puede procesar el
 * optimizador de imagenes de Next.
 */
export function ImageUploader({
  name,
  label,
  actual,
  nameActual,
  ayuda,
}: ImageUploaderProps) {
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(actual ?? null)
  const [esLocal, setEsLocal] = useState(false)

  return (
    <div>
      <label htmlFor={name} className="text-ink/70 block text-sm font-medium">
        {label}
      </label>

      {nameActual ? (
        <input type="hidden" name={nameActual} value={actual ?? ''} />
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-4">
        {vistaPrevia ? (
          <div className="relative aspect-[16/9] w-40 overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/5">
            <NextImage
              src={vistaPrevia}
              alt=""
              aria-hidden
              fill
              sizes="160px"
              unoptimized={esLocal}
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <input
            id={name}
            name={name}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) {
                setVistaPrevia(URL.createObjectURL(archivo))
                setEsLocal(true)
              } else {
                setVistaPrevia(actual ?? null)
                setEsLocal(false)
              }
            }}
            className="text-ink/70 file:bg-accent/10 file:text-accent block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-3 file:text-sm file:font-medium"
          />
          <p className="text-ink/45 mt-1.5 text-xs">
            {ayuda ?? 'PNG, JPG, WebP o AVIF. Hasta 5 MB.'}
            {actual ? ' Si no eliges una nueva, se mantiene la actual.' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
