'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

/**
 * Borra una ficha de jugador.
 *
 * Lo administra todo el equipo, igual que documentos: sacar a alguien de la
 * lista es reversible (se vuelve a inscribir). Pedir que lo haga solo un admin
 * frenaria el trabajo cuando un club ya lo fichó.
 *
 * Con RLS, cero filas no es un error: hay que atajarlo a mano (CLAUDE.md).
 */
export async function borrarJugador(formData: FormData) {
  await requerirSesion()

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('No se pudo borrar el jugador:', error.message)
    return
  }
  if (!data) {
    console.error('No se borro el jugador: RLS filtro la fila o ya no existia.')
    return
  }

  revalidatePath('/admin/jugadores')
  revalidatePath('/admin/dashboard')
}
