'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  guardarArticulo,
  type EstadoArticulo,
} from '@/app/(admin)/admin/noticias/actions'
import type { Json } from '@/types/database.types'

import { ArticleEditor } from './ArticleEditor'
import { ImageUploader } from './ImageUploader'

const ESTADO_INICIAL: EstadoArticulo = { error: null, ok: null }

export type ArticuloEditable = {
  id: number
  title: string
  excerpt: string | null
  content: Json
  category_id: number
  cover_image_url: string | null
  cover_image_alt: string | null
  is_featured: boolean
  is_anonymous: boolean
  status: 'draft' | 'published' | 'archived'
}

type ArticleFormProps = {
  categorias: readonly { id: number; name: string }[]
  articulo?: ArticuloEditable
}

export function ArticleForm({ categorias, articulo }: ArticleFormProps) {
  const [estado, formAction] = useActionState(guardarArticulo, ESTADO_INICIAL)
  const publicada = articulo?.status === 'published'

  return (
    <form action={formAction} className="space-y-6">
      {articulo ? <input type="hidden" name="id" value={articulo.id} /> : null}

      <div>
        <label
          htmlFor="title"
          className="text-ink/70 block text-sm font-medium"
        >
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={articulo?.title}
          className="focus:border-accent focus:ring-accent/20 font-display mt-1.5 block h-12 w-full rounded-lg border border-black/10 px-3 text-lg font-bold outline-none focus:ring-4"
        />
        {articulo ? (
          <p className="text-ink/45 mt-1.5 text-xs">
            La dirección de la nota no cambia al editar el título: cambiarla
            rompería los enlaces que ya circularon.
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="text-ink/70 block text-sm font-medium"
        >
          Bajada
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={articulo?.excerpt ?? ''}
          className="focus:border-accent focus:ring-accent/20 mt-1.5 block w-full rounded-lg border border-black/10 px-3 py-2.5 text-[15px] outline-none focus:ring-4"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category_id"
            className="text-ink/70 block text-sm font-medium"
          >
            Categoría
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={articulo?.category_id ?? ''}
            className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-[15px] outline-none focus:ring-4"
          >
            <option value="" disabled>
              Elige una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="cover_image_alt"
            className="text-ink/70 block text-sm font-medium"
          >
            Texto alternativo de la portada
          </label>
          <input
            id="cover_image_alt"
            name="cover_image_alt"
            defaultValue={articulo?.cover_image_alt ?? ''}
            placeholder="Qué se ve en la foto"
            className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
          />
        </div>
      </div>

      <ImageUploader
        name="cover"
        nameActual="cover_actual"
        label="Portada"
        actual={articulo?.cover_image_url}
      />

      <div>
        <span className="text-ink/70 block text-sm font-medium">Cuerpo</span>
        <div className="mt-1.5">
          <ArticleEditor
            contenido={articulo?.content ?? { type: 'doc', content: [] }}
          />
        </div>
      </div>

      <fieldset className="flex flex-wrap gap-6 rounded-lg bg-black/[0.02] p-4">
        {/*
          La casilla avisa que es excluyente porque marcar esta apaga la
          anterior, y eso pasa en la base sin preguntar (el trigger
          `posts_una_sola_destacada`). Sin el aviso, alguien saca de la portada
          la nota de otra persona sin enterarse de que lo hizo.
        */}
        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={articulo?.is_featured}
            className="accent-accent mt-0.5 size-4"
          />
          <span>
            Nota principal de la portada
            <span className="text-ink/45 block text-xs">
              Es la foto grande, y hay una sola. Al marcarla, la que estaba deja
              de serlo. Las dos tarjetas del costado son siempre las últimas
              publicadas.
            </span>
          </span>
        </label>

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_anonymous"
            defaultChecked={articulo?.is_anonymous}
            className="accent-accent size-4"
          />
          <span>
            Firmar como <b>Equipo Liga Metropolitana</b>
            <span className="text-ink/45 block text-xs">
              Tu nombre no aparece en el sitio. Internamente la nota sigue
              siendo tuya.
            </span>
          </span>
        </label>
      </fieldset>

      {estado.error ? (
        <p role="alert" className="text-accent text-sm">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="text-sm text-green-700">
          {estado.ok}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Enviar valor="0" variante="secundario">
          {publicada ? 'Guardar cambios' : 'Guardar borrador'}
        </Enviar>
        <Enviar valor="1" variante="primario">
          {publicada ? 'Guardar y republicar' : 'Publicar'}
        </Enviar>
      </div>
    </form>
  )
}

/**
 * Dos botones de envio en el mismo formulario.
 *
 * `name`/`value` en el boton hacen que el navegador mande cual se apreto, sin
 * estado en React ni un campo oculto que haya que sincronizar. Solo viaja el
 * valor del boton usado.
 */
function Enviar({
  valor,
  variante,
  children,
}: {
  valor: '0' | '1'
  variante: 'primario' | 'secundario'
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      name="publicar"
      value={valor}
      disabled={pending}
      className={
        variante === 'primario'
          ? 'bg-accent font-display h-11 rounded-lg px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60'
          : 'font-display text-ink h-11 rounded-lg px-5 text-sm font-bold ring-1 ring-black/10 transition-colors hover:bg-black/[0.03] disabled:opacity-60'
      }
    >
      {pending ? 'Guardando...' : children}
    </button>
  )
}
