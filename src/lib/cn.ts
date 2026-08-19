/**
 * Une clases de Tailwind descartando valores vacios, null, undefined y false.
 *
 * No hace merge de clases en conflicto: para eso haria falta tailwind-merge,
 * que todavia no se necesita. Si en algun momento hay componentes que deban
 * sobreescribir utilidades del mismo grupo desde afuera, cambiar aca.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ')
}
