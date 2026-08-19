/**
 * `server-only` es un paquete marcador: no exporta nada y no trae tipos.
 * Su unico efecto es romper el build si un componente cliente lo importa,
 * porque la condicion de exports `react-server` lo resuelve a un modulo vacio.
 *
 * TypeScript 6 rechaza los imports de efecto secundario de modulos sin
 * declaraciones (TS2882), asi que hay que declararlo a mano.
 */
declare module 'server-only'
