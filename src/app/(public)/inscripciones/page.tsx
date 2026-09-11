import type { Metadata } from 'next'

import { InscripcionesTabs } from '@/components/forms/InscripcionesTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { urlAbsoluta } from '@/lib/site'

const TITULO = 'Inscripciones'
const BAJADA =
  '¿Quieres jugar pero no tienes equipo, o tienes un equipo que quiere sumarse a la Liga? Déjanos los datos y te contactamos.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/inscripciones') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/inscripciones'),
  },
}

export default function InscripcionesPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante. Ver el mismo
        comentario en la version anterior de esta pagina, documentado tambien
        en CLAUDE.md seccion 3.
      */}
      <PageHeader titulo={TITULO} bajada={BAJADA} />

      <InscripcionesTabs />
    </div>
  )
}
