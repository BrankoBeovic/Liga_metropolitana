import { FileText, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { DocumentForm } from '@/components/admin/DocumentForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { formatearFecha, formatearPeso } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

import { alternarDocumento, borrarDocumento } from './actions'

export const metadata: Metadata = { title: 'Documentos' }
export const dynamic = 'force-dynamic'

/**
 * Gestion de los PDF descargables de `/documentos`.
 *
 * Mismo reparto de permisos que sponsors: los administra todo el equipo, no
 * solo un admin. Borrar un documento es reversible -se vuelve a subir el PDF-
 * a diferencia de borrar la nota publicada de otra persona.
 */
export default async function DocumentosPage() {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: documentos } = await supabase
    .from('documents')
    .select(
      'id, title, description, file_url, file_size_bytes, is_active, created_at'
    )
    .order('created_at', { ascending: false })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Documentos"
      descripcion="Los PDF descargables del sitio: bases, reglamentos y formularios."
    >
      <section className="rounded-xl p-6 ring-1 ring-black/5">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Subir documento
        </h2>
        <DocumentForm />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Documentos cargados
        </h2>

        {documentos && documentos.length > 0 ? (
          <ul className="space-y-4">
            {documentos.map((doc) => (
              <li key={doc.id} className="rounded-xl p-5 ring-1 ring-black/5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText
                      aria-hidden
                      className="text-accent mt-0.5 size-5 shrink-0"
                    />
                    <div className="min-w-0">
                      {/*
                        `padding` y no `flex min-h-11 items-center` para el alto
                        tactil: en un contenedor flex el texto pasa a ser un
                        item anonimo y `text-overflow: ellipsis` deja de
                        aplicarse, asi que el titulo quedaria cortado al ras.
                      */}
                      <p className="font-display text-ink truncate text-sm font-bold">
                        {doc.title}
                      </p>
                      {doc.description ? (
                        <p className="text-ink/60 mt-0.5 line-clamp-2 text-xs">
                          {doc.description}
                        </p>
                      ) : null}
                      <p className="text-ink/45 mt-1 text-xs">
                        {formatearFecha(doc.created_at)}
                        {formatearPeso(doc.file_size_bytes)
                          ? ` · ${formatearPeso(doc.file_size_bytes)}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={
                        doc.is_active
                          ? 'rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800'
                          : 'text-ink/50 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold'
                      }
                    >
                      {doc.is_active ? 'Visible' : 'Oculto'}
                    </span>

                    {/*
                      `<a>` y no `<Link>`: apunta a un archivo en Storage, no a
                      una ruta de la aplicacion. Con `<Link>` Next intentaria
                      prefetch de una URL que no es suya.
                    */}
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink/60 hover:text-ink flex min-h-11 items-center px-2 text-xs font-medium"
                    >
                      Ver PDF
                      <span className="sr-only">
                        {' '}
                        (se abre en otra pestaña)
                      </span>
                    </a>

                    <form action={alternarDocumento}>
                      <input type="hidden" name="id" value={doc.id} />
                      <input
                        type="hidden"
                        name="activar"
                        value={doc.is_active ? '0' : '1'}
                      />
                      <button
                        type="submit"
                        className="text-ink/60 hover:text-ink flex min-h-11 items-center px-2 text-xs font-medium"
                      >
                        {doc.is_active ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </form>

                    <form action={borrarDocumento}>
                      <input type="hidden" name="id" value={doc.id} />
                      <button
                        type="submit"
                        aria-label={`Borrar ${doc.title}`}
                        className="text-ink/45 flex size-11 items-center justify-center rounded-lg hover:bg-black/5 hover:text-red-600"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/*
                  La edicion va desplegable y no en una pantalla aparte: son
                  tres campos, y abrir una ruta nueva para cambiar un titulo es
                  mas navegacion que trabajo.
                */}
                <details className="group">
                  <summary className="text-ink/60 hover:text-ink flex min-h-11 cursor-pointer items-center text-xs font-medium">
                    Editar
                  </summary>
                  <div className="mt-4 border-t border-black/5 pt-4">
                    <DocumentForm documento={doc} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no hay documentos"
            description="Sube el primero con el formulario de arriba."
          />
        )}
      </section>
    </AdminShell>
  )
}
