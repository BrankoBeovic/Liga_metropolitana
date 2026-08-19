import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { requerirAdmin } from '@/lib/admin/session'
import type { Category } from '@/lib/categories'
import { createClient } from '@/lib/supabase/server'

import { moverCategoria } from './actions'

export const metadata: Metadata = { title: 'Categorías' }
export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  // Escribir categorias es exclusivo del admin: asi lo dicen las politicas
  // `categories_insert`, `_update` y `_delete`. Un editor que llegue acá va al
  // dashboard, no al login: tiene sesion, solo que no le corresponde.
  const sesion = await requerirAdmin()
  const supabase = await createClient()

  // Las notas publicadas por categoria, para mostrar cuanto tiene cada una.
  const [{ data: filas }, { data: publicadas }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true }),
    supabase
      .from('posts')
      .select('category_id')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString()),
  ])

  const categorias: Category[] = filas ?? []

  const notasPorCategoria = new Map<number, number>()
  for (const p of publicadas ?? []) {
    notasPorCategoria.set(
      p.category_id,
      (notasPorCategoria.get(p.category_id) ?? 0) + 1
    )
  }

  return (
    <AdminShell
      sesion={sesion}
      titulo="Categorías"
      descripcion="Las categorías de las noticias. Aparecen como badge en las tarjetas y en la página de cada nota."
    >
      <ul className="mt-6 space-y-3">
        {categorias.map((categoria, indice) => (
          <li key={categoria.id} className="rounded-xl p-4 ring-1 ring-black/5">
            <div className="flex flex-wrap items-start gap-3">
              {/*
                Subir y bajar en vez de un campo numerico: nadie tiene que
                entender que los ordenes van de diez en diez, y son dos Server
                Actions que funcionan sin JavaScript.
              */}
              <div className="flex shrink-0 flex-col gap-1">
                <Mover
                  id={categoria.id}
                  direccion="arriba"
                  deshabilitado={indice === 0}
                  etiqueta={`Subir ${categoria.name}`}
                />
                <Mover
                  id={categoria.id}
                  direccion="abajo"
                  deshabilitado={indice === categorias.length - 1}
                  etiqueta={`Bajar ${categoria.name}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-ink truncate text-[15px] font-bold">
                  {categoria.name}
                </p>

                {/*
                  El slug se muestra y no se edita: identifica a la categoria
                  en los datos y cambiarlo es una tarea aparte.
                */}
                <p className="text-ink/40 mt-0.5 truncate text-[11px]">
                  {categoria.slug} · {notasPorCategoria.get(categoria.id) ?? 0}{' '}
                  publicadas
                </p>

                <div className="mt-3">
                  <CategoryForm categoria={categoria} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-ink/45 mt-6 text-xs leading-relaxed">
        Las categorías no se crean ni se borran desde acá. Una categoría con
        notas no se puede borrar (la base lo impide para no dejar notas
        huérfanas), y crear una obliga a elegir un slug, que es justamente lo
        que conviene pensar dos veces porque después no se cambia.
      </p>
    </AdminShell>
  )
}

function Mover({
  id,
  direccion,
  deshabilitado,
  etiqueta,
}: {
  id: number
  direccion: 'arriba' | 'abajo'
  deshabilitado: boolean
  etiqueta: string
}) {
  return (
    <form action={moverCategoria}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direccion" value={direccion} />
      <button
        type="submit"
        disabled={deshabilitado}
        aria-label={etiqueta}
        className="text-ink/50 hover:text-ink flex size-11 items-center justify-center rounded-lg border border-black/10 text-xs transition-colors disabled:opacity-30 disabled:hover:text-black/50"
      >
        <span aria-hidden>{direccion === 'arriba' ? '▲' : '▼'}</span>
      </button>
    </form>
  )
}
