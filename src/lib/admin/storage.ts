import 'server-only'

import { MAX_PDF_BYTES, MAX_PDF_MB, TIPO_PDF } from '@/lib/archivos'
import {
  MAX_IMAGEN_BYTES,
  MAX_IMAGEN_MB,
  TIPOS_IMAGEN_PERMITIDOS,
} from '@/lib/imagenes'
import { SUPABASE_URL } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

/**
 * Buckets donde el CMS puede escribir.
 *
 * Son exactamente los cuatro que crea la migracion inicial. `media-thumbnails`
 * estuvo en esta lista hasta la Etapa 6 por arrastre de la fuente: nunca
 * existio en este proyecto, porque los Reels se leen en vivo de Instagram y no
 * hay tabla de multimedia. En su lugar entra `documents`, que es el de los PDF.
 */
export type Bucket =
  'article-covers' | 'avatars' | 'sponsor-logos' | 'documents'

// Las reglas viven en `lib/imagenes.ts` porque el navegador tambien las usa,
// para avisar del peso antes de mandar en vez de despues.
const TIPOS_PERMITIDOS = TIPOS_IMAGEN_PERMITIDOS
const MAX_BYTES = MAX_IMAGEN_BYTES

export type ResultadoSubida =
  { url: string; error: null } | { url: null; error: string }

/**
 * Sube una imagen al Storage y devuelve su URL publica.
 *
 * Valida tipo y peso en el servidor y no solo con el `accept` del input: el
 * atributo del input es una sugerencia para el selector de archivos del
 * sistema, no una restriccion, y cualquiera puede saltearlo mandando la
 * peticion a mano.
 *
 * El nombre del archivo que subio el usuario NO se reutiliza. Se arma uno
 * nuevo con `crypto.randomUUID()`: un nombre controlado por quien sube puede
 * traer barras y `..` para escribir fuera de la carpeta, y ademas dos personas
 * subiendo "logo.png" se pisarian.
 */
export async function subirImagen(
  bucket: Bucket,
  archivo: File,
  carpeta = ''
): Promise<ResultadoSubida> {
  if (archivo.size === 0) return { url: null, error: 'El archivo está vacío.' }

  if (archivo.size > MAX_BYTES) {
    return { url: null, error: `La imagen supera los ${MAX_IMAGEN_MB} MB.` }
  }

  if (
    !TIPOS_PERMITIDOS.includes(
      archivo.type as (typeof TIPOS_PERMITIDOS)[number]
    )
  ) {
    return {
      url: null,
      error: 'Formato no admitido. Usa JPG, PNG, WebP, AVIF o SVG.',
    }
  }

  const extension =
    archivo.type.split('/')[1]?.replace('svg+xml', 'svg') ?? 'bin'
  const ruta = `${carpeta ? `${carpeta.replace(/^\/+|\/+$/g, '')}/` : ''}${crypto.randomUUID()}.${extension}`

  // Cliente de sesion, no el de servicio: la subida pasa por las politicas de
  // Storage con la identidad del usuario. Si un dia se restringe quien puede
  // escribir en un bucket, esto lo respeta sin cambios.
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false })

  if (error) {
    console.error(`Fallo la subida a ${bucket}:`, error.message)
    return { url: null, error: 'No se pudo subir la imagen. Intenta de nuevo.' }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(ruta)
  return { url: data.publicUrl, error: null }
}

/** Los buckets de arriba, para poder validar lo que viene de una URL. */
const BUCKETS: readonly Bucket[] = [
  'article-covers',
  'avatars',
  'sponsor-logos',
  'documents',
]

/**
 * De una URL publica de Storage al bucket y la ruta dentro de el.
 *
 * Devuelve null si la URL no es nuestra. Se compara el origen ya parseado y no
 * con `startsWith` sobre la cadena, por la misma razon de siempre: una URL como
 * `https://malo.com/?x=https://proyecto.supabase.co/...` contiene la nuestra
 * adentro y pasaria cualquier comparacion ingenua.
 *
 * El bucket se valida contra la lista en vez de aceptar el que venga. Sin eso,
 * una URL armada a mano podria pedir el borrado de un objeto de cualquier otro
 * bucket del proyecto.
 */
function ubicarEnStorage(url: string): { bucket: Bucket; ruta: string } | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.origin !== new URL(SUPABASE_URL).origin) return null

  const prefijo = '/storage/v1/object/public/'
  if (!parsed.pathname.startsWith(prefijo)) return null

  const resto = parsed.pathname.slice(prefijo.length)
  const corte = resto.indexOf('/')
  if (corte <= 0) return null

  const bucket = decodeURIComponent(resto.slice(0, corte))
  const ruta = decodeURIComponent(resto.slice(corte + 1))
  if (!ruta) return null
  if (!BUCKETS.includes(bucket as Bucket)) return null

  return { bucket: bucket as Bucket, ruta }
}

/**
 * Borra de Storage el archivo que estaba en esa URL.
 *
 * Se llamaba `borrarImagen` hasta la Etapa 6. Ahora tambien borra los PDF de
 * `/documentos`, y el nombre viejo mentia sobre lo que hace.
 *
 * Se usa al REEMPLAZAR o al borrar la fila que lo usaba. Sin esto cada cambio
 * de portada, de avatar, de logo o de PDF dejaba el archivo viejo ocupando
 * lugar para siempre, sin nada que lo referenciara: se acumulaban en silencio y
 * solo se veian mirando el bucket. Ya paso con la carpeta `cuerpo/`, donde seis
 * archivos sumaban 6,1 MB y solo dos estaban en uso.
 *
 * NUNCA tira ni devuelve error, y eso es a proposito. Es tarea de limpieza y
 * corre DESPUES de que la escritura en la base salio bien: si fallara el
 * borrado del archivo viejo y eso volteara la accion, el usuario veria un error
 * sobre un guardado que en realidad se hizo. Un archivo de mas es mucho mas
 * barato que eso.
 *
 * Llamarla con null o con una URL ajena no hace nada, asi que quien llama no
 * tiene que preguntar antes.
 */
export async function borrarDeStorage(url: string | null | undefined) {
  if (!url) return

  const donde = ubicarEnStorage(url)
  if (!donde) return

  try {
    const supabase = await createClient()
    const { error } = await supabase.storage
      .from(donde.bucket)
      .remove([donde.ruta])
    if (error) {
      console.error(`No se pudo borrar ${donde.ruta}:`, error.message)
    }
  } catch (e) {
    console.error('Fallo el borrado en Storage:', e)
  }
}

/* -----------------------------------------------------------------------------
 * PDF: subida directa a Storage, sin pasar por una Server Action
 * -------------------------------------------------------------------------- */

/**
 * Por que los PDF no viajan por una Server Action, como si lo hacen las
 * imagenes.
 *
 * Next limita el cuerpo de una Server Action, y este proyecto lo tiene en 16 MB
 * (`next.config.mjs`). Para una portada de nota alcanza y sobra. Para un
 * reglamento escaneado no: un PDF de actas con firmas pasa los 16 MB sin
 * esfuerzo, y el error que devuelve Next en ese caso es un 413 que se ve
 * unicamente en los logs del servidor. Al usuario le llega un guardado que no
 * hace nada, sin mensaje.
 *
 * Con URL firmada el archivo va del navegador a Storage y no cruza por nuestro
 * servidor, asi que ese tope deja de existir. El costo es que hay que verificar
 * DESPUES: la parte que valida tipo y peso no puede correr antes de la subida
 * porque el servidor nunca ve el archivo. De eso se encarga
 * `confirmarSubidaPdf`.
 */
export type SubidaFirmada =
  | { ruta: string; token: string; error: null }
  | { ruta: null; token: null; error: string }

/**
 * Pide a Storage permiso para subir un archivo, una sola vez, a una ruta que
 * elegimos nosotros.
 *
 * El nombre del archivo que eligio la persona NO se reutiliza, igual que en
 * `subirImagen`: un nombre controlado por quien sube puede traer barras y `..`
 * para escribir fuera de la carpeta, y dos personas subiendo "bases.pdf" se
 * pisarian. El nombre visible del documento vive en la columna `title`, que es
 * donde tiene que estar.
 *
 * La firma la emite el cliente CON sesion, asi que Storage aplica sus politicas
 * con la identidad de quien pide: un anonimo no obtiene ninguna.
 */
export async function crearSubidaFirmada(): Promise<SubidaFirmada> {
  const ruta = `${crypto.randomUUID()}.pdf`
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(ruta)

  if (error || !data) {
    console.error('No se pudo firmar la subida del PDF:', error?.message)
    return {
      ruta: null,
      token: null,
      error: 'No se pudo preparar la subida. Intenta de nuevo.',
    }
  }

  return { ruta: data.path, token: data.token, error: null }
}

export type ConfirmacionPdf =
  | { url: string; bytes: number; error: null }
  | { url: null; bytes: null; error: string }

/**
 * Mira el objeto que quedo en Storage y decide si sirve.
 *
 * **Esta es la unica validacion real de tipo y peso de un PDF.** Lo que revisa
 * el navegador en `revisarPdf` es una cortesia para avisar temprano; quien
 * sube podria saltearla entera, porque el archivo va directo a Storage.
 *
 * Se lee del listado y no de la cabecera del archivo: `list` devuelve el
 * `metadata` que Storage guardo al recibirlo (tamaño y mimetype reales), sin
 * tener que bajar los megas de vuelta a nuestro servidor.
 *
 * Si algo no cuadra, **borra el objeto antes de devolver el error**. Un archivo
 * rechazado que igual se queda en el bucket es basura que nadie va a encontrar:
 * no tiene fila en la base que lo referencie.
 */
export async function confirmarSubidaPdf(
  ruta: string
): Promise<ConfirmacionPdf> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .list('', { search: ruta, limit: 1 })

  const objeto = data?.find((o) => o.name === ruta)

  if (error || !objeto) {
    console.error(
      `No se encontro el PDF recien subido (${ruta}):`,
      error?.message
    )
    return {
      url: null,
      bytes: null,
      error: 'No se encontró el archivo subido.',
    }
  }

  const metadata = objeto.metadata as {
    size?: number
    mimetype?: string
  } | null
  const bytes = typeof metadata?.size === 'number' ? metadata.size : 0
  const tipo = metadata?.mimetype ?? ''

  const rechazo =
    bytes === 0
      ? 'El archivo llegó vacío.'
      : bytes > MAX_PDF_BYTES
        ? `El archivo pesa más de ${MAX_PDF_MB} MB.`
        : tipo !== TIPO_PDF
          ? 'El archivo subido no es un PDF.'
          : null

  if (rechazo) {
    await supabase.storage.from('documents').remove([ruta])
    return { url: null, bytes: null, error: rechazo }
  }

  const { data: publica } = supabase.storage
    .from('documents')
    .getPublicUrl(ruta)

  return { url: publica.publicUrl, bytes, error: null }
}
