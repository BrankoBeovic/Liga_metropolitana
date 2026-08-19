/**
 * Reglas de los PDF que sube el CMS.
 *
 * Vive aca y no en `lib/admin/storage.ts` porque aquel es `server-only` y estos
 * valores tambien los necesita el navegador, para avisar del peso al elegir el
 * archivo en vez de despues de la subida.
 *
 * A diferencia de las imagenes, **este tope no depende del `bodySizeLimit` de
 * las Server Actions**: el PDF no cruza por una Server Action, va directo a
 * Storage con una URL firmada (ver `crearSubidaFirmada`). Por eso puede ser
 * mucho mas alto que los 5 MB de `lib/imagenes.ts`.
 *
 * Cuarenta megas es holgado para lo que sube una liga -bases, reglamentos,
 * actas escaneadas- y deja margen contra el tope por archivo del proyecto en
 * Supabase, que en el plan gratuito son 50 MB. Si alguna vez se sube ese tope
 * en el dashboard, este numero puede subir con el; al reves no: un archivo mas
 * grande que el limite del proyecto lo rechaza Storage con un error que el
 * formulario no puede explicar bien.
 */
export const MAX_PDF_MB = 40
export const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024

export const TIPO_PDF = 'application/pdf'

/** El `accept` del input. Lleva la extension ademas del tipo: iOS y algunos
 *  Android no mandan `type` para los PDF que salen de la app de Archivos. */
export const ACCEPT_PDF = `${TIPO_PDF},.pdf`

/**
 * Revisa un archivo elegido en el navegador.
 *
 * Devuelve el aviso a mostrar, o null si esta bien. No reemplaza a la
 * validacion del servidor, que sigue siendo la que manda: el `accept` de un
 * input es una sugerencia para el selector de archivos, no una restriccion.
 *
 * El tipo se acepta tambien por extension, y no es un descuido: hay
 * navegadores moviles que entregan el archivo con `type` vacio. Rechazar por
 * eso dejaria a esas personas sin poder subir nada, y el servidor vuelve a
 * mirar el tipo real del objeto ya subido antes de guardar la fila.
 */
export function revisarPdf(archivo: File): string | null {
  if (archivo.size === 0) return 'El archivo está vacío.'

  if (archivo.size > MAX_PDF_BYTES) {
    const mb = (archivo.size / 1024 / 1024).toFixed(1)
    return `Pesa ${mb} MB y el máximo es ${MAX_PDF_MB} MB. Comprímelo o divídelo.`
  }

  const pareceUnPdf = archivo.type === TIPO_PDF || /\.pdf$/i.test(archivo.name)
  if (!pareceUnPdf) return 'Solo se admiten archivos PDF.'

  return null
}

/**
 * La misma URL, pero pidiendole a Storage que el navegador la baje en vez de
 * abrirla.
 *
 * El atributo `download` de un enlace **se ignora cuando el archivo es de otro
 * origen**, y los PDF viven en el dominio de Supabase. Sin esto, tocar
 * "Descargar" abre el visor de PDF del navegador, que no es lo que dice el
 * boton.
 *
 * Supabase resuelve el caso con `?download`, que le hace mandar
 * `Content-Disposition: attachment`. Se arma parseando la URL y no
 * concatenando: si algun dia la URL guardada trae query, un `+ '?download'`
 * a mano la rompe en silencio.
 */
export function urlDeDescarga(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('download', '')
    // `set` con cadena vacia deja `download=`, y Supabase espera la bandera
    // sola. El reemplazo la deja como `?download`.
    return u.toString().replace(/download=$/, 'download')
  } catch {
    return url
  }
}
