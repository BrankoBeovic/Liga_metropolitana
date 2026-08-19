'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import {
  borrarDeStorage,
  confirmarSubidaPdf,
  crearSubidaFirmada,
} from '@/lib/admin/storage'
import { createClient } from '@/lib/supabase/server'

export type EstadoDocumento = { error: string | null; ok: string | null }

/** Tope del titulo. La tarjeta publica lo muestra entero, sin truncar. */
const MAX_TITULO = 120

/** Tope de la bajada. Misma razon: se muestra completa. */
const MAX_DESCRIPCION = 400

function refrescar() {
  revalidatePath('/documentos')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/documentos')
}

/**
 * Primer paso de la subida: pedirle a Storage una URL firmada.
 *
 * El navegador sube el PDF directo con esa firma, sin que el archivo cruce por
 * el servidor. Es lo que saca de la ecuacion el tope de 16 MB del cuerpo de las
 * Server Actions; el porque largo esta en `lib/admin/storage.ts`.
 *
 * Exige sesion aunque `createSignedUploadUrl` ya pase por las politicas de
 * Storage: firmar una subida es dar permiso de escritura, y esa decision no
 * deberia depender de una sola capa.
 */
export async function pedirSubidaDocumento() {
  await requerirSesion()
  return crearSubidaFirmada()
}

type DatosDocumento = {
  id?: number
  title: string
  description: string
  /** Ruta del PDF recien subido. Vacia si se esta editando sin cambiar el archivo. */
  ruta?: string
  /** URL del PDF que ya tenia la fila, para poder reemplazarlo. */
  urlActual?: string
}

/**
 * Segundo paso: verificar el archivo y guardar la fila.
 *
 * El orden importa y no es intercambiable. Primero se confirma el objeto en
 * Storage -que es donde de verdad se valida tipo y peso, porque el archivo
 * nunca pasa por aca- y recien despues se escribe en la base. Si la escritura
 * falla, se borra lo que se acaba de subir; si sale bien, se borra el PDF viejo
 * que quedo sin nadie que lo referencie.
 *
 * Es la misma coreografia de `guardarSponsor`, con un paso mas: alla el archivo
 * llega adentro de la accion y se valida al recibirlo.
 */
export async function guardarDocumento(
  datos: DatosDocumento
): Promise<EstadoDocumento> {
  await requerirSesion()

  const titulo = datos.title.trim()
  const descripcion = datos.description.trim()

  if (!titulo) return { error: 'El título es obligatorio.', ok: null }
  if (titulo.length > MAX_TITULO) {
    return {
      error: `El título no puede pasar de ${MAX_TITULO} caracteres.`,
      ok: null,
    }
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    return {
      error: `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`,
      ok: null,
    }
  }

  let fileUrl = datos.urlActual ?? ''
  let bytes: number | null = null
  let subidoAhora: string | null = null
  let aReemplazar: string | null = null

  if (datos.ruta) {
    const confirmacion = await confirmarSubidaPdf(datos.ruta)
    // Comparacion contra null y no por veracidad: con `if (confirmacion.error)`
    // TypeScript no estrecha la union, porque la cadena vacia tambien es falsa.
    if (confirmacion.error !== null) {
      return { error: confirmacion.error, ok: null }
    }
    fileUrl = confirmacion.url
    bytes = confirmacion.bytes
    subidoAhora = confirmacion.url
    if (datos.urlActual && datos.urlActual !== confirmacion.url) {
      aReemplazar = datos.urlActual
    }
  }

  if (!fileUrl) {
    return { error: 'Falta el archivo PDF.', ok: null }
  }

  const supabase = await createClient()

  /*
    `is_active` no viaja en este formulario, igual que en sponsors: la
    visibilidad se cambia con el boton de la fila, que esta siempre a la vista.
    Si el formulario la mandara, editar el titulo de un documento oculto lo
    volveria visible sin que nadie lo pidiera.

    `file_size_bytes` solo se escribe cuando hubo archivo nuevo. Al editar solo
    el titulo, el peso de la fila sigue siendo el correcto y pisarlo con null
    dejaria el boton de descarga sin el dato.
  */
  const fila = {
    title: titulo,
    description: descripcion || null,
    file_url: fileUrl,
    ...(bytes !== null ? { file_size_bytes: bytes } : {}),
  }

  const { error } = datos.id
    ? await supabase.from('documents').update(fila).eq('id', datos.id)
    : await supabase.from('documents').insert(fila)

  if (error) {
    console.error('No se pudo guardar el documento:', error.message)
    await borrarDeStorage(subidoAhora)
    return {
      error: 'No se pudo guardar. Revisa los datos e intenta de nuevo.',
      ok: null,
    }
  }

  await borrarDeStorage(aReemplazar)

  refrescar()
  return {
    error: null,
    ok: datos.id ? 'Documento actualizado.' : 'Documento publicado.',
  }
}

export async function alternarDocumento(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  const activar = formData.get('activar') === '1'

  const supabase = await createClient()
  const { error } = await supabase
    .from('documents')
    .update({ is_active: activar })
    .eq('id', id)

  if (error) console.error('No se pudo cambiar el estado:', error.message)
  refrescar()
}

export async function borrarDocumento(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))

  const supabase = await createClient()

  /*
    La URL se lee ANTES del delete: despues la fila ya no esta y no habria de
    donde sacarla.

    Se borra tambien el archivo. Cada subida genera un nombre nuevo con
    `crypto.randomUUID()`, asi que dos documentos nunca comparten PDF y no hay
    riesgo de dejar a otra fila sin su archivo.
  */
  const { data: antes } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) {
    console.error('No se pudo borrar el documento:', error.message)
  } else if (antes) {
    await borrarDeStorage(antes.file_url)
  }

  refrescar()
}
