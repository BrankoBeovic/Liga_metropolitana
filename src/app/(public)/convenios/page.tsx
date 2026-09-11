import type { Metadata } from 'next'

import { BenefitCard } from '@/components/convenios/BenefitCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getBenefits } from '@/lib/benefits'
import { urlAbsoluta } from '@/lib/site'

/**
 * Revalidacion cada 5 minutos, igual que `/documentos`.
 *
 * Publicar un convenio desde el CMS no espera: `guardarBeneficio` llama a
 * `revalidatePath('/convenios')` y la invalida en el momento. Este numero es
 * el respaldo por si esa llamada falla.
 */
export const revalidate = 300

const TITULO = 'Convenios y Beneficios'
const BAJADA =
  'El seguro médico de la Liga y los convenios que conseguimos para clubes y jugadores.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/convenios') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/convenios'),
  },
}

export default async function ConveniosPage() {
  const beneficios = await getBenefits()

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante. Mismo motivo
        que en el resto de las paginas interiores (CLAUDE.md seccion 3).
      */}
      <PageHeader titulo={TITULO} bajada={BAJADA} />

      {beneficios.length > 0 ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficios.map((beneficio) => (
            <li key={beneficio.id}>
              <BenefitCard benefit={beneficio} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-10"
          title="Todavía no hay convenios publicados"
          description="En cuanto la Liga cargue el seguro médico o un convenio, van a aparecer acá."
        />
      )}
    </div>
  )
}
