'use client'

import { useMemo, useState } from 'react'

import { ArticleCard } from '@/components/articles/ArticleCard'
import { cn } from '@/lib/cn'
import type { PostWithRelations } from '@/lib/posts'

/** Valor del filtro cuando no hay ninguna categoría elegida. */
const TODAS = ''

type Categoria = { name: string; slug: string }

type ListaNoticiasProps = {
  noticias: readonly PostWithRelations[]
  categorias: readonly Categoria[]
}

/**
 * El listado de noticias con su filtro por categoría.
 *
 * **El filtro es en memoria y no una consulta, igual que en `/documentos`.**
 * Las noticias ya vienen todas en el HTML, así que filtrar en el cliente es
 * instantáneo y no cuesta una ida a la base por clic. Además, resolverlo por
 * `searchParams` volvería la página dinámica y perdería el ISR, que es lo que
 * hoy la hace barata.
 *
 * La contrapartida es que esto no escala a miles de notas. Con el volumen de
 * una liga -decenas por temporada- sobra; si algún día pasa de unos cientos hay
 * que cambiarlo por una consulta paginada con su propia ruta.
 *
 * **Los chips son `<button>` y no enlaces**, y esa es la consecuencia honesta
 * de lo anterior: un enlace promete una URL propia que se pueda compartir, y
 * acá no la hay. Este sitio tampoco tiene páginas de categoría (CLAUDE.md
 * sección 4), así que no hay a dónde enlazar.
 *
 * Sin JavaScript se ven todas las noticias y los chips no hacen nada: el
 * listado completo está en el HTML, que es lo que importa.
 */
export function ListaNoticias({ noticias, categorias }: ListaNoticiasProps) {
  const [filtro, setFiltro] = useState(TODAS)

  const visibles = useMemo(
    () =>
      filtro === TODAS
        ? noticias
        : noticias.filter((n) => n.category?.slug === filtro),
    [filtro, noticias]
  )

  const opciones = [{ name: 'Todas', slug: TODAS }, ...categorias]

  return (
    <div>
      {/*
        `role="group"` y no `tablist`: un tablist promete navegación con flechas
        y paneles asociados, que no es lo que esto hace. Es un grupo de botones
        que filtran una lista, y `aria-pressed` dice cuál está aplicado.
      */}
      <div
        role="group"
        aria-label="Filtrar noticias por categoría"
        className="flex flex-wrap gap-2"
      >
        {opciones.map((op) => {
          const activo = filtro === op.slug
          return (
            <button
              key={op.slug || 'todas'}
              type="button"
              onClick={() => setFiltro(op.slug)}
              aria-pressed={activo}
              className={cn(
                'font-display focus-visible:ring-accent focus-visible:ring-offset-canvas flex min-h-11 items-center rounded-full px-5 text-sm tracking-[0.1em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                activo
                  ? 'bg-accent text-canvas'
                  : 'bg-editorial text-ink/75 hover:text-ink ring-1 ring-white/10 hover:bg-white/10'
              )}
            >
              {op.name}
            </button>
          )
        })}
      </div>

      {/*
        El recuento va en una región viva: sin esto, quien navega con lector de
        pantalla toca un filtro y no recibe ninguna señal de que la lista cambió
        debajo.
      */}
      <p role="status" aria-live="polite" className="text-ink/60 mt-4 text-sm">
        {visibles.length} {visibles.length === 1 ? 'noticia' : 'noticias'}
        {filtro === TODAS
          ? ''
          : ` en ${opciones.find((o) => o.slug === filtro)?.name}`}
      </p>

      {visibles.length > 0 ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((post, i) => (
            <li key={post.id} className="flex">
              {/*
                El `index` alimenta el stagger del fade up, y se recalcula con
                la lista filtrada a proposito: si viniera del orden original,
                filtrar dejaria huecos de medio segundo entre tarjetas que ahora
                son contiguas.
              */}
              <ArticleCard post={post} index={i} className="w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-ink/15 text-ink/60 mt-8 rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
          Todavía no hay noticias publicadas en esta categoría.
        </p>
      )}
    </div>
  )
}
