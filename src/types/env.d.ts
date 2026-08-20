/**
 * Nombres de las variables de entorno del proyecto.
 *
 * Mantener sincronizado con `.env.example`: si se agrega una variable ahi,
 * agregarla aca tambien. Sirve para autocompletado y para que un typo en
 * `process.env.NEXT_PUBLIC_SUPBASE_URL` sea un error de tipos y no un
 * `undefined` silencioso.
 *
 * Se declaran como `string | undefined` porque eso es lo que realmente son:
 * nada garantiza que el `.env.local` este completo. La validacion vive en
 * `src/lib/supabase/config.ts`, que falla con un mensaje claro al arrancar en
 * vez de dejar que Supabase reciba `undefined` y devuelva un error opaco.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL?: string

    /** Publica por diseno. Lo que protege los datos es RLS. */
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string

    /** Server-only. Bypassea RLS. Nunca exponer al cliente. */
    readonly SUPABASE_SECRET_KEY?: string

    /** Server-only. Protege POST /api/revalidate. */
    readonly REVALIDATION_SECRET?: string

    /**
     * Server-only. Token de larga duracion de la API de Instagram.
     *
     * Dura 60 dias y hay que refrescarlo antes de que venza: vencido no se
     * puede refrescar y hay que rehacer la autorizacion entera. Sin el, la
     * seccion de Reels muestra contenido de muestra.
     */
    readonly INSTAGRAM_ACCESS_TOKEN?: string

    /** Publica. El dominio real del sitio, para canonicas y sitemap. */
    readonly NEXT_PUBLIC_SITE_URL?: string

    /** Server-only. API key de Resend, para los formularios del sitio. */
    readonly RESEND_API_KEY?: string

    /** Server-only. A donde llegan los mensajes de los formularios. */
    readonly CORREO_DESTINO?: string

    /**
     * Server-only. Remitente de esos correos.
     *
     * Resend exige el dominio verificado en su panel. Vacia mientras no haya
     * dominio propio: el codigo cae en onboarding@resend.dev, que solo entrega
     * a la casilla dueña de la cuenta de Resend.
     */
    readonly CORREO_REMITENTE?: string
  }
}
