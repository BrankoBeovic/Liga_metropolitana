/**
 * Formato de fechas del sitio.
 *
 * Locale fijo `es-CL` y zona `America/Santiago`: sin fijarlos, el servidor
 * formatea con la zona del contenedor (UTC en Vercel) y el cliente con la del
 * visitante, con lo cual React tira un error de hidratacion en cuanto las dos
 * no coinciden. Ademas el medio es chileno: la fecha correcta es la de Chile,
 * no la del lector.
 */
const LOCALE = 'es-CL'
const ZONA = 'America/Santiago'

const FECHA_LARGA = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: ZONA,
})

const FECHA_CORTA = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  timeZone: ZONA,
})

export function formatearFecha(iso: string | null): string {
  if (!iso) return ''
  return FECHA_LARGA.format(new Date(iso))
}

export function formatearFechaCorta(iso: string | null): string {
  if (!iso) return ''
  return FECHA_CORTA.format(new Date(iso))
}

/**
 * Tiempo de lectura en texto.
 *
 * Devuelve cadena vacia si no hay dato, para que quien lo use pueda omitir el
 * separador en vez de mostrar "· min".
 */
export function formatearLectura(minutos: number | null): string {
  if (!minutos || minutos < 1) return ''
  return `${minutos} min de lectura`
}

/**
 * Peso de un archivo, en texto.
 *
 * Va junto al boton de descarga de cada PDF: quien esta con datos moviles
 * merece saber si va a bajar 300 KB o 22 MB antes de tocar.
 *
 * Redondea a un decimal desde 1 MB y a entero abajo, porque "0,4 MB" se lee
 * peor que "412 KB" y "1.024 KB" peor que "1 MB". Cadena vacia si no hay dato,
 * para que quien lo use pueda omitir el separador en vez de mostrar "· ".
 */
export function formatearPeso(bytes: number | null): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}
