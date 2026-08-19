'use server'

import { revisarTrampas } from '@/lib/antispam'
import { correoValido, enviarCorreo } from '@/lib/correo'
import { exito, fallo, type EstadoFormulario } from '@/lib/formularios'

/**
 * Topes de largo de cada campo.
 *
 * No son cosmeticos: sin ellos, el cuerpo de un formulario publico lo decide un
 * desconocido, y un mensaje de dos megas es un correo que rebota y un log que
 * se llena. El `maxLength` del input avisa temprano; esto es lo que manda.
 */
const MAX = { nombre: 100, asunto: 150, mensaje: 3000 } as const

function recortar(datos: FormData, campo: string, max: number): string {
  return String(datos.get(campo) ?? '')
    .trim()
    .slice(0, max)
}

/**
 * Mensaje de /contacto.
 *
 * Devuelve siempre un estado, nunca lanza: un `throw` en una Server Action le
 * muestra al visitante la pantalla de error de Next y le hace perder lo que
 * escribio.
 *
 * **Al detectar un bot devuelve exito.** Es a proposito: decirle "parece spam"
 * le da al que automatiza la señal que necesita para ajustar y volver a probar.
 * El mensaje no se manda y queda registrado en el log del servidor, que es
 * donde el equipo puede verlo si algun dia hace falta.
 */
export async function enviarContacto(
  _estado: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const sospecha = revisarTrampas(datos)
  if (sospecha) {
    console.warn(`Contacto descartado (${sospecha}).`)
    return exito('Mensaje enviado. Te vamos a responder pronto.')
  }

  const nombre = recortar(datos, 'nombre', MAX.nombre)
  const correo = recortar(datos, 'correo', 254)
  const asunto = recortar(datos, 'asunto', MAX.asunto)
  const mensaje = recortar(datos, 'mensaje', MAX.mensaje)

  // Lo escrito se devuelve en cada respuesta con error, para que el
  // formulario se repueble en vez de vaciarse.
  const valores = { nombre, correo, asunto, mensaje }
  const falla = (error: string) => fallo(error, valores)

  if (!nombre) return falla('Falta tu nombre.')
  if (!correoValido(correo)) {
    return falla('Revisa el correo: no parece una dirección válida.')
  }
  if (mensaje.length < 10) {
    return falla('Cuéntanos un poco más: el mensaje es muy corto.')
  }

  const resultado = await enviarCorreo({
    asunto: `[Contacto] ${asunto || 'Mensaje desde el sitio'}`,
    responderA: correo,
    texto: [
      `Nombre: ${nombre}`,
      `Correo: ${correo}`,
      asunto ? `Asunto: ${asunto}` : null,
      '',
      mensaje,
      '',
      '--',
      'Enviado desde el formulario de contacto de ligametropolitana.cl',
    ]
      .filter((l) => l !== null)
      .join('\n'),
  })

  if (!resultado.ok) return falla(resultado.error)

  // Sin `valores`: el formulario se monta limpio despues de un envio que salio.
  return exito('Mensaje enviado. Te vamos a responder pronto.')
}
