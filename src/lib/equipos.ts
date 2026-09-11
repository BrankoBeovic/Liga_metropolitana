/**
 * Datos y validacion del formulario de equipos.
 *
 * Vive en un modulo neutro y no en `actions.ts` por la misma razon que
 * `lib/jugadores.ts`: de un archivo `'use server'` solo se pueden exportar
 * funciones async, y una constante ahi rompe el build.
 */

export const JUGADORES_MIN = 5
export const JUGADORES_MAX = 30

export const FUNDACION_MIN = 1900

export const BIO_MIN = 20
export const BIO_MAX = 500

/** Cantidad de jugadores dentro del rango que acepta la base. */
export function cantidadValida(valor: number): boolean {
  return (
    Number.isInteger(valor) && valor >= JUGADORES_MIN && valor <= JUGADORES_MAX
  )
}

/**
 * Año de fundacion valido: no antes de `FUNDACION_MIN` ni despues de hoy.
 *
 * El limite superior no vive en la base (CLAUDE.md: los CHECK de este
 * proyecto usan rangos estaticos, no funciones de fecha) asi que se valida
 * aca, donde tener el año de hoy es trivial.
 */
export function fundacionValida(valor: number): boolean {
  const anioActual = new Date().getFullYear()
  return (
    Number.isInteger(valor) && valor >= FUNDACION_MIN && valor <= anioActual
  )
}
