import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatearFecha } from '@/lib/format'
import { firmaDe } from '@/lib/firma'
import type { PostWithRelations } from '@/lib/posts'
import { rutaNoticia } from '@/lib/site'

import { ArticleCover } from './ArticleCover'
import { MiniArticleCard } from './MiniArticleCard'

type FeaturedLayoutProps = {
  /** La primera es la portada grande; las siguientes van a la barra lateral. */
  posts: readonly PostWithRelations[]
}

/**
 * Portada destacada con barra lateral.
 *
 * Mitad y mitad en escritorio: la card grande a 2fr se comia la seccion y
 * dejaba las laterales como un recorte. Con tres notas a la derecha, las dos
 * columnas terminan a la misma altura (`items-stretch`) y la foto de la
 * principal rellena lo que sobre, sin un `h-[32.5rem]` fijo que la inflaba.
 *
 * Una sola columna abajo de `lg`. Sin espacio de sponsor en la barra: aca los
 * sponsors son solo logos en la landing (CLAUDE.md seccion 4).
 *
 * El scrim inferior sobre la portada no es decorado: el badge y, en pantallas
 * chicas, el borde del titular se apoyan ahi. Sin el, una foto clara deja el
 * texto ilegible.
 */
export function FeaturedLayout({ posts }: FeaturedLayoutProps) {
  const [principal, ...secundarias] = posts
  if (!principal) return null

  return (
    <div
      className={
        secundarias.length > 0
          ? 'grid items-stretch gap-6 lg:grid-cols-2'
          : 'grid gap-6'
      }
    >
      <article className="group bg-editorial relative flex h-full flex-col overflow-hidden rounded-2xl ring-1 ring-white/10">
        {/*
          Sin carga anticipada, y esto cambio respecto de la fuente.

          Alla esta portada era lo primero de la pagina y por lo tanto el LCP.
          Aca arriba hay un Hero de 70svh: medido a 1280x900, la portada nace
          en y=825, o sea debajo del pliegue en cualquier pantalla razonable.
          Pedirla temprano solo le robaria ancho de banda al video del Hero,
          que si es el elemento que mide el LCP.

          Abajo de `lg` la altura es fija para que no haya salto cuando llega
          la imagen. En escritorio `flex-1` la iguala a las tres laterales.
        */}
        <div className="relative h-64 w-full overflow-hidden bg-white/5 sm:h-80 lg:h-auto lg:min-h-[16rem] lg:flex-1">
          <ArticleCover
            src={principal.cover_image_url}
            alt={principal.cover_image_alt}
            title={principal.title}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div
            aria-hidden
            className="from-canvas/85 absolute inset-0 bg-gradient-to-t to-transparent to-45%"
          />
          <div className="absolute bottom-4 left-4">
            {principal.category ? (
              <Badge variant="accent">{principal.category.name}</Badge>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 p-5 sm:p-6">
          <h3 className="font-display text-ink text-2xl leading-[1.05] tracking-wide text-balance uppercase sm:text-[32px]">
            <Link
              href={rutaNoticia(principal.slug)}
              className="before:absolute before:inset-0"
            >
              {principal.title}
            </Link>
          </h3>
          <p className="text-ink/60 mt-2.5 text-[13px]">
            {formatearFecha(principal.published_at)}
            {' · '}
            {firmaDe(principal)}
          </p>
        </div>
      </article>

      <aside className="grid gap-4">
        {secundarias.map((post) => (
          <MiniArticleCard key={post.id} post={post} />
        ))}
      </aside>
    </div>
  )
}
