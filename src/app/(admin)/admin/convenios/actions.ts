'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import { borrarDeStorage, subirImagen } from '@/lib/admin/storage'
import { createClient } from '@/lib/supabase/server'
import { urlValida } from '@/lib/url'

export type EstadoBeneficio = { error: string | null; ok: string | null }

/** Tope de la descripción. La tarjeta pública la muestra entera, sin truncar. */
const MAX_DESCRIPCION = 400

function refrescarSitio() {
  revalidatePath('/convenios')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/convenios')
}

/**
 * Alta y edición de un convenio o beneficio.
 *
 * Calcada de `guardarSponsor`, con dos diferencias: el logo va a una
 * subcarpeta `benefits/` del bucket `sponsor-logos` en vez de un bucket
 * propio -agregar un bucket nuevo obliga a reescribir las cuatro políticas
 * de Storage (CLAUDE.md), y acá alcanza con compartir dueño y permisos-, y
 * ni el logo ni el link son obligatorios.
 */
export async function guardarBeneficio(
  _estado: EstadoBeneficio,
  formData: FormData
): Promise<EstadoBeneficio> {
  await requerirSesion()

  const id = formData.get('id')
  const nombre = String(formData.get('name') ?? '').trim()
  const descripcion = String(formData.get('description') ?? '').trim()
  const link = String(formData.get('link_url') ?? '').trim()
  const orden = Number(formData.get('display_order') ?? 0)
  const logoActual = String(formData.get('logo_actual') ?? '')
  const archivo = formData.get('logo')

  if (!nombre) return { error: 'El nombre es obligatorio.', ok: null }
  if (!descripcion) return { error: 'La descripción es obligatoria.', ok: null }
  if (descripcion.length > MAX_DESCRIPCION) {
    return {
      error: `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`,
      ok: null,
    }
  }
  if (link && !urlValida(link)) {
    return {
      error: 'El link debe empezar con http:// o https://',
      ok: null,
    }
  }

  let logoUrl = logoActual
  let logoAReemplazar: string | null = null
  let logoSubido: string | null = null

  if (archivo instanceof File && archivo.size > 0) {
    const subida = await subirImagen('sponsor-logos', archivo, 'benefits')
    if (subida.error !== null) return { error: subida.error, ok: null }
    logoUrl = subida.url
    logoSubido = subida.url
    if (logoActual && logoActual !== subida.url) logoAReemplazar = logoActual
  }

  const supabase = await createClient()

  // `is_active` no viaja en este formulario, igual que en sponsors: la
  // visibilidad se cambia con el boton "Ocultar/Mostrar" de la fila.
  const fila = {
    name: nombre,
    description: descripcion,
    link_url: link || null,
    logo_url: logoUrl || null,
    display_order: Number.isFinite(orden) ? orden : 0,
  }

  const { error } = id
    ? await supabase.from('benefits').update(fila).eq('id', Number(id))
    : await supabase.from('benefits').insert(fila)

  if (error) {
    console.error('No se pudo guardar el convenio:', error.message)
    await borrarDeStorage(logoSubido)
    return {
      error: 'No se pudo guardar. Revisa los datos e intenta de nuevo.',
      ok: null,
    }
  }

  await borrarDeStorage(logoAReemplazar)

  refrescarSitio()
  return { error: null, ok: id ? 'Convenio actualizado.' : 'Convenio creado.' }
}

export async function alternarBeneficio(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  const activar = formData.get('activar') === '1'

  const supabase = await createClient()
  const { error } = await supabase
    .from('benefits')
    .update({ is_active: activar })
    .eq('id', id)

  if (error) console.error('No se pudo cambiar el estado:', error.message)
  refrescarSitio()
}

export async function borrarBeneficio(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))

  const supabase = await createClient()

  const { data: antes } = await supabase
    .from('benefits')
    .select('logo_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('benefits').delete().eq('id', id)

  if (error) {
    console.error('No se pudo borrar el convenio:', error.message)
  } else if (antes) {
    await borrarDeStorage(antes.logo_url)
  }

  refrescarSitio()
}
