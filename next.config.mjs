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
 * Miniaturas de Reels de Instagram.
 *
 * Dos hostnames con comodin porque la CDN de Meta rota entre muchisimos
 * subdominios (`scontent-eze1-1.cdninstagram.com`, `instagram.fscl2-1.fna...`)
 * y no hay forma de enumerarlos. Es mas amplio de lo que uno quisiera, pero la
 * alternativa es que la miniatura falle sin motivo aparente segun de que
 * servidor le haya tocado salir.
 *
 * Hotlinkear no deja al lector expuesto al vencimiento de las firmas: con
 * `next/image` en el medio el lector nunca le pega a Meta, el servidor baja la
 * imagen y la sirve cacheada desde /_next/image.
 */
const INSTAGRAM_IMAGE_PATTERNS = /** @type {const} */ ([
  { protocol: 'https', hostname: '**.cdninstagram.com', pathname: '/**' },
  { protocol: 'https', hostname: '**.fbcdn.net', pathname: '/**' },
])

/**
 * Cuanto conserva Next las copias optimizadas: 31 dias.
 *
 * Es la defensa concreta contra el vencimiento de las firmas de Instagram. Una
 * vez que una miniatura se bajo bien, se sigue sirviendo desde nuestra cache
 * aunque la URL original ya no exista, y el lector nunca ve el hueco.
 *
 * La contra que advierte la documentacion es que no hay forma de invalidar esa
 * cache. Acá no molesta: la miniatura de un Reel no cambia despues de
 * publicado, y si cambiara, la URL firmada cambia con ella y pasa a ser otra
 * entrada de cache.
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: MAX_CUERPO_ACCION },
  },
  images: {
    // Portadas y miniaturas 9:16 servidas en WebP/AVIF.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: CACHE_IMAGENES_SEGUNDOS,
    remotePatterns: [...supabaseImagePatterns(), ...INSTAGRAM_IMAGE_PATTERNS],
  },
  async redirects() {
    return [
      {
        source: '/inscribete',
        destination: '/jugadores',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
