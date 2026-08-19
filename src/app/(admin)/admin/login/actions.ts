'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type EstadoLogin = { error: string | null }

/**
 * Solo acepta destinos internos.
 *
 * `redirectTo` viene de la query string, que la controla quien arma el enlace.
 * Sin este filtro, `/admin/login?redirectTo=https://sitio-falso.cl` convierte
 * el login en un redirector abierto: el usuario ve nuestro dominio, se loguea
 * de verdad y termina en otro lado. Se exige que empiece con `/admin/` y no
 * con `//`, que el navegador interpreta como host externo.
 */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const ruta = typeof valor === 'string' ? valor : ''
  if (ruta.startsWith('/admin/') && !ruta.startsWith('//')) return ruta
  return '/admin/dashboard'
}

export async function iniciarSesion(
  _estado: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Completa el correo y la contraseña.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensaje generico a proposito: distinguir "no existe ese correo" de
    // "contraseña incorrecta" le confirma a un atacante que direcciones estan
    // registradas.
    console.error('Fallo de login:', error.message)
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // redirect() lanza una excepcion de control de Next, asi que va fuera del
  // try/catch y despues de que la sesion quedo escrita en la cookie.
  redirect(destinoSeguro(formData.get('redirectTo')))
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
