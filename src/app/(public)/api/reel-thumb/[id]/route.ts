import { NextResponse, type NextRequest } from 'next/server'

import { REVALIDAR_SEGUNDOS } from '@/lib/instagram'

/**
 * Miniatura de un Reel, servida desde una URL propia y estable.
 *
 * Existe para separar dos cosas que Instagram mezcla en una sola URL: la
 * identidad de la foto (el `id` del Reel, que no cambia nunca) y la firma con
 * la que se autoriza a bajarla (que caduca y que `me/media` devuelve distinta
 * en cada consulta). `next/image` cachea por URL: si le diera la firma
 * directo, Vercel facturaria una transformacion nueva cada vez que
 * `getReelsInstagram` vuelve a preguntarle a Instagram, aunque la foto de
 * atras sea siempre la misma. Ver `rutaReelThumb` en `lib/instagram.ts`.
 *
 * Esta ruta resuelve la firma vigente en el momento en que alguien pide la
 * miniatura, no en el momento en que se genero la pagina, y le pasa los bytes
 * a `next/image` con un `Cache-Control` largo. Como la URL de esta ruta no
 * cambia nunca para un mismo Reel, esa vez es la unica: despues, la sirve la
 * cache de `next/image` (31 dias, `minimumCacheTTL` en `next.config.mjs`).
 */

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Mismo numero que `CACHE_IMAGENES_SEGUNDOS` en `next.config.mjs`: la
 * miniatura de un Reel no cambia despues de publicado, asi que ambas caches
 * pueden ser igual de largas. Si se cambia una, cambiar la otra.
 */
const CACHE_SEGUNDOS = 2678400

/** IDs de media de Instagram: solo digitos, y a veces con un guion bajo. */
const ID_VALIDO = /^[0-9_]{1,40}$/

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ID_VALIDO.test(id)) {
    return NextResponse.json({ error: 'Id invalido' }, { status: 400 })
  }

  if (!TOKEN) {
    return NextResponse.json({ error: 'No configurado' }, { status: 404 })
  }

  let urlFirmada: string
  try {
    const resolucion = await fetch(
      `https://graph.instagram.com/v23.0/${id}?fields=thumbnail_url&access_token=${TOKEN}`,
      { next: { revalidate: REVALIDAR_SEGUNDOS } }
    )

    if (!resolucion.ok) {
      console.error(
        `No se pudo resolver la miniatura del Reel ${id}: Instagram respondio ${resolucion.status}.`
      )
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const payload = (await resolucion.json()) as { thumbnail_url?: string }
    if (!payload.thumbnail_url) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    urlFirmada = payload.thumbnail_url
  } catch (error) {
    console.error(`No se pudo resolver la miniatura del Reel ${id}:`, error)
    return NextResponse.json({ error: 'No encontrado' }, { status: 502 })
  }

  try {
    const imagen = await fetch(urlFirmada)
    if (!imagen.ok || !imagen.body) {
      console.error(
        `No se pudo bajar la miniatura del Reel ${id}: CDN de Instagram respondio ${imagen.status}.`
      )
      return NextResponse.json({ error: 'No encontrado' }, { status: 502 })
    }

    return new NextResponse(imagen.body, {
      headers: {
        'Content-Type': imagen.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': `public, max-age=${CACHE_SEGUNDOS}, immutable`,
      },
    })
  } catch (error) {
    console.error(`No se pudo bajar la miniatura del Reel ${id}:`, error)
    return NextResponse.json({ error: 'No encontrado' }, { status: 502 })
  }
}
