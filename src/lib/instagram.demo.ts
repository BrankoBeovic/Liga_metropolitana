import 'server-only'

import type { ReelInstagram } from './instagram'

/**
 * Reels de mentira, para poder mirar el carrusel sin token de Instagram.
 *
 * Existe por un problema concreto: los Reels son lo único de la portada que no
 * sale de la base, así que no se pueden cargar de prueba como una noticia o un
 * sponsor. Sin token, este modulo arma el carrusel con recortes del video de
 * marca para poder mostrarlo (local y deploy) hasta que llegue la API.
 *
 * Entra cuando falta `INSTAGRAM_ACCESS_TOKEN`, también en el deploy.
 * Con token, `getReelsInstagram` habla con Instagram y este módulo no se usa.
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
