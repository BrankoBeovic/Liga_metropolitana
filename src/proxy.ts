import type { NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

/**
 * Punto de entrada del proxy de Next.
 *
 * Se llama `proxy` y no `middleware` porque Next 16 renombro la convencion:
 * `middleware.ts` sigue funcionando pero avisa como deprecado y deja de andar
 * en Next 17. Migrado con `npx @next/codemod middleware-to-proxy`.
 *
 * Ojo con el nombre: `lib/supabase/middleware.ts` conserva el suyo a
 * proposito. Ese no es una convencion de Next sino un modulo propio, y es como
 * lo llama la documentacion de @supabase/ssr. La convencion del framework vive
 * solo en este archivo.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return updateSession(request)
}

export const config = {
  /**
   * Corre en todas las rutas menos los assets estaticos.
   *
   * No alcanza con hacer match solo de `/admin/*`: el refresco del token de
   * Supabase tiene que ocurrir tambien navegando el sitio publico, o la sesion
   * del editor vence mientras lee una nota y despues el CMS lo rebota.
   *
   * Se excluyen las imagenes porque cada una dispararia una llamada a
   * `auth.getUser()` al pedo.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
}
