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

    **Falta `/historia` a proposito.** La pagina existe pero su texto todavia
    es relleno, y va con `noindex` hasta que llegue el de verdad (ver
    `(public)/historia/contenido.ts`). Declarar en el sitemap una URL que ademas
    pedimos no indexar es una señal contradictoria; entra cuando se saque el
    `noindex`.

    Las categorias no van a entrar nunca: este sitio no tiene paginas de
    categoria, las categorias solo clasifican noticias (CLAUDE.md seccion 4).
  */
  const estaticas: MetadataRoute.Sitemap = [
    {
      url: urlAbsoluta('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      // El listado completo de noticias. Cambia cada vez que se publica una.
      url: urlAbsoluta('/noticias'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      // Cambia cuando la Liga sube o saca un PDF, no todos los dias.
      url: urlAbsoluta('/documentos'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      // Quienes buscan equipo. Cambia cuando alguien se inscribe, no todos los dias.
      url: urlAbsoluta('/jugadores'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Cambia poco y no es una pagina de trafico, pero si de confianza: es la
      // que responde "como los contacto" cuando alguien evalua a la Liga.
      url: urlAbsoluta('/contacto'),
      changeFrequency: 'yearly',
      priority: 0.4,
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
