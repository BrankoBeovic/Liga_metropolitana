'use server'

import { revisarTrampas } from '@/lib/antispam'
import { correoValido, enviarCorreo } from '@/lib/correo'
import { exito, fallo, type EstadoFormulario } from '@/lib/formularios'
import { categoriaValida } from '@/lib/inscripcion'

const MAX = { equipo: 120, nombre: 100, telefono: 30, mensaje: 2000 } as const

function recortar(datos: FormData, campo: string, max: number): string {
  return String(datos.get(campo) ?? '')
    .trim()
    .slice(0, max)
}

/**
 * Solicitud de inscripcion.
 *
 * Igual que `/contacto`, esto solo manda un correo: no crea equipos ni guarda
 * nada. La inscripcion de verdad la resuelve el equipo respondiendo. Armar una
 * tabla de solicitudes con su pantalla en el CMS seria un producto aparte, y
 * hoy nadie lo pidio.
 *
 * Con un bot devuelve exito por el mismo motivo que en contacto: no darle la
 * señal de que fue detectado.
 */
export async function enviarInscripcion(
  _estado: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const sospecha = revisarTrampas(datos)
  if (sospecha) {
    console.warn(`Inscripción descartada (${sospecha}).`)
    return exito('Solicitud enviada. La Liga se va a contactar contigo.')
  }

  const equipo = recortar(datos, 'equipo', MAX.equipo)
  const categoria = recortar(datos, 'categoria', 40)
  const nombre = recortar(datos, 'nombre', MAX.nombre)
  const correo = recortar(datos, 'correo', 254)
  const telefono = recortar(datos, 'telefono', MAX.telefono)
  const mensaje = recortar(datos, 'mensaje', MAX.mensaje)

  // Lo escrito vuelve en cada respuesta con error, para que el formulario se
  // repueble en vez de vaciarse. Ver el tipo en `contacto/actions.ts`.
  const valores = { equipo, categoria, nombre, correo, telefono, mensaje }
  const falla = (error: string) => fallo(error, valores)

  if (!equipo) return falla('Falta el nombre del equipo.')
  if (!nombre) return falla('Falta el nombre de contacto.')
  if (!correoValido(correo)) {
    return falla('Revisa el correo: no parece una dirección válida.')
  }
  if (!categoriaValida(categoria)) {
    return falla('Elige una categoría de la lista.')
  }

  const resultado = await enviarCorreo({
    asunto: `[Inscripción] ${equipo} (${categoria})`,
    responderA: correo,
    texto: [
      `Equipo: ${equipo}`,
      `Categoría: ${categoria}`,
      `Contacto: ${nombre}`,
      `Correo: ${correo}`,
      telefono ? `Teléfono: ${telefono}` : null,
      ...(mensaje ? ['', mensaje] : []),
      '',
      '--',
      'Enviado desde el formulario de inscripción de ligametropolitana.cl',
    ]
      .filter((l) => l !== null)
      .join('\n'),
  })

  if (!resultado.ok) return falla(resultado.error)

  return exito('Solicitud enviada. La Liga se va a contactar contigo.')
}
