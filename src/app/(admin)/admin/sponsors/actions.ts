'use server'

import { revalidatePath } from 'next/cache'

import { requerirSesion } from '@/lib/admin/session'
import { borrarDeStorage, subirImagen } from '@/lib/admin/storage'
import { createClient } from '@/lib/supabase/server'
import { urlValida } from '@/lib/url'

/*
  Solo tipos y funciones async se exportan desde un archivo 'use server'.
  Los tipos desaparecen al compilar, asi que pasan; una constante no, y el
  build falla con "can only export async functions". El estado inicial vive en
  el componente que lo usa.

  Sin espacios de publicidad: la fuente tenia destacarSponsor, lateralSponsor
  y los dos banners con su arte. Aca los sponsors son solo logos en la landing
  (decision en CLAUDE.md), asi que todo eso se fue con sus columnas.
*/
export type EstadoSponsor = { error: string | null; ok: string | null }

function refrescarSitio() {
  revalidatePath('/')
  revalidatePath('/admin/sponsors')
}

export async function guardarSponsor(
  _estado: EstadoSponsor,
  formData: FormData
): Promise<EstadoSponsor> {
  // Cualquier usuario autenticado. RLS lo verifica igual del lado de la base;
  // esto solo asegura que haya sesion antes de tocar Storage.
  await requerirSesion()

  const id = formData.get('id')
  const nombre = String(formData.get('name') ?? '').trim()
  const sitio = String(formData.get('website_url') ?? '').trim()
  const orden = Number(formData.get('display_order') ?? 0)
  const logoActual = String(formData.get('logo_actual') ?? '')
  const archivo = formData.get('logo')

  if (!nombre) return { error: 'El nombre es obligatorio.', ok: null }
  if (!urlValida(sitio)) {
    return {
      error: 'El sitio web debe empezar con http:// o https://',
      ok: null,
    }
  }

  let logoUrl = logoActual
  let logoAReemplazar: string | null = null
  let logoSubido: string | null = null

  if (archivo instanceof File && archivo.size > 0) {
    const subida = await subirImagen('sponsor-logos', archivo)
    // Comparacion contra null y no por veracidad: con `if (subida.error)`
    // TypeScript no estrecha la union, porque una cadena vacia tambien es
    // falsa y no podria descartar la rama de error.
    if (subida.error !== null) return { error: subida.error, ok: null }
    logoUrl = subida.url
    logoSubido = subida.url
    if (logoActual && logoActual !== subida.url) logoAReemplazar = logoActual
  }

  if (!logoUrl) return { error: 'Falta el logo.', ok: null }

  const supabase = await createClient()
  /*
    `is_active` no viaja en este formulario, y por eso tampoco se escribe aca.

    La visibilidad se cambia con el boton "Ocultar/Mostrar" de la fila, que esta
    siempre a la vista. Si el formulario igual mandara el campo, editar el
    nombre de un sponsor oculto lo volveria visible sin que nadie lo pidiera.
    Al crear, la base lo deja en true por defecto.
  */
  const fila = {
    name: nombre,
    website_url: sitio,
    logo_url: logoUrl,
    display_order: Number.isFinite(orden) ? orden : 0,
  }

  const { error } = id
    ? await supabase.from('sponsors').update(fila).eq('id', Number(id))
    : await supabase.from('sponsors').insert(fila)

  if (error) {
    console.error('No se pudo guardar el sponsor:', error.message)
    // Lo que se subio en esta pasada no quedo referenciado por ninguna fila.
    await borrarDeStorage(logoSubido)
    return {
      error: 'No se pudo guardar. Revisa los datos e intenta de nuevo.',
      ok: null,
    }
  }

  // Recien con la fila guardada se suelta el archivo que quedo sin uso.
  await borrarDeStorage(logoAReemplazar)

  refrescarSitio()
  return { error: null, ok: id ? 'Sponsor actualizado.' : 'Sponsor creado.' }
}

export async function alternarSponsor(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))
  const activar = formData.get('activar') === '1'

  const supabase = await createClient()
  const { error } = await supabase
    .from('sponsors')
    .update({ is_active: activar })
    .eq('id', id)

  if (error) console.error('No se pudo cambiar el estado:', error.message)
  refrescarSitio()
}

export async function borrarSponsor(formData: FormData): Promise<void> {
  await requerirSesion()
  const id = Number(formData.get('id'))

  const supabase = await createClient()

  /*
    El logo se lee ANTES del delete, porque despues la fila ya no esta y no
    habria de donde sacar la URL.

    Se borra tambien el archivo: cada subida genera un nombre nuevo con
    `crypto.randomUUID()`, asi que dos sponsors nunca comparten archivo y no
    hay riesgo de borrarle la imagen a otro registro.
  */
  const { data: antes } = await supabase
    .from('sponsors')
    .select('logo_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('sponsors').delete().eq('id', id)

  if (error) {
    console.error('No se pudo borrar el sponsor:', error.message)
  } else if (antes) {
    await borrarDeStorage(antes.logo_url)
  }

  refrescarSitio()
}
