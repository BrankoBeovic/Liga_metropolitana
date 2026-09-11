import 'server-only'

import type { Database } from '@/types/database.types'

import { supabasePublic } from './supabase/public'

export type Benefit = Pick<
  Database['public']['Tables']['benefits']['Row'],
  'id' | 'name' | 'description' | 'link_url' | 'logo_url'
>

/**
 * Los convenios y beneficios activos, en su orden.
 *
 * Mismo patron que `getSponsors` en `lib/posts.ts`: lee con `supabasePublic`,
 * sin cookies, para que `/convenios` siga saliendo del render estatico
 * (CLAUDE.md seccion 6).
 *
 * Ante un error devuelve lista vacia en vez de tirar la pagina.
 */
export async function getBenefits(): Promise<Benefit[]> {
  const { data, error } = await supabasePublic
    .from('benefits')
    .select('id, name, description, link_url, logo_url')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error('No se pudieron leer los convenios:', error.message)
    return []
  }
  return data ?? []
}
