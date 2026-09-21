/**
 * Enlaces fijos del sitio.
 *
 * A diferencia de la fuente, la barra ES una lista fija en el codigo y no se
 * lee de `categories` (decision registrada en CLAUDE.md): los enlaces de la
 * barra son paginas (Historia, Documentos, Inscripciones, Convenios,
 * Contacto), no categorias. La maquinaria de nav_label / show_in_navbar de
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
  { href: '/inscripciones', label: 'Inscripciones' },
  { href: '/convenios', label: 'Convenios' },
  { href: '/contacto', label: 'Contacto' },
]

/**
 * Partners de la Liga, para el footer.
 *
 * Lista fija en el codigo, igual que `NAV_LINKS`: son sitios externos, no
 * contenido del CMS, y no hay ninguna tabla que los deba administrar el
 * equipo. Federaciones y organizaciones del maxibasquetbol/basquetbol, mas
 * un medio y un partner tecnologico.
 */
export const PARTNER_LINKS: readonly NavLink[] = [
  { href: 'https://fechimax.cl', label: 'FECHIMAX' },
  { href: 'https://febachile.cl', label: 'FEBACHILE' },
  { href: 'https://nbn23.com', label: 'NBN23' },
  { href: 'https://hablemosdebasquet.cl', label: 'Hablemos de Básquet' },
  { href: 'https://fimba.net', label: 'FIMBA' },
  { href: 'https://fiba.basketball', label: 'FIBA' },
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
 * Canal oficial de YouTube.
 *
 * Enlace del footer y fuente del `channel_id` que alimenta el carrusel de
 * videos de la portada (`lib/youtube.ts`).
 */
export const YOUTUBE_URL = 'https://www.youtube.com/@ligametrotv'

/**
 * El `channel_id` no sale del handle de arriba: `@ligametrotv` no sirve para
 * armar el feed RSS de `lib/youtube.ts` (que pide `channel_id=UC...`), asi
 * que se resolvio una vez a mano contra el `<link rel="canonical">` de la
 * pagina del canal. Si el canal vuelve a cambiar de handle, este ID no se ve
 * afectado; si cambia de canal (otra cuenta), hay que resolverlo de nuevo.
 */
export const YOUTUBE_CHANNEL_ID = 'UCchLJWZ-XWqfw9hnukQ_8_Q'

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
