import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { formatearFecha } from '@/lib/format'
import { rutaNoticia } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

import {
  borrarArticulo,
  despublicarArticulo,
  publicarArticulo,
} from './actions'

export const metadata: Metadata = { title: 'Notas' }
export const dynamic = 'force-dynamic'

/**
 * Avisos de resultado.
 *
 * Cada accion vuelve al listado con `?r=` y acá se traduce a algo que se
 * entienda. Antes no habia ninguno: cuando RLS rechazaba el cambio, el boton no
 * hacia nada y no lo decia.
 */
const AVISOS: Record<string, { tono: 'ok' | 'error'; texto: string }> = {
  publicada: { tono: 'ok', texto: 'Nota publicada. Ya está en el sitio.' },
  borrador: {
    tono: 'ok',
    texto: 'Borrador guardado. Todavía no se ve en el sitio.',
  },
  despublicada: {
    tono: 'ok',
    texto: 'Nota despublicada. Salió del sitio y quedó como borrador.',
  },
  borrada: { tono: 'ok', texto: 'Nota borrada.' },
  'sin-permiso': {
    tono: 'error',
    texto:
      'No se pudo: esa nota la escribió otra persona, y solo su autor o un admin pueden tocarla.',
  },
  error: {
    tono: 'error',
    texto: 'No se pudo completar la acción. Intenta de nuevo.',
  },
}

type Props = { searchParams: Promise<{ r?: string }> }

export default async function NoticiasPage({ searchParams }: Props) {
  const [{ r }, sesion] = await Promise.all([searchParams, requerirSesion()])
  const supabase = await createClient()
  const aviso = r ? AVISOS[r] : undefined

  /*
    El filtro por autor va acá y NO alcanza con RLS, aunque el comentario que
    estaba antes decía lo contrario.

    `posts_select` es más amplia que `posts_update`: deja ver lo publicado, sea
    de quien sea (`status = 'published' and published_at <= now()`), MÁS lo
    propio, MÁS todo si es admin. Es lo correcto para el sitio público, que lee
    con la misma política. Pero en el CMS se traducía en que un editor veía en
    su listado las notas de todo el equipo y recién al guardar se enteraba de
    que no podía tocarlas.

    Un admin sigue viendo todo, que es lo que dice la bajada de la pantalla.
  */
  let consulta = supabase
    .from('posts')
    .select(
      'id, title, slug, status, published_at, updated_at, is_anonymous, category:categories(name), author:profiles(full_name)'
    )
    .order('updated_at', { ascending: false })

  if (!sesion.esAdmin) consulta = consulta.eq('author_id', sesion.userId)

  const { data: notas } = await consulta

  return (
    <AdminShell
      sesion={sesion}
      titulo="Notas"
      descripcion={
        sesion.esAdmin
          ? 'Todas las notas del sitio.'
          : 'Las notas que escribiste.'
      }
      acciones={
        <Link
          href="/admin/noticias/nueva"
          className="bg-accent font-display flex h-11 items-center rounded-lg px-4 text-sm font-bold text-white"
        >
          Nueva nota
        </Link>
      }
    >
      {aviso ? (
        <p
          role="status"
          className={
            aviso.tono === 'ok'
              ? 'mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-800'
              : 'mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900'
          }
        >
          {aviso.texto}
        </p>
      ) : null}

      {notas && notas.length > 0 ? (
        <ul className="divide-y divide-black/5 rounded-xl ring-1 ring-black/5">
          {notas.map((nota) => (
            <li key={nota.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/*
                    Ambar para borrador, verde para publicada. En gris se leia
                    como una etiqueta desactivada y no como un estado que pide
                    accion: un borrador es trabajo sin terminar, y el color
                    tiene que decirlo. Ambos tonos pasan AA sobre su fondo.
                  */}
                  <span
                    className={
                      nota.status === 'published'
                        ? 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-green-800 uppercase'
                        : 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase'
                    }
                  >
                    {nota.status === 'published' ? 'Publicada' : 'Borrador'}
                  </span>
                  {nota.category ? (
                    <span className="text-ink/45 text-xs">
                      {nota.category.name}
                    </span>
                  ) : null}
                  {nota.is_anonymous ? (
                    <span className="text-ink/45 text-xs">
                      · Equipo Liga Metropolitana
                    </span>
                  ) : null}
                </div>

                <p className="font-display text-ink mt-1 truncate text-[15px] font-bold">
                  <Link
                    href={`/admin/noticias/${nota.id}`}
                    className="hover:underline"
                  >
                    {nota.title}
                  </Link>
                </p>

                <p className="text-ink/45 mt-0.5 text-xs">
                  {nota.author?.full_name}
                  {nota.published_at
                    ? ` · Publicada el ${formatearFecha(nota.published_at)}`
                    : ` · Editada el ${formatearFecha(nota.updated_at)}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/*
                  El camino de publicar era de ida: se podia despublicar desde
                  la fila, pero para volver a publicar habia que entrar a
                  editar y buscar el boton adentro del formulario.

                  Los borradores ahora tambien se pueden ver, por el modo
                  borrador de Next: `/admin/vista-previa` enciende la cookie de
                  bypass y manda a la nota. Antes ese enlace no estaba porque la
                  pagina publica filtra por publicadas y habria dado 404, asi
                  que la unica forma de revisar como quedaba una nota era
                  publicarla.

                  Va como <a> y no como <Link>: es un route handler que setea
                  una cookie y redirige, no una pagina. Con <Link> Next
                  intentaria prefetch y navegacion de cliente, y el enlace se
                  dispararia sin que nadie lo haya tocado.
                */}
                {nota.status === 'published' ? (
                  <>
                    <Link
                      href={rutaNoticia(nota.slug)}
                      className="text-ink/60 hover:text-ink flex min-h-11 items-center text-xs font-medium"
                    >
                      Ver
                    </Link>
                    <form action={despublicarArticulo}>
                      <input type="hidden" name="id" value={nota.id} />
                      <button
                        type="submit"
                        className="text-ink/60 hover:text-ink flex min-h-11 items-center text-xs font-medium"
                      >
                        Despublicar
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <a
                      href={`/admin/vista-previa?slug=${encodeURIComponent(nota.slug)}`}
                      className="text-ink/60 hover:text-ink flex min-h-11 items-center text-xs font-medium"
                    >
                      Vista previa
                    </a>
                    <form action={publicarArticulo}>
                      <input type="hidden" name="id" value={nota.id} />
                      <button
                        type="submit"
                        className="text-ink/60 hover:text-accent flex min-h-11 items-center text-xs font-bold"
                      >
                        Publicar
                      </button>
                    </form>
                  </>
                )}

                <Link
                  href={`/admin/noticias/${nota.id}`}
                  className="text-accent flex min-h-11 items-center text-xs font-bold"
                >
                  Editar
                </Link>

                {/*
                  Borrar, sin confirmacion nativa, por el mismo criterio que en
                  sponsors: `confirm()` necesita JavaScript y bloquea el hilo.
                  La proteccion real es que "Despublicar" esta en la misma fila,
                  asi que sacar una nota del sitio no obliga a borrarla.

                  Solo icono: al lado de "Editar", que es texto, un segundo
                  texto competiria por la misma mirada. El nombre viaja en
                  `sr-only` para que el boton no sea mudo en un lector de
                  pantalla, y lleva el titulo para saber cual se borra.
                */}
                <form action={borrarArticulo}>
                  <input type="hidden" name="id" value={nota.id} />
                  <button
                    type="submit"
                    className="text-ink/35 hover:text-accent hover:bg-accent/8 focus-visible:ring-accent flex size-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Trash2 aria-hidden className="size-4" />
                    <span className="sr-only">Borrar «{nota.title}»</span>
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no escribiste ninguna nota"
          description="Empieza por la primera con el botón de arriba."
        />
      )}
    </AdminShell>
  )
}
