import 'server-only'

import type { ReelInstagram } from './instagram'

/**
 * Reels de mentira, para poder mirar el carrusel sin token de Instagram.
 *
 * Existe por un problema concreto: los Reels son lo único de la portada que no
 * sale de la base, así que no se pueden cargar de prueba como una noticia o un
 * sponsor. Sin token, la sección no se dibuja y no hay forma de ver cómo queda
 * el carrusel mientras se trabaja en él.
 *
 * **Nunca se enciende solo.** Hace falta `REELS_DEMO=1`, y aun así
 * `getReelsInstagram` no lo mira si el build es de producción: son dos
 * condiciones y la segunda no se puede desactivar por configuración. Un
 * carrusel de contenido inventado en el sitio publicado sería bastante peor que
 * no tener carrusel.
 *
 * Las miniaturas son recortes 9:16 del video de marca, generados en
 * `public/demo/`. Van en git para que el deploy las sirva: sin ellas las
 * tarjetas salen con el hueco de la imagen rota.
 */
const TITULOS = [
  'Resumen de la fecha en dos minutos',
  'La jugada del partido',
  'Así se vivió la final desde la banca',
  'Entrenamiento de pretemporada',
  'El triple sobre la chicharra',
  'Palabras del capitán tras el partido',
] as const

export function reelsDeMuestra(limite: number): ReelInstagram[] {
  return Array.from({ length: Math.min(limite, TITULOS.length) }, (_, i) => ({
    id: `demo-${i + 1}`,
    title: TITULOS[i] ?? 'Reel de la Liga Metropolitana',
    // Lleva al perfil real: si alguien hace clic mientras prueba, que al menos
    // termine en un lugar que existe.
    permalink: 'https://www.instagram.com/ligametromaxibasquet/',
    thumbnailUrl: `/demo/reel-${i + 1}.jpg`,
    publishedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }))
}
