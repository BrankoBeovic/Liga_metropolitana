import 'server-only'

import type { Database } from '@/types/database.types'

import { supabasePublic } from './supabase/public'

/**
 * Un miembro tal como lo dibuja el sitio publico.
 *
 * No incluye `show_in_team` a proposito: esa casilla decide si la persona entra
 * en esta lista, pero no es un dato de la tarjeta. El CMS la lee aparte.
 */
export type MiembroEquipo = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'bio' | 'avatar_url' | 'twitter_url' | 'instagram_url'
>

/**
 * El equipo que se muestra en /nosotros.
 *
 * Sale de `profiles`, que es la misma tabla que firma las notas: quien escribe
 * en el sitio es quien aparece en la pagina de staff, sin una segunda lista
 * que mantener sincronizada a mano.
 *
 * La consecuencia a tener presente: `profiles` solo se puebla con el trigger
 * `handle_new_user`, asi que alguien del equipo que no tenga usuario del CMS no
 * aparece. El dia que haya que mostrar a alguien que no redacta, eso es una
 * tabla aparte y una decision de producto, no un parche aca.
 *
 * `role` no se muestra ni decide nada: "admin" y "editor" son permisos del CMS,
 * no cargos editoriales, y publicarlos seria contar como funciona la
 * herramienta en vez de quien hace el medio.
 *
 * **Quien aparece lo dice `show_in_team`, y lo elige cada persona** desde
 * /admin/perfil. Antes se deducia del rol, dejando afuera a los admin, y eso
 * tenia una contra que ya no existe: un admin que escribiera notas las firmaba
 * en el sitio y aun asi no salia aca, sin que nada lo explicara.
 *
 * Es el mismo criterio que `show_in_home` en categorias y `is_featured` en
 * sponsors: quien participa se elige con una columna propia, no se deduce de
 * otro campo.
 */
export async function getEquipo(): Promise<MiembroEquipo[]> {
  const { data, error } = await supabasePublic
    .from('profiles')
    .select('id, full_name, bio, avatar_url, twitter_url, instagram_url')
    .eq('show_in_team', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('No se pudo leer el equipo:', error.message)
    return []
  }

  return data ?? []
}
