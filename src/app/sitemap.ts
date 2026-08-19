import type { MetadataRoute } from 'next'

import { getPublishedSlugs } from '@/lib/posts'
import { rutaNoticia, urlAbsoluta } from '@/lib/site'

/**
 * Sitemap.
 *
 * Solo rutas publicas: `/admin` no aparece nunca, ni siquiera bloqueado.
 * Listar una URL en el sitemap y prohibirla en robots.txt es una señal
 * contradictoria; lo correcto es que no este.
 *
 * Se revalida igual que las paginas para que una nota nueva entre al sitemap
 * sin esperar un deploy.
 */
export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedSlugs()

  /*
    Estaticas que existen de verdad.

    Un sitemap que declara URLs inexistentes le hace perder rastreo a Google y
    aparece como "URL enviada no encontrada" en Search Console, asi que cada
    ruta entra aca recien cuando la pagina esta hecha.

    Hoy es una sola. `/historia`, `/documentos`, `/inscribete` y `/contacto`
    estan en la barra de navegacion pero todavia no tienen pagina: entran en la
    Etapa 6, y ese es el momento de sumarlas a esta lista.

    Las categorias no van a entrar nunca: este sitio no tiene paginas de
    categoria, las categorias solo clasifican noticias (CLAUDE.md seccion 4).
  */
  const estaticas: MetadataRoute.Sitemap = [
    {
      url: urlAbsoluta('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  return [
    ...estaticas,
    ...posts.map((p) => ({
      url: urlAbsoluta(rutaNoticia(p.slug)),
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
