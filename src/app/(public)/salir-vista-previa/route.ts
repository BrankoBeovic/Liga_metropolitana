import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Apaga el modo borrador.
 *
 * Vive FUERA de `/admin` a proposito: el proxy protege todo lo que empieza con
 * `/admin`, asi que ahi esta ruta rebotaria al login. Justamente a quien se le
 * vencio la sesion mientras miraba una nota es a quien hay que dejar salir.
 *
 * Quedarse con la cookie puesta no filtra nada -sin sesion no se ve ningun
 * borrador igual, porque la lectura pasa por RLS- pero sirve TODAS las paginas
 * salteando la cache, y deja a esa persona viendo un sitio distinto al del
 * resto sin enterarse.
 *
 * No pide sesion porque no hay nada que proteger: apagar una cookie propia no
 * revela ni cambia datos. Lo peor que puede hacer un desconocido llamandola es
 * apagarse a si mismo un modo que no tiene encendido.
 */
export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  return NextResponse.redirect(
    new URL('/admin/noticias', request.nextUrl.origin)
  )
}
