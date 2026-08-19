/**
 * URL canonica del sitio, sin barra final.
 *
 * La necesitan el sitemap, los canonical, el `metadataBase` del layout y todo
 * el JSON-LD, que exige URLs absolutas.
 *
 * **El dominio de la Liga todavia no esta conectado.** Hasta que lo este, el
 * respaldo es el dominio que se espera usar, y no `localhost`: una URL de
 * localhost publicada en un sitemap o en una etiqueta canonica es peor que una
 * URL equivocada, porque le pide a Google que indexe una direccion que no
 * existe para nadie.
 *
 * Al conectar el dominio real hay que definir `NEXT_PUBLIC_SITE_URL` en el
 * entorno de produccion. Es una variable `NEXT_PUBLIC_`, asi que se congela en
 * el build: cambiarla exige volver a desplegar, no alcanza con editarla.
 */
/**
 * `||` y no `??`: la variable existe pero esta vacia.
 *
 * `.env.example` la trae declarada sin valor -el dominio todavia no se
 * conecta- asi que `.env.local` define `NEXT_PUBLIC_SITE_URL=`, que llega como
 * cadena vacia y no como `undefined`. Con `??` el respaldo no se aplicaba,
 * `new URL('')` tiraba `ERR_INVALID_URL` y el build moria al recolectar la
 * portada, con un error que no nombra la variable por ningun lado.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://ligametropolitana.cl'
).replace(/\/$/, '')

export function urlAbsoluta(ruta: string): string {
  return `${SITE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

/**
 * Ruta publica de una nota.
 *
 * Vive aca y no escrita a mano en cada lugar porque la usan el sitio, el
 * sitemap, el CMS (enlace "Ver") y la vista previa de borradores. Cuando el
 * segmento se decidio -`/noticia/` y no `/articulo/` como en la fuente, porque
 * este CMS habla de noticias- hubo que cambiarlo en seis archivos; la proxima
 * vez es uno.
 */
export function rutaNoticia(slug: string): string {
  return `/noticia/${slug}`
}
