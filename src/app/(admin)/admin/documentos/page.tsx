import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { requerirSesion } from '@/lib/admin/session'

export const metadata: Metadata = { title: 'Documentos' }
export const dynamic = 'force-dynamic'

/**
 * Pantalla PROVISORIA. La gestion completa de documentos (tabla, subida de
 * PDF y buscador) se construye en la Etapa 6, junto con la pagina publica
 * /documentos. El enlace del menu ya existe para que la navegacion quede
 * completa desde ahora.
 */
export default async function DocumentosPage() {
  const sesion = await requerirSesion()

  return (
    <AdminShell
      sesion={sesion}
      titulo="Documentos"
      descripcion="Los PDF descargables del sitio: bases, reglamentos y formularios."
    >
      <p className="text-ink/55 rounded-xl p-6 text-sm ring-1 ring-black/5">
        Esta sección se habilita próximamente. Acá se van a subir y administrar
        los PDF que aparecen en la página pública de documentos.
      </p>
    </AdminShell>
  )
}
