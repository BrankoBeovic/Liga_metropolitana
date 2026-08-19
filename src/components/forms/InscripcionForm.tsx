'use client'

import { useActionState } from 'react'

import { enviarInscripcion } from '@/app/(public)/inscribete/actions'
import { ESTADO_INICIAL } from '@/lib/formularios'
import { CATEGORIAS } from '@/lib/inscripcion'

import { BotonEnviar, CampoArea, CampoSelect, CampoTexto } from './Campos'
import { CamposAntispam } from './CamposAntispam'
import { Resultado } from './Resultado'

/**
 * Formulario de inscripcion de un equipo.
 *
 * Pide lo minimo para poder responder: quien es el equipo, en que categoria
 * quiere jugar y como ubicarlo. Todo lo demas -jugadores, documentos, cuotas-
 * lo resuelve la conversacion que empieza con este correo. Un formulario de
 * inscripcion completo, con plantel y fichas, es otro producto y hoy nadie lo
 * pidio.
 */
export function InscripcionForm() {
  const [estado, accion] = useActionState(enviarInscripcion, ESTADO_INICIAL)

  return (
    /*
      La `key` cambia en CADA respuesta: remontar el formulario es lo que repone
      lo escrito cuando hay un error de validacion. El porque esta en
      `lib/formularios.ts`.
    */
    <form key={estado.nonce} action={accion} className="grid gap-5">
      <CamposAntispam />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="insc-equipo"
          name="equipo"
          defaultValue={estado.valores.equipo ?? ''}
          label="Nombre del equipo"
          required
          maxLength={120}
          placeholder="Club Deportivo..."
        />
        <CampoSelect
          id="insc-categoria"
          name="categoria"
          label="Categoría"
          required
          defaultValue={estado.valores.categoria ?? ''}
          opciones={CATEGORIAS}
          ayuda="Si no estás seguro, elige la última opción y lo vemos juntos."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="insc-nombre"
          name="nombre"
          defaultValue={estado.valores.nombre ?? ''}
          label="Nombre de contacto"
          required
          maxLength={100}
          autoComplete="name"
          placeholder="Quién queda a cargo"
        />
        <CampoTexto
          id="insc-correo"
          name="correo"
          defaultValue={estado.valores.correo ?? ''}
          type="email"
          label="Correo"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="tu@correo.cl"
        />
      </div>

      <CampoTexto
        id="insc-telefono"
        name="telefono"
        defaultValue={estado.valores.telefono ?? ''}
        type="tel"
        label="Teléfono"
        maxLength={30}
        autoComplete="tel"
        placeholder="+56 9 ..."
        ayuda="Opcional, pero acelera la respuesta."
      />

      <CampoArea
        id="insc-mensaje"
        name="mensaje"
        defaultValue={estado.valores.mensaje ?? ''}
        label="Algo más que debamos saber"
        rows={5}
        maxLength={2000}
        placeholder="Cuántos jugadores son, si ya jugaron antes, dudas que tengan."
      />

      <Resultado estado={estado} />

      <div>
        <BotonEnviar>Enviar solicitud</BotonEnviar>
      </div>
    </form>
  )
}
