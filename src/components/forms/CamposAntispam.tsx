'use client'

import { CAMPO_TIEMPO, CAMPO_TRAMPA } from '@/lib/antispam'

/**
 * Los dos campos ocultos que llevan todos los formularios publicos.
 *
 * Es cliente por una sola razon: el momento en que se dibujo el formulario
 * tiene que ser el del navegador, no el del servidor. `/contacto` e
 * `/jugadores` son paginas estaticas, asi que un `Date.now()` en el servidor
 * seria la hora del build y la trampa de tiempo no dispararia nunca.
 */
export function CamposAntispam() {
  return (
    <>
      {/*
        El campo trampa.

        Se esconde con CSS y no con `type="hidden"`: un input oculto por tipo no
        lo completa ningun bot, porque es evidente que no es para el usuario. Lo
        que cae en la trampa es un campo que parece normal en el HTML.

        Las cuatro cosas juntas hacen falta y ninguna sobra: `hidden` de Tailwind
        lo saca de la pantalla, `aria-hidden` lo saca del lector de pantalla,
        `tabIndex={-1}` lo saca del tabulador, y `autoComplete="off"` evita que
        el gestor de contraseñas del navegador lo rellene solo y convierta a una
        persona real en un falso positivo.
      */}
      <div className="hidden" aria-hidden>
        <label htmlFor={CAMPO_TRAMPA}>Apellido materno</label>
        <input
          id={CAMPO_TRAMPA}
          name={CAMPO_TRAMPA}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/*
        La hora se escribe desde el callback de `ref`, no desde un efecto con
        `setState`.

        Dos motivos, y los dos ya estan documentados en CLAUDE.md para el editor
        del CMS. El primero: un input oculto que se escribe por codigo no puede
        recibir `value` ni `defaultValue` de React, porque en un `type="hidden"`
        no existe el estado "sucio" y cada re-render pisaria lo que escribio el
        codigo. El segundo: llamar a `setState` dentro de un efecto dispara un
        render en cascada y la regla del React Compiler lo marca como error.

        El callback corre al montar, que es exactamente el momento que se quiere
        medir: cuando la persona tiene el formulario delante.
      */}
      <input
        type="hidden"
        name={CAMPO_TIEMPO}
        ref={(el) => {
          if (el) el.value = String(Date.now())
        }}
      />
    </>
  )
}
