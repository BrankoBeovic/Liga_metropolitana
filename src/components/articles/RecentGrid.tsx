import Link from 'next/link'

import { MotionCard } from '@/components/ui/MotionCard'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import type { PostWithRelations } from '@/lib/posts'
import { rutaNoticia } from '@/lib/site'

import { ArticleCover } from './ArticleCover'

type RecentGridProps = {
  posts: readonly PostWithRelations[]
}

/**
 * Bloque de portadas para barrido rapido: cinco columnas, portada y titular.
 *
 * Sin bajada ni metadatos a proposito. En cinco columnas el ancho de cada
 * tarjeta no da para tres lineas de bajada mas autor y fecha sin que quede
 * todo apretado; el titular solo se escanea mucho mas rapido, que es para lo
 * que sirve este bloque.
 */
export function RecentGrid({ posts }: RecentGridProps) {
  if (posts.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {posts.map((post, index) => (
        <li key={post.id} className="flex">
          <MotionCard index={index} className="w-full">
            <SpotlightCard className="h-full overflow-hidden rounded-2xl ring-1 ring-white/10">
              <article className="bg-editorial flex h-full flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                  <ArticleCover
                    src={post.cover_image_url}
                    alt={post.cover_image_alt}
                    title={post.title}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="h-full w-full"
                  />
                </div>

                <h3 className="font-display text-ink px-3.5 py-3.5 text-[17px] leading-tight tracking-wide uppercase">
                  <Link
                    href={rutaNoticia(post.slug)}
                    className="before:absolute before:inset-0"
                  >
                    {post.title}
                  </Link>
                </h3>
              </article>
            </SpotlightCard>
          </MotionCard>
        </li>
      ))}
    </ul>
  )
}
