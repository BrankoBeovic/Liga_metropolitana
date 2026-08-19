import 'server-only'

import { supabasePublic } from './supabase/public'

/*
  Sin nav_label, show_in_navbar ni show_in_home: la barra de este sitio es una
  lista fija en el codigo (lib/navigation.ts) y no hay bloque de secciones en
  la portada. Las categorias solo clasifican noticias.
*/
export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
}

/**
 * Las categorias, en su orden.
 *
 * Si la consulta falla devuelve una lista vacia en vez de tirar la pagina: que
 * Supabase este caido no deberia dejar el sitio entero en pantalla de error.
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabasePublic
    .from('categories')
    .select('id, name, slug, description')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error('No se pudieron leer las categorias:', error.message)
    return []
  }

  return data ?? []
}
