import Link from 'next/link'

import { formatearFechaCorta, formatearLectura } from '@/lib/format'
import type { PostWithRelations } from '@/lib/posts'
import { rutaNoticia } from '@/lib/site'

import { ArticleCover } from './ArticleCover'

type MiniArticleCardProps = {
  post: PostWithRelations
}

/**
 * Tarjeta chica de la barra lateral: miniatura a la izquierda, texto a la
 * derecha.
 *
 * El badge de categoria va en version suave (fondo de acento al 15%) y no en
 * dorado pleno como en la portada grande: en la barra lateral hay varios
 * seguidos y a pleno color compiten con el titular principal, que es el que
 * tiene que ganar la mirada.
 */
export function MiniArticleCard({ post }: MiniArticleCardProps) {
  const fecha = formatearFechaCorta(post.published_at)
  const lectura = formatearLectura(post.reading_time_minutes)

  return (
    <article className="group bg-editorial relative flex items-center gap-4 rounded-2xl p-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06]">
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl bg-white/5">
        <ArticleCover
          src={post.cover_image_url}
          alt={post.cover_image_alt}
          title={post.title}
          sizes="128px"
          className="h-full w-full"
        />
      </div>

      <div className="min-w-0">
        {post.category ? (
          <span className="font-display bg-accent/15 text-accent inline-block rounded-full px-2.5 py-1 text-[10px] tracking-[0.16em] uppercase">
            {post.category.name}
          </span>
        ) : null}

        <h3 className="font-display text-ink mt-2 text-[17px] leading-tight tracking-wide uppercase">
          <Link
            href={rutaNoticia(post.slug)}
            className="before:absolute before:inset-0"
          >
            {post.title}
          </Link>
        </h3>

        <p className="text-ink/60 mt-1.5 text-xs">
          {fecha}
          {lectura ? <> · {lectura}</> : null}
        </p>
      </div>
    </article>
  )
}
