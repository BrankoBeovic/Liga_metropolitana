import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { MotionCard } from '@/components/ui/MotionCard'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { cn } from '@/lib/cn'
import { formatearFechaCorta, formatearLectura } from '@/lib/format'
import { firmaDe } from '@/lib/firma'
import type { PostWithRelations } from '@/lib/posts'
import { rutaNoticia } from '@/lib/site'

import { ArticleCover } from './ArticleCover'

type ArticleCardProps = {
  post: PostWithRelations
  /** Posicion en la grilla. Alimenta el stagger del fade up. */
  index?: number
  className?: string
}

/**
 * Tarjeta del feed.
 *
 * El enlace envuelve toda la tarjeta (con `before:absolute before:inset-0`) y
 * no solo el titulo, para que el area clickeable sea la tarjeta entera. El
 * badge de categoria queda fuera del enlace, y su texto ya viaja en el nombre
 * accesible del enlace, asi que no se pierde nada.
 */
export function ArticleCard({ post, index = 0, className }: ArticleCardProps) {
  const fecha = formatearFechaCorta(post.published_at)
  const lectura = formatearLectura(post.reading_time_minutes)

  return (
    <MotionCard index={index} className={cn('h-full', className)}>
      <SpotlightCard className="h-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        <article className="bg-editorial flex h-full flex-col">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
            <ArticleCover
              src={post.cover_image_url}
              alt={post.cover_image_alt}
              title={post.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full"
            />
          </div>

          <div className="flex flex-1 flex-col p-5">
            {post.category ? (
              <Badge variant="accent" className="self-start">
                {post.category.name}
              </Badge>
            ) : null}

            <h3 className="font-display text-ink mt-3 text-xl leading-tight tracking-wide text-balance uppercase">
              <Link
                href={rutaNoticia(post.slug)}
                className="before:absolute before:inset-0"
              >
                {post.title}
              </Link>
            </h3>

            {post.excerpt ? (
              <p className="text-ink/70 mt-2 line-clamp-3 text-sm leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}

            <p className="text-ink/60 mt-auto pt-4 text-xs">
              {firmaDe(post)}
              {fecha ? <> · {fecha}</> : null}
              {lectura ? <> · {lectura}</> : null}
            </p>
          </div>
        </article>
      </SpotlightCard>
    </MotionCard>
  )
}
