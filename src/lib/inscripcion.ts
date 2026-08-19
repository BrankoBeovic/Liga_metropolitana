/**
 * Las categorias que ofrece el formulario de inscripcion.
 *
 * Son los tramos habituales del maxibasquetbol -de +30 en adelante, cada cinco
 * años- mas una salida para quien no sabe cual le toca.
 *
 * **No son la lista oficial de la Liga.** Cuando el equipo confirme sus
 * divisiones reales se corrige aca y nada mas: el selector se arma desde esta
 * lista y la validacion del servidor tambien.
 *
 * La opcion vacia va primera a proposito: sin ella el navegador da por elegida
 * la primera de la lista y todo el mundo termina mandando "+30" sin haberla
 * tocado.
 *
 * Vive en un modulo neutro y no en `actions.ts` porque de un archivo
 * `'use server'` solo se pueden exportar funciones async: una constante ahi
 * rompe el build con "can only export async functions".
 */
export const CATEGORIAS = [
  '',
  '+30',
  '+35',
  '+40',
  '+45',
  '+50',
  '+55',
  '+60',
  '+65',
  '+70',
  'Todavía no lo sé',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

/**
 * Si el valor recibido es una de las opciones que ofrecimos.
 *
 * El `required` del select es del navegador, y quien manda la peticion a mano
 * puede escribir cualquier cosa. Sin este chequeo, esa cadena arbitraria
 * terminaria en el asunto del correo que le llega al equipo.
 */
export function categoriaValida(valor: string): boolean {
  return CATEGORIAS.includes(valor as Categoria) && valor !== ''
}
