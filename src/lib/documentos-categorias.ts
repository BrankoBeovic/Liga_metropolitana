/**
 * Las cuatro categorias fijas de un documento.
 *
 * Vive en su propio modulo neutro, sin importar nada, y no en `lib/documentos.ts`
 * a proposito: ese archivo importa `supabasePublic`, que trae `server-only`. Si
 * `CATEGORIAS_DOCUMENTO` viviera ahi, cualquier componente cliente que la
 * necesitara (el filtro de `/documentos`, el selector del CMS) arrastraria todo
 * el modulo al bundle del navegador y el build fallaria contra el guard de
 * `server-only`, aunque esa funcion nunca se llamara desde el cliente.
 *
 * Igual que `POSICIONES` en `lib/jugadores.ts`: el selector del CMS, la
 * validacion de la Server Action y el CHECK de `documents.category` se
 * corrigen juntos si la Liga quiere otra lista.
 *
 * `Tribunal` cubre resoluciones de disciplina y arbitraje: un PDF categorizado
 * asi en vez de un tipo de contenido nuevo para el apartado de Tribunal que se
 * discutio para el sitio.
 */
export const CATEGORIAS_DOCUMENTO = [
  'Reglamentos',
  'Actas',
  'Formularios',
  'Tribunal',
] as const

export type CategoriaDocumento = (typeof CATEGORIAS_DOCUMENTO)[number]

export function categoriaDocumentoValida(
  valor: string
): valor is CategoriaDocumento {
  return (CATEGORIAS_DOCUMENTO as readonly string[]).includes(valor)
}
