import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database.types'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

/**
 * Cliente de Supabase para componentes con `'use client'`.
 *
 * Se llama dentro del componente y no a nivel de modulo: `createBrowserClient`
 * memoiza la instancia internamente, asi que no crea una conexion nueva por
 * render, y de esta forma no se ejecuta nada durante el prerender en servidor.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
}
