/**
 * Reglas de las imagenes que sube el CMS.
 *
 * Vive aca y no en `lib/admin/storage.ts` porque aquel es `server-only` y estos
 * valores tambien los necesita el navegador, para avisar del peso antes de
 * mandar el formulario en vez de despues.
 *
 * Ojo con el limite: tiene que quedar por debajo del `bodySizeLimit` de las
 * Server Actions que fija `next.config.mjs`, contando que el formulario de
 * sponsors manda hasta tres archivos a la vez. Si sube uno, revisar el otro.
 */
export const MAX_IMAGEN_MB = 5
export const MAX_IMAGEN_BYTES = MAX_IMAGEN_MB * 1024 * 1024

export const TIPOS_IMAGEN_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const

/** El `accept` de los `input type="file"`, derivado de la lista de arriba. */
export const ACCEPT_IMAGENES = TIPOS_IMAGEN_PERMITIDOS.join(',')

/**
 * Revisa un archivo elegido en el navegador.
 *
 * Devuelve el aviso a mostrar, o null si esta bien. No reemplaza a la
 * validacion del servidor, que sigue siendo la que manda: el `accept` de un
 * input es una sugerencia para el selector de archivos, no una restriccion.
 */
export function revisarImagen(archivo: File): string | null {
  if (archivo.size > MAX_IMAGEN_BYTES) {
    const mb = (archivo.size / 1024 / 1024).toFixed(1)
    return `Pesa ${mb} MB y el máximo es ${MAX_IMAGEN_MB} MB. Elige una más liviana.`
  }

  if (
    !TIPOS_IMAGEN_PERMITIDOS.includes(
      archivo.type as (typeof TIPOS_IMAGEN_PERMITIDOS)[number]
    )
  ) {
    return 'Formato no admitido. Usa JPG, PNG, WebP, AVIF o SVG.'
  }

  return null
}
