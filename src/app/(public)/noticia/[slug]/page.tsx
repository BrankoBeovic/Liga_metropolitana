import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { ArticleContent } from '@/components/articles/ArticleContent'
import { ArticleCover } from '@/components/articles/ArticleCover'
import { AuthorBio } from '@/components/articles/AuthorBio'
import { Breadcrumbs } from '@/components/articles/Breadcrumbs'
import { RecentGrid } from '@/components/articles/RecentGrid'
import { Badge } from '@/components/ui/Badge'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { formatearFecha, formatearLectura } from '@/lib/format'
import { FIRMA_EQUIPO, SITE_NAME } from '@/lib/navigation'
import { firmaDe } from '@/lib/firma'
import {
  getPostBorrador,
  getPostBySlug,
  getPublishedSlugs,
  getRelatedPosts,
} from '@/lib/posts'
import { rutaNoticia, urlAbsoluta } from '@/lib/site'

export const revalidate = 300

/**
 * Cuantas notas entran en "Sigue leyendo".
 *
 * Cinco y no tres: `RecentGrid` dibuja cinco columnas en pantalla grande, asi
 * que con tres tarjetas quedaban dos columnas vacias a la derecha. Es el mismo
 * componente que usa "Más noticias" en la portada, y esa grilla es la que fijo
 * el numero.
 *
 * El bloque se llena igual aunque la categoria no tenga cinco notas:
 * `getRelatedPosts` completa con las mas recientes de cualquier seccion.
 */
const RELACIONADAS = 5

/**
 * Prerender de las notas publicadas al momento del build.
 *
 * `dynamicParams` queda en su valor por defecto (true): una nota publicada
 * despues del build se genera bajo demanda la primera vez que alguien la pide,
 * en vez de dar 404 hasta el proximo deploy.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

/**
 * La nota, publicada o en borrador segun el modo.
 *
 * `draftMode()` se puede leer sin romper el prerender: a diferencia de
 * `cookies()`, Next lo resuelve como apagado al generar la pagina y solo lo
 * enciende para las peticiones que traen la cookie `__prerender_bypass`. El
 * resto de los lectores sigue recibiendo la version cacheada, y la rama del
 * borrador nunca corre para ellos.
 */
async function obtenerNota(slug: string) {
  const { isEnabled: borrador } = await draftMode()
  const post = borrador
    ? await getPostBorrador(slug)
    : await getPostBySlug(slug)
  return { post, borrador }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { post, borrador } = await obtenerNota(slug)
  if (!post) return { title: 'Nota no encontrada' }

  const url = urlAbsoluta(rutaNoticia(post.slug))
  const imagen = post.cover_image_url ?? '/og.jpg'

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: url },
    // Cinturon y tirantes: un crawler nunca trae la cookie de bypass, asi que
    // ya recibiria la version publicada o un 404. El noindex cubre el caso de
    // que alguien comparta el enlace mientras tiene la vista previa encendida.
    ...(borrador ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      siteName: SITE_NAME,
      locale: 'es_CL',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [firmaDe(post)],
      images: [imagen],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: [imagen],
    },
  }
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params
  const { post, borrador } = await obtenerNota(slug)
  if (!post) notFound()

  const relacionadas = await getRelatedPosts(
    post.category?.slug ?? null,
    post.id,
    RELACIONADAS
  )
  const lectura = formatearLectura(post.reading_time_minutes)
  const url = urlAbsoluta(rutaNoticia(post.slug))

  /**
   * JSON-LD de la nota. `NewsArticle` y no `Article`: es lo que espera Google
   * News y lo que habilita el carrusel de noticias.
   *
   * `Person` va anidado en `author` en vez de suelto: asi queda claro que esa
   * persona firma ESTA nota, que es lo que evalua el E-E-A-T.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: post.category?.name,
    inLanguage: 'es-CL',
    /*
      En una nota anonima el autor es la Organizacion, no una Persona. Emitir
      el Person real con su `sameAs` filtraria en el structured data justo la
      identidad que la firma anonima esconde, y encima seria visible para
      cualquiera que mire el HTML.
    */
    author: post.is_anonymous
      ? { '@type': 'Organization', name: FIRMA_EQUIPO }
      : post.author
        ? {
            '@type': 'Person',
            name: post.author.full_name,
            ...(post.author.twitter_url || post.author.instagram_url
              ? {
                  sameAs: [
                    post.author.twitter_url,
                    post.author.instagram_url,
                  ].filter(Boolean),
                }
              : {}),
          }
        : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: urlAbsoluta('/escudo.png') },
    },
  }

  return (
    <article className="mx-auto max-w-[1400px] px-5 pt-24 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante.

        La barra es `fixed`, o sea que esta fuera del flujo y no empuja nada
        hacia abajo. En la portada eso es lo que se busca -el video llega al
        borde de la pantalla- pero en una pagina interior el titulo nacia
        debajo de la pildora. Medido: la barra ocupa hasta 71px desde arriba.
      */}
      {/*
        Aviso de vista previa.

        Sin esto no hay forma de distinguir una nota publicada de un borrador:
        se ven exactamente igual, y es facil creer que algo ya salio al aire
        cuando no. Lleva la salida al lado, porque la cookie dura hasta cerrar
        el navegador y mientras tanto todo el sitio se sirve salteando la cache.
      */}
      {borrador ? (
        <p className="border-accent/40 bg-accent/10 text-ink mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <span>
            <b className="font-display tracking-wide uppercase">
              Vista previa.
            </b>{' '}
            {post.status === 'published'
              ? 'Esta nota ya está publicada.'
              : 'Este es un borrador y todavía no se ve en el sitio.'}
          </span>
          {/*
            `<a>` y no `<Link>`: la salida es un Route Handler que apaga la
            cookie del modo borrador. Con navegacion de cliente, Next resolveria
            la ruta sin recargar y el resto de la pagina seguiria mostrando la
            version en borrador que ya tenia en memoria.
          */}
          <a
            href="/salir-vista-previa"
            className="font-display text-accent flex min-h-11 items-center tracking-wide uppercase underline underline-offset-2"
          >
            Salir de la vista previa
          </a>
        </p>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/*
        La categoria es una miga sin enlace: este sitio no tiene paginas de
        categoria (CLAUDE.md seccion 4). Sigue siendo informacion util de
        jerarquia, y el JSON-LD la declara como un escalon sin pagina propia.
      */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          ...(post.category ? [{ label: post.category.name }] : []),
          { label: post.title },
        ]}
      />

      {/*
        608px de columna de lectura, y el numero esta medido, no elegido.

        La medida comoda de lectura ronda los 70 caracteres por linea. Medido
        en el DOM con la tipografia real -Plus Jakarta Sans a 18px da 8.26px de
        ancho medio por caracter-, los 768px que traia la fuente daban 93
        caracteres por linea, bastante por encima de lo tolerable. 608px dan
        74. La portada sigue siendo mas ancha que el texto a proposito: es el
        ritmo editorial habitual, foto ancha sobre columna angosta.
      */}
      <header className="mx-auto mt-6 max-w-[38rem]">
        {post.category ? (
          <Badge variant="accent">{post.category.name}</Badge>
        ) : null}

        <h1 className="font-display text-ink mt-4 text-4xl leading-[1.05] tracking-wide text-balance uppercase sm:text-6xl">
          {post.title}
        </h1>

        {post.excerpt ? (
          <p className="text-ink/75 mt-5 text-xl leading-relaxed">
            {post.excerpt}
          </p>
        ) : null}

        <p className="text-ink/60 mt-6 text-sm">
          {firmaDe(post)}
          {post.published_at ? (
            <> · {formatearFecha(post.published_at)}</>
          ) : null}
          {lectura ? <> · {lectura}</> : null}
        </p>
      </header>

      {/*
        Portada con dimensiones fijas por relacion de aspecto: reserva el
        espacio antes de que baje la imagen y evita el salto de layout (CLS).
      */}
      <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl bg-white/5">
        <ArticleCover
          src={post.cover_image_url}
          alt={post.cover_image_alt}
          title={post.title}
          prioritaria
          sizes="(max-width: 1024px) 100vw, 896px"
          className="h-full w-full"
        />
      </div>

      {/*
        Una sola columna, centrada. La fuente tenia una grilla de tres carriles
        para colgar publicidad a los costados; aca no hay avisos laterales
        (CLAUDE.md seccion 4), asi que la columna de lectura es todo.
      */}
      <div className="mx-auto max-w-[38rem]">
        <ArticleContent content={post.content} />
        {/*
          La tarjeta de autor no se muestra en notas anonimas: contiene la bio y
          las redes de la persona real, que es exactamente lo que la firma
          anonima intenta no publicar.
        */}
        {post.author && !post.is_anonymous ? (
          <AuthorBio author={post.author} />
        ) : null}
      </div>

      {relacionadas.length > 0 ? (
        <section aria-labelledby="relacionadas-titulo" className="mt-20">
          <SectionHeading
            id="relacionadas-titulo"
            title="Sigue"
            accent="leyendo"
          />
          <RecentGrid posts={relacionadas} />
        </section>
      ) : null}
    </article>
  )
}
