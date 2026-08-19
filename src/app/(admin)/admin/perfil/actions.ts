'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import { borrarImagen, subirImagen } from '@/lib/admin/storage'
import { rutaNoticia } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'
import { urlValida } from '@/lib/url'

export type EstadoPerfil = { error: string | null; ok: string | null }

/**
 * Tope de la bio.
 *
 * La base no lo impone. Es un limite de diseño: la firma al pie de la nota
 * muestra la bio entera. Se corta en el formulario con `maxLength` y se
 * vuelve a chequear aca, porque el atributo del input es una sugerencia del
 * navegador y no una restriccion.
 */
const MAX_BIO = 400

export async function guardarPerfil(
  _estado: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  const sesion = await requerirSesion()

  const nombre = String(formData.get('full_name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const twitter = String(formData.get('twitter_url') ?? '').trim()
  const instagram = String(formData.get('instagram_url') ?? '').trim()
  const avatarActual = String(formData.get('avatar_actual') ?? '')
  const archivo = formData.get('avatar')

  if (!nombre) {
    return { error: 'El nombre es obligatorio.', ok: null }
  }
  if (bio.length > MAX_BIO) {
    return {
      error: `La bio no puede pasar de ${MAX_BIO} caracteres.`,
      ok: null,
    }
  }
  if (twitter && !urlValida(twitter)) {
    return { error: 'El enlace de X debe empezar con https://', ok: null }
  }
  if (instagram && !urlValida(instagram)) {
    return {
      error: 'El enlace de Instagram debe empezar con https://',
      ok: null,
    }
  }

  let avatarUrl = avatarActual
  // El avatar anterior y el recien subido. El primero se borra al terminar
  // bien; el segundo, si la escritura falla. Ver `borrarImagen`.
  let avatarAReemplazar: string | null = null
  let subidaNueva: string | null = null

  if (archivo instanceof File && archivo.size > 0) {
    const subida = await subirImagen('avatars', archivo)
    if (subida.error !== null) return { error: subida.error, ok: null }
    avatarUrl = subida.url
    subidaNueva = subida.url
    if (avatarActual && avatarActual !== subida.url) {
      avatarAReemplazar = avatarActual
    }
  }

  const supabase = await createClient()

  /*
    `role` no se manda nunca, ni siquiera como campo oculto del formulario.

    El trigger `guard_profile_role_change` ya impide que alguien se ascienda
    solo, pero eso es la ultima linea de defensa y no la primera: si el rol no
    viaja en la peticion, no hay nada que el trigger tenga que atajar.

    El `eq('id', sesion.userId)` toma el id de la sesion y no del formulario,
    por la misma razon. La politica `profiles_update` lo verifica igual del
    lado de la base.
  */
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: nombre,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      twitter_url: twitter || null,
      instagram_url: instagram || null,
    })
    .eq('id', sesion.userId)

  if (error) {
    console.error('No se pudo guardar el perfil:', error.message)
    await borrarImagen(subidaNueva)
    return { error: 'No se pudo guardar. Intenta de nuevo.', ok: null }
  }

  await borrarImagen(avatarAReemplazar)

  /*
    El perfil se ve en el sitio publico en la firma al pie de cada nota propia.

    Se revalidan las notas una por una en vez de la ruta con comodin porque el
    autor puede tener muchas y solo las publicadas estan cacheadas.
  */
  const { data: notas } = await supabase
    .from('posts')
    .select('slug')
    .eq('author_id', sesion.userId)
    .eq('status', 'published')

  for (const nota of notas ?? []) revalidatePath(rutaNoticia(nota.slug))
  revalidatePath('/admin/perfil')

  return { error: null, ok: 'Perfil actualizado.' }
}

export type EstadoPassword = { error: string | null; ok: string | null }

/**
 * Minimo de la contraseña nueva.
 *
 * Ocho y no seis, que es el minimo por defecto de Supabase. Si el proyecto
 * tuviera configurado uno mayor, Auth lo rechazaria igual y su mensaje se
 * muestra tal cual: mas vale repetir la regla que contradecirla.
 */
const MIN_PASSWORD = 8

/**
 * Cambia la contraseña de quien esta logueado.
 *
 * **Pide la contraseña actual aunque Supabase no la exija.** `updateUser` la
 * cambia con solo tener sesion valida, y eso significa que una sesion olvidada
 * abierta en una computadora compartida alcanza para dejar afuera al dueño de
 * la cuenta. Verificarla cuesta una llamada y cierra ese agujero.
 *
 * El correo sale de la sesion y no del formulario, por el mismo criterio que
 * `guardarPerfil` toma el `id` de la sesion: lo que no viaja en la peticion no
 * hay que atajarlo.
 */
export async function cambiarPassword(
  _estado: EstadoPassword,
  formData: FormData
): Promise<EstadoPassword> {
  const sesion = await requerirSesion()

  const actual = String(formData.get('actual') ?? '')
  const nueva = String(formData.get('nueva') ?? '')
  const confirmacion = String(formData.get('confirmacion') ?? '')

  if (!actual || !nueva || !confirmacion) {
    return { error: 'Completa los tres campos.', ok: null }
  }
  if (nueva !== confirmacion) {
    return {
      error: 'La contraseña nueva y su confirmación no coinciden.',
      ok: null,
    }
  }
  if (nueva.length < MIN_PASSWORD) {
    return {
      error: `La contraseña nueva tiene que tener al menos ${MIN_PASSWORD} caracteres.`,
      ok: null,
    }
  }
  if (nueva === actual) {
    return { error: 'La contraseña nueva es igual a la actual.', ok: null }
  }
  if (!sesion.email) {
    // Sin correo no hay con que verificar la actual. No deberia pasar: el alta
    // de usuarios del CMS es por invitacion y siempre lleva correo.
    return {
      error:
        'Esta cuenta no tiene correo, así que no se puede verificar la contraseña actual.',
      ok: null,
    }
  }

  const supabase = await createClient()

  const { error: errorVerificacion } = await supabase.auth.signInWithPassword({
    email: sesion.email,
    password: actual,
  })

  if (errorVerificacion) {
    // Mensaje propio y no el de Auth: el suyo habla de credenciales de inicio
    // de sesion, que aca confunde porque la persona ya esta adentro.
    return { error: 'La contraseña actual no es correcta.', ok: null }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })

  if (error) {
    console.error('No se pudo cambiar la contraseña:', error.message)
    return { error: error.message, ok: null }
  }

  return { error: null, ok: 'Contraseña actualizada.' }
}
