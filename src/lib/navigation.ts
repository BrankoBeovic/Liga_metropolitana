/**
 * Enlaces fijos del sitio.
 *
 * A diferencia de la fuente, la barra ES una lista fija en el codigo y no se
 * lee de `categories` (decision registrada en CLAUDE.md): los enlaces de la
 * barra son paginas (Historia, Documentos, Jugadores, Contacto), no
 * categorias, y son unos pocos. La maquinaria de nav_label / show_in_navbar de
 * la fuente existia para nueve secciones que no cabian; aca sobra.
 */

export type NavLink = {
  href: string
  label: string
}

/**
 * La barra de navegacion completa, en su orden.
 *
 * "Inicio" esta primero porque la barra flotante NO lleva logo ni nombre del
 * sitio: el video del hero ya hace ese trabajo en la portada. Sin este enlace,
 * desde `/documentos` o `/contacto` no habria ninguna forma de volver al
 * inicio, que es justo lo que el logo resolvia sin que nadie lo notara.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { href: '/', label: 'Inicio' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/historia', label: 'Historia' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/jugadores', label: 'Jugadores' },
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
