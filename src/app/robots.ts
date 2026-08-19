import type { MetadataRoute } from 'next'

import { urlAbsoluta } from '@/lib/site'

/**
 * robots.txt.
 *
 * El bloqueo de `/admin` aca es la segunda capa, no la primera: robots.txt es
 * una convencion que los buscadores respetan por voluntad propia, y ademas es
 * publico, asi que anuncia donde esta el CMS. Lo que de verdad protege el admin
 * es el proxy, que exige sesion y manda `X-Robots-Tag: noindex`.
 *
 * `/_next/` no se bloquea: Google necesita bajar el CSS y el JS para renderizar
 * la pagina y evaluarla. Bloquearlos hace que la vea rota.
 *
 * `/salir-vista-previa` tampoco: no es secreta y no hace nada para quien no
 * tiene el modo borrador encendido. Listarla solo le daria importancia.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: urlAbsoluta('/sitemap.xml'),
    host: urlAbsoluta('/'),
  }
}
