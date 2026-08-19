/**
 * Enlaces fijos del sitio.
 *
 * A diferencia de la fuente, la barra ES una lista fija en el codigo y no se
 * lee de `categories` (decision registrada en CLAUDE.md): los enlaces de la
 * barra son paginas (Historia, Documentos, Inscribete, Contacto), no
 * categorias, y son cuatro. La maquinaria de nav_label / show_in_navbar de la
 * fuente existia para nueve secciones que no cabian; aca sobra.
 */

export type NavLink = {
  href: string
  label: string
}

/** La barra de navegacion completa, en su orden. */
export const NAV_LINKS: readonly NavLink[] = [
  { href: '/historia', label: 'Historia' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/inscribete', label: 'Inscríbete' },
  { href: '/contacto', label: 'Contacto' },
]

/**
 * Cuenta oficial de Instagram.
 *
 * Es la fuente del carrusel de Reels de la landing, via la API de Graph
 * (`lib/instagram.ts`). Sin token la seccion queda vacia sin romper nada.
 */
export const INSTAGRAM_URL = 'https://www.instagram.com/ligametromaxibasquet/'

export const INSTAGRAM_HANDLE = '@ligametromaxibasquet'

/**
 * Firma para las notas marcadas como anonimas.
 *
 * El autor real se sigue guardando en `posts.author_id`: de el dependen las
 * politicas RLS y la trazabilidad interna. Esto solo cambia lo que ve el
 * lector.
 */
export const FIRMA_EQUIPO = 'Equipo Liga Metropolitana'

export const SITE_NAME = 'Liga Metropolitana'

export const SITE_TAGLINE = 'El maxibásquetbol chileno desde 1989.'
