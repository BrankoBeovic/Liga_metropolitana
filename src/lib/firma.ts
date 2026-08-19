import { FIRMA_EQUIPO } from './navigation'

/**
 * Como se firma una nota de cara al lector.
 *
 * Un solo lugar decide esto, para que la portada, las tarjetas, la pagina de la
 * nota y el JSON-LD no puedan discrepar. Que el listado diga "Equipo Liga
 * Metropolitana" y el articulo muestre el nombre real seria una filtracion, no
 * una inconsistencia de diseño.
 *
 * **Vive en un modulo neutro y no en `lib/posts.ts`**, que es donde estaba
 * hasta que aparecio `/noticias`. Aquel empieza con `import 'server-only'`
 * -tiene el cliente de Supabase adentro- asi que cualquier componente cliente
 * que necesitara la firma no compilaba. Esto es una funcion pura sobre datos
 * que ya vienen resueltos: no tiene por que arrastrar el servidor con ella.
 */
export function firmaDe(post: {
  is_anonymous: boolean
  author: { full_name: string } | null
}): string {
  if (post.is_anonymous) return FIRMA_EQUIPO
  return post.author?.full_name ?? FIRMA_EQUIPO
}
