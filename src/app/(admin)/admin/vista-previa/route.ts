import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { rutaNoticia } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

/**
 * Enciende el modo borrador y manda a ver la nota.
 *
 * El listado del CMS no tenia "Ver" en los borradores porque
 * `/noticia/[slug]` filtra por publicadas y ese enlace daba 404. La unica
 * forma de revisar como queda una nota antes de publicarla era publicarla.
 *
 * Vive bajo `/admin/` a proposito, no en `(admin)/api/`. El grupo entre
 * parentesis no aparece en la URL, asi que aquello quedaria en `/api/...` y el
 * proxy solo protege lo que empieza con `/admin`. Estando aca, la ruta hereda
 * el rebote al login y el header `X-Robots-Tag`.
 *
 * Igual se verifica la sesion de nuevo: el proxy es una capa, no la unica, y
 * una ruta que enciende el bypass de cache no puede depender de que el matcher
 * de arriba siga incluyendola manana.
 *
 * Lo que NO hace falta acá es decidir si esta persona puede ver esta nota. Eso
 * lo resuelve `posts_select` cuando la pagina lee con el cliente de sesion: a
 * un editor le devuelve las publicadas y las suyas, y nada mas. Encender el
 * modo borrador no agrega permisos, solo saltea la cache.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return new NextResponse('Falta el slug.', { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Hay que iniciar sesión.', { status: 401 })
  }

  /*
    Se comprueba que la nota exista y sea visible para esta persona ANTES de
    encender nada. Sin esto, un slug inventado dejaba la cookie de bypass
    puesta y mandaba a un 404, con el modo borrador activo sin que se notara.

    La consulta pasa por RLS, asi que un editor pidiendo el borrador de otro
    recibe null y sale por el mismo 404 que si no existiera. No se le dice cual
    de las dos cosas es.
  */
  const { data: nota } = await supabase
    .from('posts')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!nota) {
    return new NextResponse('Esa nota no existe o no es tuya.', { status: 404 })
  }

  const draft = await draftMode()
  draft.enable()

  // `nota.slug` y no el parametro crudo: lo que se redirige es un valor que ya
  // volvio de la base, no una cadena que llego por la query string.
  return NextResponse.redirect(
    new URL(rutaNoticia(encodeURIComponent(nota.slug)), request.nextUrl.origin)
  )
}
