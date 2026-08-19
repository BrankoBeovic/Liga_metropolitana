import 'server-only'

import { Resend } from 'resend'

/**
 * Envio de los correos que generan los formularios del sitio.
 *
 * Es lo unico que hace de verdad `/contacto` e `/inscribete`: no hay tabla, no
 * hay panel de mensajes recibidos. Un formulario que guarda en una base que
 * nadie mira es lo mismo que uno que no manda nada, y CLAUDE.md ya dice que eso
 * es peor que no tenerlo.
 *
 * **Los mensajes se mandan en texto plano, no en HTML.** No es un descuido: el
 * cuerpo lo escribe un desconocido en un `<textarea>` publico, y en texto plano
 * no existe la posibilidad de inyectar markup. Un aviso interno no gana nada
 * con formato.
 */

/**
 * De donde sale el correo.
 *
 * Resend exige que el dominio del remitente este verificado en su panel.
 * Mientras la Liga no tenga dominio propio, el respaldo es `onboarding@resend.dev`,
 * que Resend deja usar sin verificar nada **con una limitacion importante: solo
 * puede entregar a la casilla dueña de la cuenta de Resend**. Sirve para probar
 * el circuito completo; no sirve para producción con otra direccion.
 *
 * Al conectar el dominio: verificarlo en Resend y definir `CORREO_REMITENTE`
 * como `Liga Metropolitana <contacto@eldominio.cl>`.
 */
const REMITENTE_DE_PRUEBA = 'Liga Metropolitana <onboarding@resend.dev>'

export type ResultadoEnvio = { ok: true } | { ok: false; error: string }

/**
 * Revisa que la configuracion este completa antes de intentar nada.
 *
 * Devuelve la razon concreta si falta algo. El mensaje al usuario nunca la
 * incluye -no le sirve saber que falta una API key- pero queda en los logs,
 * que es el unico lugar donde el equipo se puede enterar de que el formulario
 * dejo de funcionar.
 */
function leerConfiguracion():
  | { api: string; destino: string; remitente: string; error: null }
  | { api: null; destino: null; remitente: null; error: string } {
  const api = process.env.RESEND_API_KEY
  const destino = process.env.CORREO_DESTINO

  if (!api) {
    return {
      api: null,
      destino: null,
      remitente: null,
      error: 'Falta RESEND_API_KEY.',
    }
  }
  if (!destino) {
    return {
      api: null,
      destino: null,
      remitente: null,
      error: 'Falta CORREO_DESTINO.',
    }
  }

  return {
    api,
    destino,
    remitente: process.env.CORREO_REMITENTE || REMITENTE_DE_PRUEBA,
    error: null,
  }
}

type Mensaje = {
  asunto: string
  /** Cuerpo en texto plano, ya armado por quien llama. */
  texto: string
  /**
   * Correo de quien escribio, para que responder desde el cliente de mail le
   * llegue a esa persona y no a nosotros mismos.
   *
   * Va en `replyTo` y NO en `from`: mandar con el dominio de otro es
   * exactamente lo que SPF y DMARC existen para frenar, y el correo terminaria
   * en spam o rebotado.
   */
  responderA?: string
}

export async function enviarCorreo(mensaje: Mensaje): Promise<ResultadoEnvio> {
  const config = leerConfiguracion()

  if (config.error !== null) {
    console.error(`No se puede enviar el formulario: ${config.error}`)
    return {
      ok: false,
      error:
        'El envío de correos no está configurado todavía. Escríbenos por Instagram mientras tanto.',
    }
  }

  try {
    const resend = new Resend(config.api)
    const { error } = await resend.emails.send({
      from: config.remitente,
      to: [config.destino],
      subject: mensaje.asunto,
      text: mensaje.texto,
      ...(mensaje.responderA ? { replyTo: mensaje.responderA } : {}),
    })

    if (error) {
      console.error('Resend rechazó el envío:', error.message)
      return {
        ok: false,
        error: 'No se pudo enviar el mensaje. Intenta de nuevo en un momento.',
      }
    }

    return { ok: true }
  } catch (e) {
    // Red caida, DNS, timeout. Nada que el usuario pueda arreglar, pero el
    // formulario tiene que decir algo en vez de quedarse pensando.
    console.error('Falló la llamada a Resend:', e)
    return {
      ok: false,
      error: 'No se pudo enviar el mensaje. Intenta de nuevo en un momento.',
    }
  }
}

/**
 * Valida una direccion de correo lo justo y necesario.
 *
 * No intenta ser exhaustiva a proposito: las expresiones regulares que
 * pretenden implementar el RFC 5322 son enormes, rechazan direcciones validas y
 * no evitan el unico problema real, que es una direccion bien formada pero
 * inexistente. Eso solo lo resuelve el rebote.
 *
 * Lo que si hace falta es que no tenga saltos de linea ni espacios: una
 * direccion con `\n` metida en una cabecera de correo es una inyeccion de
 * cabeceras, y de ahi salen los reenvios a terceros.
 */
export function correoValido(valor: string): boolean {
  if (valor.length > 254) return false
  if (/[\s<>]/.test(valor)) return false
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(valor)
}
