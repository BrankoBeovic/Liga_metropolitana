/**
 * Datos y validacion del formulario de jugadores sin equipo.
 *
 * Vive en un modulo neutro y no en `actions.ts` porque de un archivo
 * `'use server'` solo se pueden exportar funciones async: una constante ahi
 * rompe el build con "can only export async functions".
 *
 * Las posiciones son las cinco de la cancha mas "Varias" para quien no se
 * queda en un puesto. Si la Liga quiere otra lista, se corrige aca y el CHECK
 * de `players.position` en la migracion.
 */

export const POSICIONES = [
  '',
  'Base',
  'Escolta',
  'Alero',
  'Ala-pívot',
  'Pívot',
  'Varias',
] as const

export type Posicion = (typeof POSICIONES)[number]

export const EDAD_MIN = 18
export const EDAD_MAX = 99
export const BIO_MIN = 20
export const BIO_MAX = 800

/**
 * Si el valor recibido es una de las posiciones que ofrecimos.
 *
 * El `required` del select es del navegador, y quien manda la peticion a mano
 * puede escribir cualquier cosa. Sin este chequeo, esa cadena arbitraria
 * chocaria contra el CHECK de la base con un error opaco.
 */
export function posicionValida(valor: string): boolean {
  return POSICIONES.includes(valor as Posicion) && valor !== ''
}

/**
 * Deja el RUT en la forma canonica que guarda la base: sin puntos ni espacios,
 * con guion, DV en mayuscula. `null` si no se puede ni reconocer.
 */
export function normalizarRut(valor: string): string | null {
  const limpio = valor
    .trim()
    .replace(/\./g, '')
    .replace(/\s/g, '')
    .toUpperCase()

  const conGuion = limpio.includes('-')
    ? limpio
    : limpio.length >= 2
      ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}`
      : limpio

  const partes = conGuion.split('-')
  if (partes.length !== 2) return null

  const cuerpo = partes[0]
  const dv = partes[1]
  if (!cuerpo || !dv) return null
  if (!/^[0-9]{7,8}$/.test(cuerpo)) return null
  if (!/^[0-9K]$/.test(dv)) return null

  return `${cuerpo}-${dv}`
}

/**
 * Digito verificador chileno (modulo 11).
 *
 * Recorre el cuerpo de derecha a izquierda multiplicando 2..7 en ciclo.
 * El resto 11 es 0; el resto 10 es K.
 */
function dvDe(cuerpo: string): string {
  let suma = 0
  let multiplo = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/** RUT chileno bien formado y con DV correcto. */
export function rutValido(valor: string): boolean {
  const n = normalizarRut(valor)
  if (!n) return false
  const cuerpo = n.slice(0, n.indexOf('-'))
  const dv = n.slice(n.indexOf('-') + 1)
  return dvDe(cuerpo) === dv
}

/** `12.345.678-9` para mostrar. Recibe el canonico de la base. */
export function formatearRut(rut: string): string {
  const n = normalizarRut(rut)
  if (!n) return rut
  const cuerpo = n.slice(0, n.indexOf('-'))
  const dv = n.slice(n.indexOf('-') + 1)
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${conPuntos}-${dv}`
}

/** Nombre y apellido juntos, para listados y correos. */
export function nombreCompleto(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.trim()
}
