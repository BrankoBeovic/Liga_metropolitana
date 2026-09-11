'use client'

import { useActionState } from 'react'

import { enviarEquipo } from '@/app/(public)/inscripciones/actions'
import {
  BIO_MAX,
  BIO_MIN,
  FUNDACION_MIN,
  JUGADORES_MAX,
  JUGADORES_MIN,
} from '@/lib/equipos'
import { ESTADO_INICIAL } from '@/lib/formularios'

import { BotonEnviar, CampoArea, CampoTexto } from './Campos'
import { CamposAntispam } from './CamposAntispam'
import { Resultado } from './Resultado'

const ANIO_ACTUAL = new Date().getFullYear()

/**
 * Formulario de un equipo que quiere sumarse a la Liga.
 *
 * Pide lo basico: nombre, cuantos jugadores son, desde cuando existen, una
 * bio corta y quien responde por el club. Mismo patron que `JugadorForm`.
 */
export function EquipoForm() {
  const [estado, accion] = useActionState(enviarEquipo, ESTADO_INICIAL)

  return (
    <form key={estado.nonce} action={accion} className="grid gap-5">
      <CamposAntispam />

      <CampoTexto
        id="eq-nombre"
        name="equipo_nombre"
        defaultValue={estado.valores.equipo_nombre ?? ''}
        label="Nombre del equipo"
        required
        maxLength={80}
        placeholder="Nombre del equipo"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="eq-cantidad"
          name="cantidad_jugadores"
          defaultValue={estado.valores.cantidad_jugadores ?? ''}
          type="number"
          inputMode="numeric"
          label="Cantidad de jugadores"
          required
          min={JUGADORES_MIN}
          max={JUGADORES_MAX}
          placeholder={`${JUGADORES_MIN}`}
        />
        <CampoTexto
          id="eq-fundacion"
          name="fundacion"
          defaultValue={estado.valores.fundacion ?? ''}
          type="number"
          inputMode="numeric"
          label="Año de fundación"
          required
          min={FUNDACION_MIN}
          max={ANIO_ACTUAL}
          placeholder={`${ANIO_ACTUAL}`}
        />
      </div>

      <CampoArea
        id="eq-bio"
        name="equipo_bio"
        defaultValue={estado.valores.equipo_bio ?? ''}
        label="Bio del equipo"
        required
        rows={4}
        maxLength={BIO_MAX}
        placeholder="Historia corta del equipo, en qué categoría juegan, etc."
        ayuda={`Una descripción corta. Mínimo ${BIO_MIN} caracteres.`}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="eq-responsable"
          name="responsable"
          defaultValue={estado.valores.responsable ?? ''}
          label="Nombre de quien inscribe"
          required
          maxLength={80}
          autoComplete="name"
          placeholder="Nombre y apellido"
        />
        <CampoTexto
          id="eq-correo"
          name="equipo_correo"
          defaultValue={estado.valores.equipo_correo ?? ''}
          type="email"
          label="Correo de contacto"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="equipo@correo.cl"
        />
      </div>

      <Resultado estado={estado} />

      <div>
        <BotonEnviar>Enviar inscripción</BotonEnviar>
      </div>
    </form>
  )
}
