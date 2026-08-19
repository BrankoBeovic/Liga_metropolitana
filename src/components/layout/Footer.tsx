import { LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { InstagramIcon } from '@/components/ui/BrandIcons'
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  NAV_LINKS,
  SITE_NAME,
  SITE_TAGLINE,
} from '@/lib/navigation'

/**
 * Footer editorial.
 *
 * Va sobre `--color-editorial`, un escalon mas claro que el canvas: es lo que
 * lo separa del cuerpo de la pagina ahora que el sitio entero es oscuro. En la
 * fuente el contraste lo daba el salto de blanco a oscuro; aca lo da ese
 * escalon mas el borde superior.
 *
 * El escudo grande al costado no es decorado suelto: es donde la marca se
 * muestra completa y legible, que es lo que el header no puede hacer a 48px.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-editorial relative mt-24 overflow-hidden border-t border-white/10">
      <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/*
              Ancho fijo por `sizes` en pixeles y no en `vw`: la imagen tiene
              ancho maximo propio (`max-w-[260px]`), asi que un `sizes` en
              unidades de viewport haria elegir variantes mucho mas grandes de
              lo que se dibuja.
            */}
            <Image
              src="/escudo.png"
              alt={SITE_NAME}
              width={900}
              height={554}
              sizes="260px"
              className="h-auto w-full max-w-[260px]"
            />

            <p className="text-ink/70 mt-5 max-w-sm text-sm leading-relaxed">
              {SITE_TAGLINE}
            </p>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              // rel="me" declara que la cuenta es del mismo dueño que el sitio.
              rel="me noopener noreferrer"
              className="text-ink/70 hover:text-ink focus-visible:ring-accent mt-5 inline-flex min-h-11 items-center gap-2.5 rounded-full px-3 text-sm ring-1 ring-white/15 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none"
            >
              <InstagramIcon className="size-5" />
              {INSTAGRAM_HANDLE}
              <span className="sr-only">
                {' '}
                (se abre en Instagram, en una pestaña nueva)
              </span>
            </a>
          </div>

          <FooterColumn title="El sitio" links={NAV_LINKS} />

          <div className="relative">
            <p className="font-display text-ink/60 text-xs tracking-[0.2em] uppercase">
              Redacción
            </p>
            {/*
              Acceso al CMS.

              Mostrarlo no expone nada nuevo: robots.txt ya declara /admin, y lo
              que protege el panel es el proxy con sesion y las politicas RLS,
              no que la direccion sea dificil de adivinar. Va con menos
              contraste porque es para el equipo, no para el lector.
            */}
            <Link
              href="/admin/login"
              className="text-ink/60 hover:text-ink focus-visible:ring-accent mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm ring-1 ring-white/10 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none"
            >
              <LogIn aria-hidden className="size-4" />
              Acceder al panel
            </Link>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-ink/60 text-xs">
            © {year} {SITE_NAME}. Hecho en Chile.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { href: string; label: string }[]
}) {
  if (links.length === 0) return null

  return (
    <div>
      <p className="font-display text-ink/60 text-xs tracking-[0.2em] uppercase">
        {title}
      </p>
      <ul className="mt-4 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ink/75 hover:text-ink flex min-h-11 items-center text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
