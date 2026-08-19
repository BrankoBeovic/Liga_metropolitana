import 'server-only'

import {
  MAX_IMAGEN_BYTES,
  MAX_IMAGEN_MB,
  TIPOS_IMAGEN_PERMITIDOS,
} from '@/lib/imagenes'
import { SUPABASE_URL } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

/** Buckets donde el CMS puede escribir. */
export type Bucket =
  'article-covers' | 'media-thumbnails' | 'avatars' | 'sponsor-logos'

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
  'media-thumbnails',
  'avatars',
  'sponsor-logos',
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
 * Borra de Storage la imagen que estaba en esa URL.
 *
 * Se llama al REEMPLAZAR o al borrar la fila que la usaba. Sin esto cada
 * cambio de portada, de avatar o de logo dejaba el archivo viejo ocupando lugar
 * para siempre, sin nada que lo referenciara: se acumulaban en silencio y solo
 * se veian mirando el bucket. Ya paso con la carpeta `cuerpo/`, donde seis
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
export async function borrarImagen(url: string | null | undefined) {
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
