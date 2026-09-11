import { HeartHandshake, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'

import { AdminShell } from '@/components/admin/AdminShell'
import { BenefitForm } from '@/components/admin/BenefitForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { requerirSesion } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'

import { alternarBeneficio, borrarBeneficio } from './actions'

export const metadata: Metadata = { title: 'Convenios' }
export const dynamic = 'force-dynamic'

export default async function ConveniosPage() {
  // Cualquier usuario del equipo, igual que sponsors y documentos: pedirselo
  // a un admin frenaria el trabajo.
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data: beneficios } = await supabase
    .from('benefits')
    .select(
      'id, name, description, link_url, logo_url, display_order, is_active'
    )
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })

  return (
    <AdminShell
      sesion={sesion}
      titulo="Convenios"
      descripcion="El seguro médico y los convenios que aparecen en /convenios. Se muestran los visibles, en su orden."
    >
      <section className="rounded-xl p-6 ring-1 ring-black/5">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Agregar convenio
        </h2>
        <BenefitForm />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-ink mb-4 text-base font-bold tracking-tight">
          Convenios cargados
        </h2>

        {beneficios && beneficios.length > 0 ? (
          <ul className="space-y-4">
            {beneficios.map((beneficio) => (
              <li
                key={beneficio.id}
                className="rounded-xl p-5 ring-1 ring-black/5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {beneficio.logo_url ? (
                      <Image
                        src={beneficio.logo_url}
                        alt=""
                        aria-hidden
                        width={48}
                        height={48}
                        className="size-10 shrink-0 rounded object-contain"
                      />
                    ) : (
                      <HeartHandshake
                        aria-hidden
                        className="text-ink/30 mt-0.5 size-6 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-ink truncate text-sm font-bold">
                        {beneficio.name}
                      </p>
                      <p className="text-ink/60 mt-0.5 line-clamp-2 text-xs">
                        {beneficio.description}
                      </p>
                      {beneficio.link_url ? (
                        <p className="text-ink/45 mt-1 truncate text-xs">
                          {beneficio.link_url}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={
                        beneficio.is_active
                          ? 'rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800'
                          : 'text-ink/50 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold'
                      }
                    >
                      {beneficio.is_active ? 'Visible' : 'Oculto'}
                    </span>

                    <form action={alternarBeneficio}>
                      <input type="hidden" name="id" value={beneficio.id} />
                      <input
                        type="hidden"
                        name="activar"
                        value={beneficio.is_active ? '0' : '1'}
                      />
                      <button
                        type="submit"
                        className="text-ink/60 hover:text-ink flex min-h-11 items-center text-xs font-medium"
                      >
                        {beneficio.is_active ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </form>

                    <form action={borrarBeneficio}>
                      <input type="hidden" name="id" value={beneficio.id} />
                      <button
                        type="submit"
                        className="text-ink/35 hover:text-accent hover:bg-accent/8 focus-visible:ring-accent flex size-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Trash2 aria-hidden className="size-4" />
                        <span className="sr-only">
                          Borrar «{beneficio.name}»
                        </span>
                      </button>
                    </form>
                  </div>
                </div>

                <details>
                  <summary className="text-ink/60 hover:text-ink cursor-pointer py-3.5 text-xs font-medium">
                    Editar
                  </summary>
                  <div className="mt-4 border-t border-black/5 pt-4">
                    <BenefitForm beneficio={beneficio} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no hay convenios"
            description="Agrega el primero con el formulario de arriba."
          />
        )}
      </section>
    </AdminShell>
  )
}
