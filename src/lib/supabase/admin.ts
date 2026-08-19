import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

import { SUPABASE_URL } from './config'

/**
 * Cliente con la clave secreta: bypassea RLS.
 *
 * Solo para operaciones que un visitante no puede hacer por politica, como
 * insertar una ficha de jugador desde el formulario publico. El listado del
 * CMS usa `server.ts` y pasa por RLS con la sesion.
 *
 * Nunca importar desde un componente cliente. El `server-only` hace que el
 * build falle si alguien lo intenta.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) return null

  return createSupabaseClient<Database>(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
