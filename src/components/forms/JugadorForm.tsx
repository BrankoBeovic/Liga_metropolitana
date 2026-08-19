'use client'

import { useActionState } from 'react'

import { enviarJugador } from '@/app/(public)/jugadores/actions'
import { ESTADO_INICIAL } from '@/lib/formularios'
import {
  BIO_MAX,
  BIO_MIN,
  EDAD_MAX,
  EDAD_MIN,
  POSICIONES,
} from '@/lib/jugadores'

import { BotonEnviar, CampoArea, CampoSelect, CampoTexto } from './Campos'
import { CamposAntispam } from './CamposAntispam'
import { Resultado } from './Resultado'

/**
 * Formulario de un jugador que busca equipo.
 *
 * Pide lo minimo para poder ubicarlo y contarle a un club como juega. El
 * correo y el telefono no estaban en el pedido original: sin un dato de
 * contacto la ficha no sirve, porque la Liga no tiene otro canal para
 * devolverle la llamada.
 */
export function JugadorForm() {
  const [estado, accion] = useActionState(enviarJugador, ESTADO_INICIAL)

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
          id="jug-nombre"
          name="nombre"
          defaultValue={estado.valores.nombre ?? ''}
          label="Nombre"
          required
          maxLength={80}
          autoComplete="given-name"
          placeholder="Nombre"
        />
        {/*
          `apellido` y no `apellido_materno`: ese es el campo trampa del
          antispam. Si se mezclan, un envio real se descarta como bot.
        */}
        <CampoTexto
          id="jug-apellido"
          name="apellido"
          defaultValue={estado.valores.apellido ?? ''}
          label="Apellido"
          required
          maxLength={80}
          autoComplete="family-name"
          placeholder="Apellido"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="jug-edad"
          name="edad"
          defaultValue={estado.valores.edad ?? ''}
          type="number"
          inputMode="numeric"
          label="Edad"
          required
          min={EDAD_MIN}
          max={EDAD_MAX}
          placeholder={`${EDAD_MIN}`}
        />
        <CampoTexto
          id="jug-rut"
          name="rut"
          defaultValue={estado.valores.rut ?? ''}
          label="RUT"
          required
          maxLength={16}
          autoComplete="off"
          placeholder="12.345.678-9"
          inputMode="text"
        />
      </div>

      <CampoSelect
        id="jug-posicion"
        name="posicion"
        label="Posición"
        required
        defaultValue={estado.valores.posicion ?? ''}
        opciones={POSICIONES}
      />

      <CampoArea
        id="jug-bio"
        name="bio"
        defaultValue={estado.valores.bio ?? ''}
        label="Bio"
        required
        rows={5}
        maxLength={BIO_MAX}
        placeholder="Cómo juegas, qué experiencia tienes, en qué categorías anduviste."
        ayuda={`Una descripción corta. Mínimo ${BIO_MIN} caracteres.`}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="jug-correo"
          name="correo"
          defaultValue={estado.valores.correo ?? ''}
          type="email"
          label="Correo"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="tu@correo.cl"
        />
        <CampoTexto
          id="jug-telefono"
          name="telefono"
          defaultValue={estado.valores.telefono ?? ''}
          type="tel"
          label="Teléfono"
          maxLength={30}
          autoComplete="tel"
          placeholder="+56 9 ..."
          ayuda="Opcional, pero acelera la respuesta."
        />
      </div>

      <Resultado estado={estado} />

      <div>
        <BotonEnviar>Enviar inscripción</BotonEnviar>
      </div>
    </form>
  )
}
