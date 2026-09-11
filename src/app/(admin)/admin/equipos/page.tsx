import { Mail, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { formatearFecha } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

import { borrarEquipo } from './actions'

export const metadata: Metadata = { title: 'Equipos' }
export const dynamic = 'force-dynamic'

/**
 * Fichas de equipos que quieren sumarse a la Liga.
 *
 * No hay alta aca: el formulario publico de `/inscripciones` es el unico
 * camino, con antispam. Esta pantalla es para leer y, cuando ya se
 * incorporaron o se descarto la inscripcion, sacar la fila.
 */
export default async function EquiposAdminPage() {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: equipos } = await supabase
    .from('teams')
    .select(
      'id, name, player_count, founded_year, bio, contact_name, email, created_at'
    )
    .order('created_at', { ascending: false })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Equipos"
      descripcion="Equipos e instituciones que quieren sumarse a la Liga."
    >
      {equipos && equipos.length > 0 ? (
        <ul className="space-y-4">
          {equipos.map((e) => (
            <li key={e.id} className="rounded-xl p-5 ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-ink truncate text-sm font-bold">
                    {e.name}
                  </p>
                  <p className="text-ink/60 mt-0.5 text-xs">
                    {e.player_count} jugadores · Fundado en {e.founded_year} ·{' '}
                    {e.contact_name}
                  </p>
                  <p className="text-ink/45 mt-1 text-xs">
                    {formatearFecha(e.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <a
                    href={`mailto:${e.email}`}
                    className="text-ink/60 hover:text-ink flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium"
                  >
                    <Mail aria-hidden className="size-3.5" />
                    {e.email}
                  </a>

                  <form action={borrarEquipo}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      aria-label={`Borrar a ${e.name}`}
                      className="text-ink/45 flex size-11 items-center justify-center rounded-lg hover:bg-black/5 hover:text-red-600"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-ink/70 mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {e.bio}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no hay equipos"
          description="Cuando un equipo complete el formulario de /inscripciones, aparece acá."
        />
      )}
    </AdminShell>
  )
}
