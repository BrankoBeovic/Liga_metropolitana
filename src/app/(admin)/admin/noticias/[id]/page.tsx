import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminShell } from '@/components/admin/AdminShell'
import { ArticleForm } from '@/components/admin/ArticleForm'
import { requerirSesion } from '@/lib/admin/session'
import { rutaNoticia } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

import { borrarArticulo } from '../actions'

export const metadata: Metadata = { title: 'Editar nota' }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditarNotaPage({ params }: Props) {
  const { id } = await params
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: nota } = await supabase
    .from('posts')
    .select(
      'id, title, excerpt, content, category_id, cover_image_url, cover_image_alt, is_featured, is_anonymous, status, slug'
    )
    .eq('id', Number(id))
    .maybeSingle()

  // 404 tambien cuando la nota existe pero es de otro autor: RLS no la
  // devuelve, y decir "no existe" es preferible a confirmar que existe y no se
  // puede ver.
  if (!nota) notFound()

  const { data: categorias } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order', { ascending: true })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Editar nota"
      descripcion={
        nota.status === 'published'
          ? 'Está publicada en el sitio.'
          : 'Es un borrador.'
      }
      acciones={
        nota.status === 'published' ? (
          <Link
            href={rutaNoticia(nota.slug)}
            className="font-display text-ink flex h-11 items-center rounded-lg px-4 text-sm font-bold ring-1 ring-black/10"
          >
            Ver en el sitio
          </Link>
        ) : undefined
      }
    >
      <ArticleForm categorias={categorias ?? []} articulo={nota} />

      <div className="mt-12 border-t border-black/5 pt-6">
        <form action={borrarArticulo}>
          <input type="hidden" name="id" value={nota.id} />
          <button
            type="submit"
            className="text-accent/70 hover:text-accent flex min-h-11 items-center text-xs font-medium"
          >
            Borrar esta nota
          </button>
        </form>
        <p className="text-ink/45 mt-1 text-xs">
          No se puede deshacer. Si solo quieres sacarla del sitio, usa
          Despublicar.
        </p>
      </div>
    </AdminShell>
  )
}
