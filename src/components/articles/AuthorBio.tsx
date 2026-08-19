import Image from 'next/image'

import { Marca } from '@/components/ui/Marca'
import type { PostCompleto } from '@/lib/posts'

type AuthorBioProps = {
  author: NonNullable<PostCompleto['author']>
}

/**
 * Tarjeta de autor al pie de la nota.
 *
 * Sirve al E-E-A-T: Google evalua quien firma, no solo que dice. Mostrar
 * nombre, foto, bio y perfiles publicos es la señal concreta de que detras de
 * la nota hay una persona identificable.
 *
 * Si el perfil no tiene avatar cargado cae en la pelota de la marca, que es la
 * misma pieza que usan los estados vacios y las notas sin portada: el hueco se
 * llena con algo del sitio y no con una silueta gris de plantilla.
 */
export function AuthorBio({ author }: AuthorBioProps) {
  const redes = [
    author.twitter_url ? { url: author.twitter_url, label: 'X' } : null,
    author.instagram_url
      ? { url: author.instagram_url, label: 'Instagram' }
      : null,
  ].filter((r): r is { url: string; label: string } => r !== null)

  return (
    <aside className="bg-editorial mt-14 flex flex-col gap-4 rounded-2xl p-6 ring-1 ring-white/10 sm:flex-row sm:items-start">
      {author.avatar_url ? (
        <Image
          src={author.avatar_url}
          alt=""
          aria-hidden
          width={64}
          height={64}
          sizes="64px"
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Marca className="size-16 shrink-0 rounded-full bg-white/5 p-3" />
      )}

      <div className="min-w-0">
        <p className="font-display text-ink/60 text-xs tracking-[0.2em] uppercase">
          Escrito por
        </p>
        <p className="font-display text-ink mt-1 text-2xl tracking-wide uppercase">
          {author.full_name}
        </p>

        {author.bio ? (
          <p className="text-ink/75 mt-2 text-sm leading-relaxed">
            {author.bio}
          </p>
        ) : null}

        {redes.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {redes.map((red) => (
              <li key={red.url}>
                <a
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-ink/75 hover:text-ink flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs tracking-[0.12em] uppercase ring-1 ring-white/15 transition-colors hover:bg-white/10"
                >
                  {red.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  )
}
