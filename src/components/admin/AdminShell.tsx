import { Eye } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cerrarSesion } from '@/app/(admin)/admin/login/actions'
import type { SesionAdmin } from '@/lib/admin/session'

import { AdminNav } from './AdminNav'

type AdminShellProps = {
  sesion: SesionAdmin
  titulo: string
  descripcion?: string
  /** Botones de la esquina superior derecha, como "Nueva nota". */
  acciones?: ReactNode
  children: ReactNode
}

/**
 * Marco comun del CMS: barra superior, navegacion y encabezado de pantalla.
 *
 * Recibe la sesion por props en vez de leerla: asi cada pagina la pide una
 * sola vez y el marco no dispara otra consulta a Auth por render.
 */
export function AdminShell({
  sesion,
  titulo,
  descripcion,
  acciones,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link
            href="/admin/dashboard"
            className="flex min-h-11 shrink-0 items-center gap-2.5"
          >
            <span className="font-display text-ink text-sm font-bold tracking-tight">
              CMS
            </span>
          </Link>

          <AdminNav esAdmin={sesion.esAdmin} />

          <div className="flex shrink-0 items-center gap-3">
            {/*
              Salida al sitio publico. No abre pestaña nueva: la idea es poder
              ir, mirar como quedo y volver con el boton de atras del
              navegador, que es lo que uno hace naturalmente. Abrir en otra
              pestaña rompe justamente ese ida y vuelta.

              `px-3.5` y no `px-2`: abajo de `sm` el texto se esconde y queda
              solo el icono de 16px, que con `px-2` daba un objetivo tactil de
              32px, por debajo del minimo de 44.
            */}
            <Link
              href="/"
              className="text-ink/60 hover:text-ink flex min-h-11 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors"
            >
              <Eye aria-hidden className="size-4" />
              <span className="hidden sm:inline">Ver el sitio</span>
            </Link>

            <span className="text-ink/55 hidden text-xs sm:inline">
              {sesion.fullName}
              {sesion.esAdmin ? (
                <span className="bg-accent/12 text-accent ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                  admin
                </span>
              ) : null}
            </span>

            {/* Server Action directa: cerrar sesion no necesita JavaScript. */}
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="text-ink/60 hover:text-ink flex min-h-11 items-center px-2.5 text-xs font-medium transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
              {titulo}
            </h1>
            {descripcion ? (
              <p className="text-ink/55 mt-1 text-sm">{descripcion}</p>
            ) : null}
          </div>
          {acciones ? <div className="flex gap-2">{acciones}</div> : null}
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  )
}
