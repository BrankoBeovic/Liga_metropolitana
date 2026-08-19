import { Mail, Phone, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { formatearFecha } from '@/lib/format'
import { formatearRut, nombreCompleto } from '@/lib/jugadores'
import { createClient } from '@/lib/supabase/server'

import { borrarJugador } from './actions'

export const metadata: Metadata = { title: 'Jugadores' }
export const dynamic = 'force-dynamic'

/**
 * Fichas de quienes buscan equipo.
 *
 * No hay alta aca: el formulario publico es el unico camino, con antispam y
 * validacion de RUT. Esta pantalla es para leer y, cuando un club ya lo
 * fichó, sacar la fila.
 */
export default async function JugadoresAdminPage() {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: jugadores } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, age, rut, position, bio, email, phone, created_at'
    )
    .order('created_at', { ascending: false })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Jugadores"
      descripcion="Quienes quieren jugar y no tienen equipo. El RUT no se publica en el sitio."
    >
      {jugadores && jugadores.length > 0 ? (
        <ul className="space-y-4">
          {jugadores.map((j) => (
            <li key={j.id} className="rounded-xl p-5 ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-ink truncate text-sm font-bold">
                    {nombreCompleto(j.first_name, j.last_name)}
                  </p>
                  <p className="text-ink/60 mt-0.5 text-xs">
                    {j.age} años · {j.position} · {formatearRut(j.rut)}
                  </p>
                  <p className="text-ink/45 mt-1 text-xs">
                    {formatearFecha(j.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <a
                    href={`mailto:${j.email}`}
                    className="text-ink/60 hover:text-ink flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium"
                  >
                    <Mail aria-hidden className="size-3.5" />
                    {j.email}
                  </a>
                  {j.phone ? (
                    <a
                      href={`tel:${j.phone}`}
                      className="text-ink/60 hover:text-ink flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium"
                    >
                      <Phone aria-hidden className="size-3.5" />
                      {j.phone}
                    </a>
                  ) : null}

                  <form action={borrarJugador}>
                    <input type="hidden" name="id" value={j.id} />
                    <button
                      type="submit"
                      aria-label={`Borrar a ${nombreCompleto(j.first_name, j.last_name)}`}
                      className="text-ink/45 flex size-11 items-center justify-center rounded-lg hover:bg-black/5 hover:text-red-600"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-ink/70 mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {j.bio}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no hay jugadores"
          description="Cuando alguien complete el formulario de /jugadores, aparece acá."
        />
      )}
    </AdminShell>
  )
}
