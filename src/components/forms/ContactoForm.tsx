'use client'

import { useActionState } from 'react'

import { enviarContacto } from '@/app/(public)/contacto/actions'
import { ESTADO_INICIAL } from '@/lib/formularios'

import { BotonEnviar, CampoArea, CampoTexto } from './Campos'
import { CamposAntispam } from './CamposAntispam'
import { Resultado } from './Resultado'

/**
 * Formulario de contacto.
 *
 * `<form action={accion}>` con `useActionState`, igual que el CMS: es la unica
 * forma en que el formulario sigue funcionando sin JavaScript. Con JS
 * desactivado el navegador hace el POST normal y Next corre la accion; lo unico
 * que se pierde es el estado "Enviando..." y el campo de tiempo del antispam,
 * que por eso no se exige (ver `lib/antispam.ts`).
 *
 * Enviado con exito, los campos se vacian: dejarlos llenos invita a mandar el
 * mismo mensaje otra vez creyendo que no salio.
 */
export function ContactoForm() {
  const [estado, accion] = useActionState(enviarContacto, ESTADO_INICIAL)

  return (
    /*
      La `key` cambia en CADA respuesta, no solo en las exitosas.

      React resetea solo el formulario cuando termina la accion, asi que un
      error de validacion vaciaba todo lo escrito. Remontar con los
      `defaultValue` que devuelve la accion repone lo que la persona escribio;
      con exito los valores vuelven vacios y el formulario queda limpio. El
      porque completo esta en `lib/formularios.ts`.
    */
    <form key={estado.nonce} action={accion} className="grid gap-5">
      <CamposAntispam />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="contacto-nombre"
          name="nombre"
          defaultValue={estado.valores.nombre ?? ''}
          label="Nombre"
          required
          maxLength={100}
          autoComplete="name"
          placeholder="Tu nombre"
        />
        <CampoTexto
          id="contacto-correo"
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
        id="contacto-asunto"
        name="asunto"
        defaultValue={estado.valores.asunto ?? ''}
        label="Asunto"
        maxLength={150}
        placeholder="¿De qué se trata?"
      />

      <CampoArea
        id="contacto-mensaje"
        name="mensaje"
        defaultValue={estado.valores.mensaje ?? ''}
        label="Mensaje"
        required
        rows={6}
        maxLength={3000}
        placeholder="Cuéntanos en qué podemos ayudarte."
      />

      <Resultado estado={estado} />

      <div>
        <BotonEnviar>Enviar mensaje</BotonEnviar>
      </div>
    </form>
  )
}
