import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { ArticleForm } from '@/components/admin/ArticleForm'
import { requerirSesion } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nueva nota' }
export const dynamic = 'force-dynamic'

export default async function NuevaNotaPage() {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: categorias } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order', { ascending: true })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Nueva nota"
      descripcion="Se guarda como borrador hasta que la publiques."
    >
      <ArticleForm categorias={categorias ?? []} />
    </AdminShell>
  )
}
