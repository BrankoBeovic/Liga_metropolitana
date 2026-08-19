import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database.types'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Usa la clave publicable, no la secreta: las consultas siguen pasando por RLS
 * con la identidad del usuario de la cookie. Eso es lo que se quiere para
 * render de paginas. La clave secreta se reserva para operaciones
 * administrativas puntuales, no para leer contenido.
 *
 * El import de `server-only` hace que el build falle si alguien importa este
 * modulo desde un componente cliente, en vez de fallar en runtime.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Un Server Component no puede escribir cookies. No es un error:
          // el middleware ya refresco la sesion en esta misma peticion, asi
          // que perder la escritura aca no deja al usuario sin sesion.
        }
      },
    },
  })
}
