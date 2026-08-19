'use client'

import { useRef, useState } from 'react'

import {
  guardarDocumento,
  pedirSubidaDocumento,
  type EstadoDocumento,
} from '@/app/(admin)/admin/documentos/actions'
import { ACCEPT_PDF, MAX_PDF_MB, revisarPdf } from '@/lib/archivos'
import { formatearPeso } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

type DocumentoEditable = {
  id: number
  title: string
  description: string | null
  file_url: string
  file_size_bytes: number | null
}

type DocumentFormProps = {
  /** Si viene, el formulario edita. Si no, crea. */
  documento?: DocumentoEditable
}

const SIN_ESTADO: EstadoDocumento = { error: null, ok: null }

/**
 * Alta y edicion de un documento.
 *
 * **No usa `<form action={serverAction}>` como el resto del CMS, y no es por
 * gusto.** El PDF no viaja adentro de la accion: va del navegador a Storage
 * con una URL firmada, porque un reglamento escaneado pasa los 16 MB que Next
 * admite en el cuerpo de una Server Action y ese error se ve solo en los logs
 * del servidor (ver `lib/admin/storage.ts`).
 *
 * Eso obliga a orquestar tres pasos desde el cliente: pedir la firma, subir, y
 * recien despues guardar la fila. La contra es que este formulario, a
 * diferencia de los otros, **necesita JavaScript**. Es una herramienta interna
 * detras de sesion, asi que el costo es aceptable; la alternativa era un tope
 * de peso que la liga no controla.
 *
 * El orden de los pasos es el que evita filas rotas: si la subida falla no se
 * escribe nada, y si la escritura falla el servidor borra el archivo que acaba
 * de recibir.
 */
export function DocumentForm({ documento }: DocumentFormProps) {
  const [estado, setEstado] = useState<EstadoDocumento>(SIN_ESTADO)
  const [aviso, setAviso] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [paso, setPaso] = useState<'quieto' | 'subiendo' | 'guardando'>(
    'quieto'
  )
  const inputArchivo = useRef<HTMLInputElement>(null)

  const idBase = documento?.id ?? 'nuevo'
  const trabajando = paso !== 'quieto'

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (trabajando) return

    /*
      El formulario se guarda en una variable ANTES del primer `await`.

      `e.currentTarget` solo es valido mientras el evento se esta despachando:
      apenas el handler cede el control -y aca cede tres veces, en la firma, la
      subida y el guardado- React lo deja en null, asi que el `reset()` del
      final explotaba con "cannot read properties of null".
    */
    const form = e.currentTarget
    const datos = new FormData(form)
    const title = String(datos.get('title') ?? '')
    const description = String(datos.get('description') ?? '')

    // Crear sin archivo no tiene sentido; editar sin archivo conserva el
    // que ya estaba.
    if (!documento && !archivo) {
      setEstado({ error: 'Elige el archivo PDF.', ok: null })
      return
    }

    setEstado(SIN_ESTADO)

    let ruta: string | undefined

    if (archivo) {
      setPaso('subiendo')
      const firma = await pedirSubidaDocumento()
      if (firma.error !== null) {
        setPaso('quieto')
        setEstado({ error: firma.error, ok: null })
        return
      }

      const supabase = createClient()
      const { error } = await supabase.storage
        .from('documents')
        .uploadToSignedUrl(firma.ruta, firma.token, archivo, {
          contentType: 'application/pdf',
        })

      if (error) {
        setPaso('quieto')
        /*
          El mensaje de Storage se registra pero no se muestra tal cual: los
          suyos hablan de buckets y de politicas, que no le dicen nada a quien
          esta subiendo unas bases. El caso frecuente es el tope por archivo del
          proyecto, asi que el aviso lo nombra.
        */
        console.error('Falló la subida del PDF:', error.message)
        setEstado({
          error: `No se pudo subir el archivo. Revisa que sea un PDF de menos de ${MAX_PDF_MB} MB.`,
          ok: null,
        })
        return
      }

      ruta = firma.ruta
    }

    setPaso('guardando')
    const resultado = await guardarDocumento({
      ...(documento ? { id: documento.id, urlActual: documento.file_url } : {}),
      title,
      description,
      ...(ruta ? { ruta } : {}),
    })

    setPaso('quieto')
    setEstado(resultado)

    if (resultado.ok && !documento) {
      // Solo el alta se vacia: al editar, dejar los campos como quedaron es lo
      // que deja ver que se guardo lo que se estaba mirando.
      form.reset()
      setArchivo(null)
      if (inputArchivo.current) inputArchivo.current.value = ''
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <div>
        <label
          htmlFor={`title-${idBase}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Título
        </label>
        <input
          id={`title-${idBase}`}
          name="title"
          required
          maxLength={120}
          defaultValue={documento?.title}
          placeholder="Bases de la temporada 2026"
          className="focus:border-accent focus:ring-accent/20 mt-1.5 block h-11 w-full rounded-lg border border-black/10 px-3 text-[15px] outline-none focus:ring-4"
        />
      </div>

      <div>
        <label
          htmlFor={`desc-${idBase}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Descripción
        </label>
        <textarea
          id={`desc-${idBase}`}
          name="description"
          rows={2}
          maxLength={400}
          defaultValue={documento?.description ?? ''}
          placeholder="Una línea que explique para qué sirve el documento."
          className="focus:border-accent focus:ring-accent/20 mt-1.5 block w-full rounded-lg border border-black/10 px-3 py-2.5 text-[15px] outline-none focus:ring-4"
        />
      </div>

      <div>
        <label
          htmlFor={`pdf-${idBase}`}
          className="text-ink/70 block text-sm font-medium"
        >
          Archivo PDF
        </label>
        <input
          ref={inputArchivo}
          id={`pdf-${idBase}`}
          type="file"
          accept={ACCEPT_PDF}
          onChange={(e) => {
            const elegido = e.target.files?.[0] ?? null
            const problema = elegido ? revisarPdf(elegido) : null
            setAviso(problema)
            // Un archivo que no sirve se descarta en el acto: si quedara
            // elegido, el boton prometeria algo que va a fallar.
            if (problema) {
              e.target.value = ''
              setArchivo(null)
            } else {
              setArchivo(elegido)
            }
          }}
          // `file:py-3` y no `py-2`: el boton que dibuja el navegador dentro
          // del input es el objetivo tactil del campo, y con `py-2` medía 36px.
          className="text-ink/70 file:bg-accent/10 file:text-accent mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-3 file:text-sm file:font-medium"
        />
        {aviso ? (
          <p role="alert" className="text-accent mt-1.5 text-xs font-medium">
            {aviso}
          </p>
        ) : (
          <p className="text-ink/45 mt-1.5 text-xs">
            Solo PDF, hasta {MAX_PDF_MB} MB.
            {archivo
              ? ` Elegido: ${archivo.name} (${formatearPeso(archivo.size)}).`
              : ''}
            {documento && !archivo
              ? ' Si no eliges uno nuevo, se mantiene el actual.'
              : ''}
          </p>
        )}
      </div>

      {estado.error ? (
        <p role="alert" className="text-accent text-sm">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="text-sm text-green-700">
          {estado.ok}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={trabajando}
          className="bg-accent font-display h-11 rounded-lg px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
        >
          {paso === 'subiendo'
            ? 'Subiendo archivo...'
            : paso === 'guardando'
              ? 'Guardando...'
              : documento
                ? 'Guardar cambios'
                : 'Publicar documento'}
        </button>
        {/*
          El aviso de "no cierres" es solo mientras sube. Un PDF de 40 MB por
          una conexion lenta tarda, y sin nada que lo diga la pantalla parece
          colgada.
        */}
        {paso === 'subiendo' ? (
          <p role="status" className="text-ink/60 mt-2 text-xs">
            No cierres esta página hasta que termine.
          </p>
        ) : null}
      </div>
    </form>
  )
}
