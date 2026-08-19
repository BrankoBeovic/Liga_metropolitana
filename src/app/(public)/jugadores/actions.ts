'use server'

import { revisarTrampas } from '@/lib/antispam'
import { correoValido, enviarCorreo } from '@/lib/correo'
import { exito, fallo, type EstadoFormulario } from '@/lib/formularios'
import {
  BIO_MAX,
  BIO_MIN,
  EDAD_MAX,
  EDAD_MIN,
  nombreCompleto,
  normalizarRut,
  posicionValida,
  rutValido,
} from '@/lib/jugadores'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX = { nombre: 80, apellido: 80, telefono: 30, rut: 16 } as const

function recortar(datos: FormData, campo: string, max: number): string {
  return String(datos.get(campo) ?? '')
    .trim()
    .slice(0, max)
}

/**
 * Alta de un jugador que busca equipo.
 *
 * El orden importa: primero se guarda la fila (es la fuente de verdad) y
 * despues se manda el correo. Si Resend no esta configurado o falla, la ficha
 * igual queda en `/admin/jugadores` y el visitante ve exito. Al reves -fallar
 * el formulario porque falta una API key- perderia al jugador.
 *
 * El insert usa la clave secreta a proposito: `anon` no tiene politica de
 * escritura, para que un bot no publique filas directo contra el REST.
 *
 * Con un bot devuelve exito por el mismo motivo que en contacto: no darle la
 * senal de que fue detectado.
 */
export async function enviarJugador(
  _estado: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const sospecha = revisarTrampas(datos)
  if (sospecha) {
    console.warn(`Jugador descartado (${sospecha}).`)
    return exito('Inscripción recibida. La Liga se va a contactar contigo.')
  }

  const nombre = recortar(datos, 'nombre', MAX.nombre)
  const apellido = recortar(datos, 'apellido', MAX.apellido)
  const edadCruda = recortar(datos, 'edad', 3)
  const rutCrudo = recortar(datos, 'rut', MAX.rut)
  const posicion = recortar(datos, 'posicion', 20)
  const bio = recortar(datos, 'bio', BIO_MAX)
  const correo = recortar(datos, 'correo', 254)
  const telefono = recortar(datos, 'telefono', MAX.telefono)

  const valores = {
    nombre,
    apellido,
    edad: edadCruda,
    rut: rutCrudo,
    posicion,
    bio,
    correo,
    telefono,
  }
  const falla = (error: string) => fallo(error, valores)

  if (!nombre) return falla('Falta tu nombre.')
  if (!apellido) return falla('Falta tu apellido.')

  const edad = Number.parseInt(edadCruda, 10)
  if (!Number.isInteger(edad) || edad < EDAD_MIN || edad > EDAD_MAX) {
    return falla(`La edad tiene que estar entre ${EDAD_MIN} y ${EDAD_MAX}.`)
  }

  if (!rutValido(rutCrudo)) {
    return falla('Revisa el RUT: el dígito verificador no calza.')
  }
  const rut = normalizarRut(rutCrudo)
  if (!rut) return falla('Revisa el RUT.')

  if (!posicionValida(posicion)) {
    return falla('Elige una posición de la lista.')
  }
  if (bio.length < BIO_MIN) {
    return falla('Cuéntanos un poco más de cómo juegas: la bio es muy corta.')
  }
  if (!correoValido(correo)) {
    return falla('Revisa el correo: no parece una dirección válida.')
  }

  const admin = createAdminClient()
  if (!admin) {
    console.error('No se puede guardar el jugador: falta SUPABASE_SECRET_KEY.')
    return falla(
      'El registro no está configurado todavía. Escríbenos por Instagram mientras tanto.'
    )
  }

  const { error } = await admin.from('players').insert({
    first_name: nombre,
    last_name: apellido,
    age: edad,
    rut,
    position: posicion,
    bio,
    email: correo,
    phone: telefono || null,
  })

  if (error) {
    if (error.code === '23505') {
      return falla(
        'Ya hay una inscripción con este RUT. Si necesitas actualizarla, escríbenos por Contacto.'
      )
    }
    console.error('No se pudo guardar el jugador:', error.message)
    return falla(
      'No se pudo guardar la inscripción. Intenta de nuevo en un momento.'
    )
  }

  const resultado = await enviarCorreo({
    asunto: `[Jugador] ${nombreCompleto(nombre, apellido)} (${posicion})`,
    responderA: correo,
    texto: [
      `Nombre: ${nombre}`,
      `Apellido: ${apellido}`,
      `Edad: ${edad}`,
      `RUT: ${rut}`,
      `Posición: ${posicion}`,
      `Correo: ${correo}`,
      telefono ? `Teléfono: ${telefono}` : null,
      '',
      bio,
      '',
      '--',
      'Enviado desde el formulario de jugadores de ligametropolitana.cl',
    ]
      .filter((l) => l !== null)
      .join('\n'),
  })

  if (!resultado.ok) {
    // La fila ya esta. El correo es el aviso, no el registro.
    console.error(`Jugador ${rut} guardado, pero el correo no salio.`)
  }

  return exito('Inscripción recibida. La Liga se va a contactar contigo.')
}
