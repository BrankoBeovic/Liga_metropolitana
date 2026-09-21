// @ts-check

/**
 * El hostname de Supabase Storage se deriva de NEXT_PUBLIC_SUPABASE_URL en
 * vez de hardcodearse, para que dev / preview / produccion no necesiten
 * configuraciones distintas.
 */
function supabaseImagePatterns() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return []

  let hostname
  try {
    hostname = new URL(url).hostname
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL no es una URL valida: ${url}. Ver .env.example.`
    )
  }

  return [
    /** @type {const} */ ({
      protocol: 'https',
      hostname,
      pathname: '/storage/v1/object/public/**',
    }),
  ]
}

/**
 * Miniaturas del carrusel de YouTube (`lib/youtube.ts`).
 *
 * A diferencia de Instagram, `i.ytimg.com/vi/{id}/hqdefault.jpg` es una URL
 * estable por video: no rota una firma, asi que no hace falta el mismo proxy
 * propio que usan los Reels (`/api/reel-thumb/[id]`) para que `next/image`
 * acierte contra su cache. No depende de ninguna variable de entorno, asi que
 * va separado de `supabaseImagePatterns`.
 */
const YOUTUBE_IMAGE_PATTERN = /** @type {const} */ ({
  protocol: 'https',
  hostname: 'i.ytimg.com',
  pathname: '/vi/**',
})

/**
 * Cuanto conserva Next las copias optimizadas: 31 dias.
 *
 * Una vez que una miniatura de Reel se bajo bien, se sigue sirviendo desde
 * nuestra cache sin volver a pedirla. Esto solo funciona porque las
 * miniaturas de Reels ya no llegan a `next/image` con la URL firmada de
 * Instagram (que caduca y cambia en cada consulta a la API) sino con la ruta
 * propia y estable de `/api/reel-thumb/[id]` (ver `rutaReelThumb` en
 * `lib/instagram.ts`): `minimumCacheTTL` cachea por URL, y sin esa ruta de por
 * medio la URL jamas se repetia, asi que nunca habia acierto de cache y cada
 * revalidacion facturaba transformaciones nuevas para las mismas fotos.
 *
 * La contra que advierte la documentacion es que no hay forma de invalidar esa
 * cache. Acá no molesta: la miniatura de un Reel no cambia despues de
 * publicado, y si cambiara, sale un Reel nuevo con otro id y otra entrada de
 * cache.
 */
const CACHE_IMAGENES_SEGUNDOS = 2678400

/**
 * Tope del cuerpo de una Server Action.
 *
 * Next lo deja en 1 MB por defecto, y ese numero no tenia nada que ver con lo
 * que el CMS promete: `subirImagen` acepta hasta 5 MB por archivo, asi que
 * cualquier imagen mediana moria con un 500 y "Body exceeded 1 MB limit" antes
 * de que corriera una sola linea de nuestro codigo. Al usuario le llegaba el
 * peor error posible: guardar no hacia absolutamente nada, sin mensaje.
 *
 * Si algun dia se suben videos o PDFs mas grandes que esto, no escala y hay
 * que pasar a subir contra Storage desde el navegador con una URL firmada,
 * sin que el archivo cruce por la Server Action.
 */
const MAX_CUERPO_ACCION = '16mb'

/**
 * Anchos fijos que de verdad se piden en el sitio (para imagenes con `sizes`
 * en pixeles, sin fraccion de viewport): avatar de autor (64), tarjeta chica
 * de nota (128), logos de sponsor/convenio y subida del CMS (160), miniatura
 * de Reel en tablet (192, colapsado a 224), PageHeader y footer (300, 220
 * colapsado a 224).
 *
 * Colapsar anchos parecidos en un mismo bucket (192 y 220 dentro de 224) es a
 * proposito: el "desperdicio" de servir una imagen un poco mas grande de la
 * necesaria es marginal, y cada bucket que se saca es una combinacion
 * (URL, ancho, formato) menos que Vercel puede llegar a facturar como
 * transformacion nueva.
 *
 * Reemplaza el default de Next (16, 32, 48, 64, 96, 128, 256, 384), que trae
 * anchos que este sitio nunca pide.
 */
const IMAGE_SIZES = [64, 128, 160, 224, 300]

/**
 * Anchos de viewport, para imagenes con `sizes` en `vw` o fijas y grandes:
 * columna de lectura (608, `ANCHO_LECTURA` en `ArticleContent`), quiebres de
 * `40rem`/`28rem` de Historia y la portada (640, 448), portada de nota (896),
 * y dos anchos de escritorio para las fracciones de viewport de las grillas
 * de notas (1280, 1920).
 *
 * Reemplaza el default de Next (640, 750, 828, 1080, 1200, 1920, 2048, 3840),
 * que trae anchos de escritorio grande (2048, 3840) que ninguna imagen de
 * este sitio necesita.
 */
const DEVICE_SIZES = [448, 608, 640, 896, 1280, 1920]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: MAX_CUERPO_ACCION },
  },
  images: {
    /**
     * Solo WebP, sin AVIF.
     *
     * Cada formato extra duplica las transformaciones facturables por
     * imagen (misma URL y ancho, un archivo distinto por formato). Para
     * fotos comunes AVIF gana poco sobre WebP, y no vale duplicar el cupo de
     * Vercel para esa ganancia marginal.
     */
    formats: ['image/webp'],
    minimumCacheTTL: CACHE_IMAGENES_SEGUNDOS,
    deviceSizes: DEVICE_SIZES,
    imageSizes: IMAGE_SIZES,
    remotePatterns: [...supabaseImagePatterns(), YOUTUBE_IMAGE_PATTERN],
  },
  async redirects() {
    return [
      {
        source: '/inscribete',
        destination: '/inscripciones',
        permanent: true,
      },
      {
        source: '/jugadores',
        destination: '/inscripciones',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
