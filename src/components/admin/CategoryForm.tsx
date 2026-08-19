'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarCategoria,
  type EstadoCategoria,
} from '@/app/(admin)/admin/categorias/actions'
import type { Category } from '@/lib/categories'

const ESTADO_INICIAL: EstadoCategoria = { error: null, ok: null }

type CategoryFormProps = {
  categoria: Category
}

/**
 * Una fila del listado de categorias.
 *
 * Guarda por su cuenta, sin un boton global al final de la pantalla: un
 * "Guardar todo" obliga a recordar que se toco, y si una falla deja en duda si
 * entraron las otras.
 *
 * Sin los controles de barra y portada de la fuente: la barra de este sitio es
 * una lista fija en el codigo y la portada no tiene bloque de secciones.
 */
export function CategoryForm({ categoria }: CategoryFormProps) {
  const [estado, formAction] = useActionState(guardarCategoria, ESTADO_INICIAL)
  const id = categoria.id

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`name-${id}`}
            className="text-ink/70 block text-xs font-medium"
          >
            Nombre
          </label>
          <input
            id={`name-${id}`}
            name="name"
            defaultValue={categoria.name}
            required
            aria-describedby={`name-ayuda-${id}`}
            className="focus:border-accent focus:ring-accent/20 mt-1 block h-11 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:ring-4"
          />
          <p id={`name-ayuda-${id}`} className="text-ink/45 mt-1 text-[11px]">
            Se usa en el badge de cada nota.
          </p>
        </div>

        <div>
          <label
            htmlFor={`description-${id}`}
            className="text-ink/70 block text-xs font-medium"
          >
            Bajada
          </label>
          <input
            id={`description-${id}`}
            name="description"
            defaultValue={categoria.description ?? ''}
            aria-describedby={`description-ayuda-${id}`}
            className="focus:border-accent focus:ring-accent/20 mt-1 block h-11 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:ring-4"
          />
          <p
            id={`description-ayuda-${id}`}
            className="text-ink/45 mt-1 text-[11px]"
          >
            Una frase que describe la categoría. Opcional.
          </p>
        </div>
      </div>

      <div className="mt-3">
        <Guardar />
      </div>

      {estado.error ? (
        <p role="alert" className="text-accent mt-2 text-xs">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="mt-2 text-xs text-green-700">
          {estado.ok}
        </p>
      ) : null}
    </form>
  )
}

function Guardar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent font-display h-11 shrink-0 rounded-lg px-4 text-xs font-bold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar'}
    </button>
  )
}
