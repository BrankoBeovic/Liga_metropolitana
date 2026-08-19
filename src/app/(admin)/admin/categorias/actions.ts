'use server'

import { revalidatePath } from 'next/cache'

import { requerirAdmin } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

export type EstadoCategoria = { error: string | null; ok: string | null }

/**
 * Separacion entre ordenes consecutivos.
 *
 * No hace falta que sean 1, 2, 3: los huecos dejan meter algo en el medio a
 * mano desde el SQL Editor sin renumerar todo.
 */
const PASO = 10

/**
 * Invalida lo que depende de las categorias.
 *
 * A diferencia de la fuente, aca no hay paginas /categoria/[slug] que
 * refrescar: las categorias solo se ven como badge en las tarjetas y en la
 * pagina de cada nota.
 */
function refrescarSitio() {
  revalidatePath('/')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/categorias')
}

/**
 * Guarda los campos de texto de una categoria.
 *
 * El slug no se toca: identifica a la categoria en los datos y cambiarlo es
 * una tarea aparte, no una casilla mas en este formulario.
 */
export async function guardarCategoria(
  _estado: EstadoCategoria,
  formData: FormData
): Promise<EstadoCategoria> {
  // Escribir categorias es exclusivo del admin, igual que en las politicas
  // `categories_insert`, `_update` y `_delete`.
  await requerirAdmin()

  const id = Number(formData.get('id'))
  const nombre = String(formData.get('name') ?? '').trim()
  const bajada = String(formData.get('description') ?? '').trim()

  if (!Number.isFinite(id) || id <= 0) {
    return { error: 'Falta la categoría que se quiere guardar.', ok: null }
  }
  if (!nombre) return { error: 'El nombre es obligatorio.', ok: null }

  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({
      name: nombre,
      description: bajada || null,
    })
    .eq('id', id)

  if (error) {
    console.error('No se pudo guardar la categoría:', error.message)
    return {
      error:
        error.code === '23505'
          ? 'Ya existe una categoría con ese nombre.'
          : 'No se pudo guardar. Intenta de nuevo.',
      ok: null,
    }
  }

  refrescarSitio()
  return { error: null, ok: 'Categoría actualizada.' }
}

/**
 * Sube o baja una categoria una posicion.
 *
 * Reescribe la secuencia entera a multiplos de PASO en vez de intercambiar dos
 * numeros. `display_order` no es unico, y con empates un intercambio puede no
 * mover nada: quedarian dos filas con el mismo valor y el desempate lo haria
 * el id, o sea que el boton no haria nada visible. Renumerar deja la lista en
 * un estado siempre coherente.
 *
 * Solo se escriben las filas cuyo numero cambia. En el caso normal son dos.
 */
export async function moverCategoria(formData: FormData): Promise<void> {
  await requerirAdmin()

  const id = Number(formData.get('id'))
  const direccion = formData.get('direccion') === 'arriba' ? -1 : 1

  const supabase = await createClient()
  const { data: categorias, error } = await supabase
    .from('categories')
    .select('id, display_order')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  if (error || !categorias) {
    console.error('No se pudo leer el orden:', error?.message)
    return
  }

  const desde = categorias.findIndex((c) => c.id === id)
  const hasta = desde + direccion
  if (desde === -1 || hasta < 0 || hasta >= categorias.length) return

  const ordenadas = [...categorias]
  const [movida] = ordenadas.splice(desde, 1)
  if (!movida) return
  ordenadas.splice(hasta, 0, movida)

  const cambios = ordenadas
    .map((c, indice) => ({ id: c.id, orden: (indice + 1) * PASO }))
    .filter((c, indice) => ordenadas[indice]?.display_order !== c.orden)

  const resultados = await Promise.all(
    cambios.map((c) =>
      supabase
        .from('categories')
        .update({ display_order: c.orden })
        .eq('id', c.id)
    )
  )

  const fallo = resultados.find((r) => r.error)
  if (fallo?.error) {
    console.error('No se pudo reordenar:', fallo.error.message)
    return
  }

  refrescarSitio()
}
