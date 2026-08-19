import { Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'

import { AdminShell } from '@/components/admin/AdminShell'
import { SponsorForm } from '@/components/admin/SponsorForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

import { alternarSponsor, borrarSponsor } from './actions'

export const metadata: Metadata = { title: 'Sponsors' }
export const dynamic = 'force-dynamic'

export default async function SponsorsPage() {
  // Cualquier usuario del equipo. Los sponsors no son exclusivos del admin:
  // en la practica cualquiera carga uno nuevo y pedirselo a otra persona
  // frenaria el trabajo. Las notas siguen siendo de su autor.
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('id, name, logo_url, website_url, display_order, is_active')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Sponsors"
      descripcion="Los logos que aparecen en la sección de sponsors de la portada. Se muestran los visibles, en su orden."
    >
      <section className="rounded-xl p-6 ring-1 ring-black/5">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Agregar sponsor
        </h2>
        <SponsorForm />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Sponsors cargados
        </h2>

        {sponsors && sponsors.length > 0 ? (
          <ul className="space-y-4">
            {sponsors.map((sponsor) => (
              <li
                key={sponsor.id}
                className="rounded-xl p-5 ring-1 ring-black/5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={sponsor.logo_url}
                      alt=""
                      aria-hidden
                      width={80}
                      height={40}
                      className="h-10 w-20 shrink-0 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-ink truncate text-sm font-bold">
                        {sponsor.name}
                      </p>
                      <p className="text-ink/45 truncate text-xs">
                        {sponsor.website_url}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={
                        sponsor.is_active
                          ? 'rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800'
                          : 'text-ink/50 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold'
                      }
                    >
                      {sponsor.is_active ? 'Visible' : 'Oculto'}
                    </span>

                    <form action={alternarSponsor}>
                      <input type="hidden" name="id" value={sponsor.id} />
                      <input
                        type="hidden"
                        name="activar"
                        value={sponsor.is_active ? '0' : '1'}
                      />
                      <button
                        type="submit"
                        className="text-ink/60 hover:text-ink flex min-h-11 items-center text-xs font-medium"
                      >
                        {sponsor.is_active ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </form>

                    {/*
                      Sin confirmacion nativa porque `confirm()` necesita
                      JavaScript y bloquea el hilo. La proteccion real es que
                      "Ocultar" esta al lado: quitar un sponsor del sitio no
                      obliga a borrarlo.

                      Solo icono, igual que en el listado de notas: rodeado de
                      controles de texto, un texto mas competiria por la misma
                      mirada. El nombre viaja en `sr-only` para que el boton no
                      sea mudo en un lector de pantalla, y dice cual se borra.
                    */}
                    <form action={borrarSponsor}>
                      <input type="hidden" name="id" value={sponsor.id} />
                      <button
                        type="submit"
                        className="text-ink/35 hover:text-accent hover:bg-accent/8 focus-visible:ring-accent flex size-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Trash2 aria-hidden className="size-4" />
                        <span className="sr-only">Borrar «{sponsor.name}»</span>
                      </button>
                    </form>
                  </div>
                </div>

                <details>
                  <summary className="text-ink/60 hover:text-ink cursor-pointer py-3.5 text-xs font-medium">
                    Editar
                  </summary>
                  <div className="mt-4 border-t border-black/5 pt-4">
                    <SponsorForm sponsor={sponsor} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no hay sponsors"
            description="Agrega el primero con el formulario de arriba."
          />
        )}
      </section>
    </AdminShell>
  )
}
