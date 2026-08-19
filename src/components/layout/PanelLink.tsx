'use client'

import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Atajo al CMS, visible solo para quien tiene sesion abierta.
 *
 * Se resuelve en el cliente y no en el servidor a proposito. Leer la sesion en
 * el Header implicaria tocar cookies, y eso saca al sitio publico del render
 * estatico: una sola llamada en el layout pasa todas las paginas a dinamicas y
 * mata el ISR (CLAUDE.md seccion 6). Asi la portada sigue siendo estatica y el
 * boton aparece despues de hidratar.
 *
 * Poder leer la sesion desde el navegador depende de que la cookie de
 * `@supabase/ssr` no sea HttpOnly, que es su comportamiento por defecto y esta
 * documentado en CLAUDE.md seccion 2 como decision, no como descuido.
 *
 * `getSession()` y no `getUser()`: solo decide si mostrar un enlace, no
 * autoriza nada. `getUser()` valida contra el servidor de Auth y eso es una
 * peticion de red en cada carga para pintar un boton. Quien realmente decide
 * si se entra al panel es el proxy, que si valida.
 *
 * No renderiza nada mientras no sabe, para no mostrar y esconder el boton.
 */
export function PanelLink() {
  const [logueado, setLogueado] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let vigente = true

    supabase.auth.getSession().then(({ data }) => {
      if (vigente) setLogueado(Boolean(data.session))
    })

    // Sin esto, cerrar sesion en otra pestaña deja el boton visible hasta
    // recargar.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (vigente) setLogueado(Boolean(sesion))
    })

    return () => {
      vigente = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!logueado) return null

  return (
    <Link
      href="/admin/dashboard"
      className="font-display bg-accent/15 text-accent hover:bg-accent/25 focus-visible:ring-accent flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <LayoutDashboard aria-hidden className="size-4" />
      <span className="hidden sm:inline">Panel</span>
      <span className="sr-only sm:hidden">Ir al panel de redacción</span>
    </Link>
  )
}
