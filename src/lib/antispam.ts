/**
 * Defensas de los formularios publicos.
 *
 * Sin servicio externo y sin captcha, por ahora, y conviene ser honesto sobre
 * hasta donde llega esto.
 *
 * Lo que mas protege no esta escrito aca: los formularios se mandan con Server
 * Actions, asi que en el HTML no hay ningun `action="/api/algo"` al que un bot
 * de spam generico pueda postear. Para llegar hasta la accion hay que hablar el
 * protocolo de Next, mandar el id de la accion y pasar el chequeo de `Origin`
 * que Next hace solo. Eso ya deja afuera al spam automatizado de catalogo.
 *
 * Contra un bot que si corre un navegador quedan estas dos trampas. Son
 * baratas, no molestan a nadie y filtran la mayoria de lo que pasa el primer
 * filtro.
 *
 * **Si algun dia entra spam de verdad, el paso siguiente es Cloudflare
 * Turnstile**: es gratis, no pide resolver puzzles y no rastrea. Se enchufa en
 * `revisarTrampas` verificando el token contra el endpoint de Cloudflare, y en
 * los formularios con su widget. No se hizo ahora porque exige dos claves que
 * la Liga todavia no tiene, y una integracion a medias con claves inexistentes
 * es peor que ninguna.
 */

/**
 * Nombre del campo trampa.
 *
 * Tiene que sonar a campo real para que un bot lo complete: los que rellenan
 * todo lo que encuentran caen, y una persona nunca lo ve. Por eso NO se llama
 * "honeypot".
 */
export const CAMPO_TRAMPA = 'apellido_materno'

/** Nombre del campo con el momento en que se dibujo el formulario. */
export const CAMPO_TIEMPO = 'formulario_ts'

/**
 * Cuanto tarda como minimo una persona en llenar un formulario, en
 * milisegundos.
 *
 * Dos segundos y medio es deliberadamente bajo: la idea no es medir cuanto
 * tarda alguien en escribir sino descartar al que envia en el mismo instante en
 * que carga la pagina. Subirlo empezaria a rechazar a quien pega el texto desde
 * el portapapeles, que es una forma normal de completar un formulario largo.
 */
const MINIMO_MS = 2500

/**
 * Mira las trampas y dice si el envio parece de un bot.
 *
 * Devuelve la razon (para el log) o null si esta limpio.
 *
 * **Un `formulario_ts` ausente NO se rechaza**, y es una decision, no un olvido:
 * el campo lo completa JavaScript al montar, y las Server Actions funcionan sin
 * JavaScript. Rechazar por su ausencia dejaria afuera a quien navega sin JS,
 * que es alguien real, para atajar a un bot que igual puede mandar el campo con
 * cualquier valor. La trampa sirve contra el que no la conoce, no contra el que
 * la estudia.
 */
export function revisarTrampas(datos: FormData): string | null {
  const trampa = String(datos.get(CAMPO_TRAMPA) ?? '')
  if (trampa.trim() !== '') return 'campo trampa completado'

  const ts = Number(datos.get(CAMPO_TIEMPO))
  if (Number.isFinite(ts) && ts > 0) {
    const transcurrido = Date.now() - ts
    // Un valor futuro solo sale de un reloj desfasado o de un campo tocado a
    // mano. En los dos casos el dato no sirve, y no es motivo para rechazar a
    // alguien que puede ser real.
    if (transcurrido >= 0 && transcurrido < MINIMO_MS) {
      return `enviado en ${transcurrido} ms`
    }
  }

  return null
}
