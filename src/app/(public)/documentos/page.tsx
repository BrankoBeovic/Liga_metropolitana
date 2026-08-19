import type { Metadata } from 'next'

import { ListaDocumentos } from '@/components/documentos/ListaDocumentos'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getDocumentos } from '@/lib/documentos'
import { urlAbsoluta } from '@/lib/site'

/**
 * Revalidacion cada 5 minutos, igual que la portada.
 *
 * Publicar un documento desde el CMS no espera: `guardarDocumento` llama a
 * `revalidatePath('/documentos')` y la invalida en el momento. Este numero es
 * el respaldo por si esa llamada falla.
 */
export const revalidate = 300

const TITULO = 'Documentos'
const BAJADA =
  'Bases, reglamentos y formularios de la Liga Metropolitana, para descargar en PDF.'

export const metadata: Metadata = {
  title: TITULO,
  description: BAJADA,
  alternates: { canonical: urlAbsoluta('/documentos') },
  openGraph: {
    type: 'website',
    title: TITULO,
    description: BAJADA,
    url: urlAbsoluta('/documentos'),
  },
}

export default async function DocumentosPage() {
  const documentos = await getDocumentos()

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 lg:px-10">
      {/*
        `pt-28` reserva a mano el espacio de la barra flotante.

        La barra es `fixed`, o sea que esta fuera del flujo y no empuja nada
        hacia abajo. En la portada eso es lo que se busca -el video llega al
        borde de la pantalla- pero en una pagina interior el titulo nacia
        debajo de la pildora. Medido: la barra ocupa hasta 71px desde arriba.
      */}
      <PageHeader titulo="Documentos" bajada={BAJADA} />

      {/*
        El buscador vive dentro de `ListaDocumentos`, que es la unica parte
        cliente de la pagina. Si no hay ni un documento no tiene nada que
        filtrar, asi que ni siquiera se monta.
      */}
      {documentos.length > 0 ? (
        <div className="mt-10">
          <ListaDocumentos documentos={documentos} />
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          title="Todavía no hay documentos publicados"
          description="En cuanto la Liga suba las bases o un reglamento, van a aparecer acá para descargar."
        />
      )}
    </div>
  )
}
