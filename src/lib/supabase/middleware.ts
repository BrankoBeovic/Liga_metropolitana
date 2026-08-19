import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

const ADMIN_PREFIX = '/admin'
const LOGIN_PATH = '/admin/login'
const DASHBOARD_PATH = '/admin/dashboard'

/**
 * Cabecera anti indexacion para todo `/admin/*`.
 *
 * Va como header y no como metadata de Next porque tiene que viajar tambien en
 * las redirecciones, que nunca llegan a renderizar una pagina.
 */
function denyIndexing(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

/**
 * Refresca la sesion de Supabase y protege el CMS.
 *
 * El refresco tiene que pasar por el middleware: los Server Components no
 * pueden escribir cookies, asi que si el token vencido no se renueva aca, el
 * usuario queda deslogueado a mitad de navegacion.
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  // Se reasigna dentro de setAll: cada vez que Supabase rota las cookies hay
  // que reconstruir la respuesta para que se las lleve.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser() y no getSession(): getSession lee la cookie sin validarla contra
  // el servidor de Auth, asi que una cookie manipulada la daria por buena.
  // Para una decision de autorizacion hace falta el token verificado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminRoute =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)

  if (!isAdminRoute) {
    return response
  }

  // El login es la unica ruta de admin abierta. Sin esta excepcion, redirigir
  // al login desde el login seria un bucle infinito.
  if (pathname === LOGIN_PATH) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = DASHBOARD_PATH
      url.search = ''
      return denyIndexing(NextResponse.redirect(url))
    }
    return denyIndexing(response)
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    // Para volver a donde el usuario queria ir despues de loguearse.
    url.searchParams.set('redirectTo', pathname)
    return denyIndexing(NextResponse.redirect(url))
  }

  return denyIndexing(response)
}
