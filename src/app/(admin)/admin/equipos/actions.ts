'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

/**
 * Borra una ficha de equipo.
 *
 * Lo administra todo el equipo, igual que jugadores: sacar a alguien de la
 * lista es reversible (se vuelve a inscribir).
 *
 * Con RLS, cero filas no es un error: hay que atajarlo a mano (CLAUDE.md).
 */
export async function borrarEquipo(formData: FormData) {
  await requerirSesion()

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('No se pudo borrar el equipo:', error.message)
    return
  }
  if (!data) {
    console.error('No se borro el equipo: RLS filtro la fila o ya no existia.')
    return
  }

  revalidatePath('/admin/equipos')
  revalidatePath('/admin/dashboard')
}
