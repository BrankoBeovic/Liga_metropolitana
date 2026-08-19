import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

/**
 * Cliente para leer contenido publico desde el servidor.
 *
 * Por que existe, teniendo ya `server.ts`: aquel usa `cookies()`, y en Next
 * tocar las cookies saca a la ruta del render estatico. Si el Header leyera
 * las categorias con el cliente de sesion, TODO el sitio publico pasaria a
 * renderizarse dinamico y se perderia el ISR que pide CLAUDE.md.
 *
 * Este cliente no lee cookies, con lo cual consulta siempre como `anon`. Eso
 * alcanza para el contenido publico, que es justamente lo que las politicas
 * RLS dejan ver a `anon`: posts publicados, categorias, sponsors y reels
 * activos. Nada que dependa del usuario logueado debe pasar por aca.
 *
 * Es una unica instancia a nivel de modulo, sin sesion que persistir ni token
 * que refrescar, asi que no hay estado compartido entre peticiones.
 */
export const supabasePublic = createSupabaseClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)
