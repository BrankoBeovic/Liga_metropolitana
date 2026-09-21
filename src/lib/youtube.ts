import 'server-only'

import { YOUTUBE_CHANNEL_ID } from './navigation'

export type VideoYoutube = {
  id: string
  title: string
  url: string
  /** Los Shorts son verticales y se marcan distinto en la tarjeta. */
  esShort: boolean
  publishedAt: string
  thumbnailUrl: string
  views: number | null
}

/**
 * Feed publico del canal.
 *
 * Es el RSS de YouTube, no la Data API: no necesita clave, no tiene cuota y no
 * hay que renovar ningun token, a diferencia del de Instagram (CLAUDE.md
 * seccion 1). A cambio devuelve solo los ultimos 15 videos, que para una
 * hilera de portada es exactamente lo que se quiere mostrar.
 */
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`

/** Una hora. El canal no publica tan seguido como para justificar menos. */
const REVALIDAR_SEGUNDOS = 3600

/**
 * Cuantas veces se pide el feed antes de darlo por perdido, y cuanto se espera
 * entre intentos.
 *
 * El servicio de RSS de YouTube contesta a medias: fallos intermitentes con
 * 404 y 500 que se resuelven solos segundos despues, sin bloqueo dirigido al
 * sitio. Sin reintentos, una regeneracion de portada de cada dos se quedaria
 * sin la seccion, y ese problema intermitente se veria como uno permanente.
 */
const INTENTOS = 4
const ESPERA_BASE_MS = 400

/** Tope por intento, para que un feed colgado no frene el render entero. */
const TIEMPO_LIMITE_MS = 5000

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * El XML del feed, o null si no se pudo traer.
 *
 * Cada intento lleva su propio `signal`: `fetch` se memoiza por render cuando
 * la URL y las opciones son identicas, asi que sin esto los reintentos no
 * saldrian a la red y repetirian el mismo fallo del primero al instante.
 */
async function pedirFeed(): Promise<string | null> {
  for (let intento = 1; intento <= INTENTOS; intento += 1) {
    try {
      const respuesta = await fetch(FEED, {
        next: { revalidate: REVALIDAR_SEGUNDOS },
        signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      })

      if (respuesta.ok) return await respuesta.text()

      console.error(
        `El feed de YouTube respondio ${respuesta.status} (intento ${intento} de ${INTENTOS})`
      )
    } catch (error) {
      console.error(
        `No se pudo leer el feed de YouTube (intento ${intento} de ${INTENTOS}):`,
        error
      )
    }

    if (intento < INTENTOS) await esperar(ESPERA_BASE_MS * intento)
  }

  return null
}

/**
 * Miniatura del video, armada a mano en vez de tomada del feed.
 *
 * El feed devuelve el host rotativo `i1..i4.ytimg.com`; `i.ytimg.com` es el
 * canonico y sirve la misma imagen, y es el unico que hace falta declarar en
 * `remotePatterns`.
 *
 * `hqdefault` mide 480x360 y trae el video 16:9 centrado con barras negras
 * arriba y abajo, que `object-cover` recorta sobre un marco 16:9.
 */
function miniatura(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/**
 * Entidades XML de los titulos.
 *
 * El feed las escapa y sin esto se leerian cosas como "Chile &amp; Argentina".
 * `&amp;` va al final: si se resolviera primero, un `&amp;lt;` literal
 * terminaria convertido en `<`.
 */
function decodificar(texto: string): string {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) =>
      String.fromCodePoint(Number.parseInt(n, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(Number.parseInt(n, 16))
    )
    .replace(/&amp;/g, '&')
}

function extraer(entrada: string, patron: RegExp): string | null {
  return patron.exec(entrada)?.[1] ?? null
}

/**
 * Los ultimos videos del canal.
 *
 * Se parsea con expresiones regulares y no con un parser de XML porque el feed
 * de YouTube es Atom plano y estable, y sumar una dependencia de parseo para
 * seis campos no se justifica. Una entrada a la que le falte el id o el
 * titulo se descarta en vez de entrar a medias.
 *
 * Ante cualquier error devuelve una lista vacia: que YouTube este caido no
 * deberia tirar abajo la portada.
 */
export async function getVideosYoutube(): Promise<VideoYoutube[]> {
  const xml = await pedirFeed()

  if (xml === null) return []

  const entradas = xml.split('<entry>').slice(1)

  return entradas.flatMap((entrada): VideoYoutube[] => {
    const id = extraer(entrada, /<yt:videoId>([^<]+)<\/yt:videoId>/)
    const title = extraer(entrada, /<title>([^<]*)<\/title>/)
    const href = extraer(entrada, /<link[^>]+href="([^"]+)"/)
    const publishedAt = extraer(entrada, /<published>([^<]+)<\/published>/)
    const views = extraer(entrada, /views="(\d+)"/)

    if (!id || !title || !publishedAt) return []

    return [
      {
        id,
        title: decodificar(title),
        // El enlace del feed distingue `/shorts/` de `/watch?v=`, que es la
        // unica pista del formato: no hay campo que lo diga.
        url: href ?? `https://www.youtube.com/watch?v=${id}`,
        esShort: (href ?? '').includes('/shorts/'),
        publishedAt,
        thumbnailUrl: miniatura(id),
        views: views ? Number.parseInt(views, 10) : null,
      },
    ]
  })
}
