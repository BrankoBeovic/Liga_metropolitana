'use client'

import { Download, FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { urlDeDescarga } from '@/lib/archivos'
import type { Documento } from '@/lib/documentos'
import { formatearFecha, formatearPeso } from '@/lib/format'

type ListaDocumentosProps = {
  documentos: readonly Documento[]
}

/**
 * Quita tildes y pasa a minusculas, para que el buscador no exija escribir
 * "inscripción" con tilde para encontrar "Inscripción".
 *
 * `NFD` separa la letra de su tilde y el rango de Unicode borra las marcas
 * diacriticas sueltas. Es la forma corta de normalizar sin una tabla a mano.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Los documentos con su buscador.
 *
 * **El filtrado es en memoria y a proposito.** Son las bases, los reglamentos y
 * los formularios de una liga: decenas de filas, no miles. Mandar cada tecla a
 * la base agregaria una ida y vuelta por letra para recorrer una lista que ya
 * esta entera en la pagina, y ademas sacaria a `/documentos` del render
 * estatico. Si algun dia esto pasa de unos cientos, se cambia por una consulta
 * con `ilike` y paginado.
 *
 * Es el unico pedazo de cliente de la pagina: la lista se arma en el servidor y
 * baja como HTML, asi que sin JavaScript se ve completa igual. Lo unico que se
 * pierde es el filtro.
 */
export function ListaDocumentos({ documentos }: ListaDocumentosProps) {
  const [consulta, setConsulta] = useState('')

  const filtrados = useMemo(() => {
    const q = normalizar(consulta.trim())
    if (!q) return documentos
    return documentos.filter((d) =>
      normalizar(`${d.title} ${d.description ?? ''}`).includes(q)
    )
  }, [consulta, documentos])

  return (
    <div>
      <div className="relative max-w-md">
        <Search
          aria-hidden
          className="text-ink/50 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
        />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar por título o descripción"
          aria-label="Buscar documentos"
          className="bg-editorial text-ink placeholder:text-ink/50 focus-visible:ring-accent h-12 w-full rounded-full pr-4 pl-11 text-[15px] ring-1 ring-white/10 outline-none focus-visible:ring-2"
        />
      </div>

      {/*
        El recuento va en una region viva: sin esto, quien navega con lector de
        pantalla escribe en el buscador y no recibe ninguna señal de que la
        lista cambio debajo.
      */}
      <p role="status" aria-live="polite" className="text-ink/60 mt-3 text-sm">
        {consulta.trim()
          ? `${filtrados.length} de ${documentos.length} ${documentos.length === 1 ? 'documento' : 'documentos'}`
          : `${documentos.length} ${documentos.length === 1 ? 'documento' : 'documentos'}`}
      </p>

      {filtrados.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtrados.map((doc) => {
            const peso = formatearPeso(doc.file_size_bytes)
            return (
              <li key={doc.id}>
                <article className="bg-editorial flex h-full flex-col rounded-2xl p-5 ring-1 ring-white/10">
                  <div className="flex items-start gap-3">
                    <FileText
                      aria-hidden
                      className="text-accent mt-0.5 size-5 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-ink text-xl leading-tight tracking-wide uppercase">
                        {doc.title}
                      </h3>
                      <p className="text-ink/60 mt-1 text-xs">
                        {formatearFecha(doc.created_at)}
                        {peso ? ` · PDF · ${peso}` : ' · PDF'}
                      </p>
                    </div>
                  </div>

                  {doc.description ? (
                    <p className="text-ink/70 mt-3 text-sm leading-relaxed">
                      {doc.description}
                    </p>
                  ) : null}

                  {/*
                    `mt-auto` para que el boton quede al pie aunque las tarjetas
                    de la fila tengan bajadas de distinto largo.
                  */}
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <a
                      href={urlDeDescarga(doc.file_url)}
                      className="font-display bg-accent text-canvas hover:bg-accent-light focus-visible:ring-accent focus-visible:ring-offset-editorial flex min-h-11 items-center gap-2 rounded-full px-4 text-xs tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <Download aria-hidden className="size-4" />
                      Descargar
                      <span className="sr-only">
                        {' '}
                        {doc.title}
                        {peso ? `, PDF de ${peso}` : ', en PDF'}
                      </span>
                    </a>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-ink/75 hover:text-ink focus-visible:ring-accent focus-visible:ring-offset-editorial flex min-h-11 items-center rounded-full px-4 text-xs tracking-[0.12em] uppercase ring-1 ring-white/15 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Ver
                      <span className="sr-only">
                        {' '}
                        {doc.title} (se abre en otra pestaña)
                      </span>
                    </a>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="border-ink/15 text-ink/60 mt-6 rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
          No hay ningún documento que coincida con “{consulta.trim()}”.
        </p>
      )}
    </div>
  )
}
