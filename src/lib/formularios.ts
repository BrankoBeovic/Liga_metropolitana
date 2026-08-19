/**
 * El estado que devuelven los formularios publicos, y sus dos constructores.
 *
 * Lo comparten `/contacto` e `/inscribete`. Vive en un modulo neutro y no en
 * uno de los dos `actions.ts` por dos razones: de un archivo `'use server'`
 * solo se pueden exportar funciones async -una constante ahi rompe el build- y
 * ademas los formularios, que son componentes cliente, necesitan el tipo y el
 * estado inicial.
 */

export type EstadoFormulario = {
  error: string | null
  ok: string | null
  /**
   * Cambia en cada respuesta, y es lo que vuelve a montar el formulario.
   *
   * React resetea solo un `<form action={accion}>` cuando la accion termina:
   * los campos no controlados vuelven a su valor por defecto. Para un envio
   * que salio bien eso es justo lo que se quiere; para un error de validacion
   * es un desastre, porque la persona pierde todo lo que escribio y encima lee
   * que corrija algo que ya no esta en pantalla.
   *
   * Devolver los valores en el estado los repone, pero cambiar un
   * `defaultValue` no toca un input que ya esta montado. Con una `key` distinta
   * en cada respuesta React monta un formulario nuevo, y ahi los `defaultValue`
   * nuevos si se aplican.
   *
   * Funciona igual sin JavaScript: ahi la pagina se renderiza entera de nuevo
   * con este mismo estado.
   */
  nonce: string
  /** Lo que se envio, para repoblar los campos cuando hubo un error. */
  valores: Record<string, string>
}

/** Antes del primer envio no hay nada que decir ni nada que reponer. */
export const ESTADO_INICIAL: EstadoFormulario = {
  error: null,
  ok: null,
  nonce: 'inicial',
  valores: {},
}

/** Respuesta con error: conserva lo escrito. */
export function fallo(
  error: string,
  valores: Record<string, string>
): EstadoFormulario {
  return { error, ok: null, nonce: crypto.randomUUID(), valores }
}

/** Respuesta con exito: sin `valores`, para que el formulario quede limpio. */
export function exito(ok: string): EstadoFormulario {
  return { error: null, ok, nonce: crypto.randomUUID(), valores: {} }
}
