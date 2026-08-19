import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Invalidacion del ISR bajo demanda.
 *
 * La llama el CMS al publicar o editar, para que el cambio se vea sin esperar
 * los 5 minutos de revalidacion ni un redeploy.
 *
 * Protegida por `REVALIDATION_SECRET` en el header `Authorization`, no en la
 * query string: las query strings quedan escritas en los logs de acceso, en el
 * historial del navegador y en el header `Referer` de la peticion siguiente.
 */

/** Comparacion en tiempo constante, para no filtrar el secreto por timing. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let distinto = 0
  for (let i = 0; i < a.length; i++) {
    distinto |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return distinto === 0
}

export async function POST(request: NextRequest) {
  const secreto = process.env.REVALIDATION_SECRET

  // Sin secreto configurado la ruta se apaga entera. La alternativa seria
  // dejarla abierta, que convierte un despiste de configuracion en un
  // endpoint publico para tirar el cache del sitio.
  if (!secreto) {
    console.error('REVALIDATION_SECRET no esta configurado.')
    return NextResponse.json({ error: 'No configurado' }, { status: 503 })
  }

  const enviado =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!iguales(enviado, secreto)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let rutas: string[]
  try {
    const body: unknown = await request.json()
    const crudas =
      typeof body === 'object' && body !== null && 'paths' in body
        ? (body as { paths: unknown }).paths
        : null

    rutas = Array.isArray(crudas)
      ? crudas.filter(
          (r): r is string => typeof r === 'string' && r.startsWith('/')
        )
      : []
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  if (rutas.length === 0) {
    return NextResponse.json({ error: 'Faltan rutas' }, { status: 400 })
  }

  for (const ruta of rutas) {
    revalidatePath(ruta)
  }

  return NextResponse.json({ revalidadas: rutas, at: new Date().toISOString() })
}
