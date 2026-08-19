import 'server-only'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type Rol = Database['public']['Enums']['user_role']

export type SesionAdmin = {
  userId: string
  email: string | null
  fullName: string
  rol: Rol
  esAdmin: boolean
}

/**
 * Sesion del CMS, o redireccion al login.
 *
 * El proxy ya rebota a quien no tiene sesion, pero eso no alcanza: el proxy
 * mira la cookie, y cada pagina necesita ademas el ROL para decidir que
 * mostrar. Sin este chequeo en la pagina, un editor veria la pantalla de
 * categorias aunque RLS despues le rechace la escritura, que es la peor
 * combinacion: una interfaz que promete algo que la base niega.
 *
 * `getUser()` y no `getSession()`, por la misma razon que en el proxy: valida
 * el token contra el servidor de Auth.
 */
export async function requerirSesion(): Promise<SesionAdmin> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('No se pudo leer el perfil:', error.message)
  }

  const rol: Rol = perfil?.role ?? 'editor'

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: perfil?.full_name ?? user.email ?? 'Sin nombre',
    rol,
    esAdmin: rol === 'admin',
  }
}

/**
 * Igual que la anterior pero exige rol admin.
 *
 * Manda al dashboard en vez de al login: la persona SI esta autenticada, solo
 * que no le corresponde esa pantalla. Rebotarla al login le haria pensar que
 * se le vencio la sesion.
 */
export async function requerirAdmin(): Promise<SesionAdmin> {
  const sesion = await requerirSesion()
  if (!sesion.esAdmin) redirect('/admin/dashboard')
  return sesion
}
