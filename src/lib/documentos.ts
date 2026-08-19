import 'server-only'

import type { Database } from '@/types/database.types'

import { supabasePublic } from './supabase/public'

export type Documento = Pick<
  Database['public']['Tables']['documents']['Row'],
  'id' | 'title' | 'description' | 'file_url' | 'file_size_bytes' | 'created_at'
>

const COLUMNAS = 'id, title, description, file_url, file_size_bytes, created_at'

/**
 * Los documentos publicados, del mas reciente al mas viejo.
 *
 * Lee con `supabasePublic`, sin cookies, para que `/documentos` siga saliendo
 * del render estatico (CLAUDE.md seccion 6).
 *
 * Filtra por `is_active` aunque la politica RLS ya lo haga, por el mismo motivo
 * que `soloPublicados` en `lib/posts.ts`: es lo que le permite al planificador
 * usar el indice parcial `documents_active_idx`. RLS es la garantia; esto es el
 * indice.
 *
 * Ante un error devuelve lista vacia en vez de tirar la pagina. Que Supabase
 * este caido no deberia dejar el sitio entero en pantalla de error.
 */
export async function getDocumentos(): Promise<Documento[]> {
  const { data, error } = await supabasePublic
    .from('documents')
    .select(COLUMNAS)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('No se pudieron leer los documentos:', error.message)
    return []
  }
  return data ?? []
}
