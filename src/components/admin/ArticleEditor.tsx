'use client'

import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import type { Node as NodoPM } from '@tiptap/pm/model'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { ImagenDeCuerpo } from '@/lib/tiptap/imagen'
import type { Json } from '@/types/database.types'

/**
 * Las imagenes en el cuerpo estan APAGADAS.
 *
 * Se puede subir portada, avatar y arte de sponsor como siempre; lo que no se
 * puede es meter una imagen dentro del texto de la nota. La decision fue no
 * ofrecer la funcion, asi que no alcanza con esconder el boton: hay tres
 * puertas y las tres tienen que estar cerradas.
 *
 *   1. El boton de la barra. No existe.
 *   2. La Server Action que subia el archivo. Borrada. Era la unica que de
 *      verdad importaba: una Server Action es un endpoint propio y se puede
 *      invocar sin pasar por la pantalla, asi que mientras existiera se podia
 *      subir aunque el boton no estuviera.
 *   3. Pegar y arrastrar. Se interceptan y se rechazan con un aviso.
 *
 * La tercera no se puede simplemente dejar sin manejar. Sin interceptar, una
 * imagen pegada entra al documento por su cuenta: en el mejor caso apunta a un
 * dominio que `next/image` no sirve y la nota publicada muestra un hueco, y en
 * el peor queda incrustada en base64 y la fila de la nota engorda varios megas.
 * Rechazar explicitamente es lo unico que deja el documento limpio.
 *
 * Lo que SI sigue funcionando es mostrar las imagenes que ya estaban guardadas
 * de antes: eso lo hace `ArticleContent` y no depende de nada de aca. Por eso
 * el nodo `ImagenDeCuerpo` se conserva aunque no se pueda insertar ninguno
 * nuevo; sin el, abrir una de esas notas y guardarla les borraria el epigrafe y
 * el credito, porque el nodo de fabrica no conoce esos atributos y los
 * descarta al serializar.
 *
 * Para volver a encenderla: el historial tiene el boton, el dialogo de datos
 * (`ImagenDialogo.tsx`) y la accion de subida.
 */
const AVISO_SIN_IMAGENES =
  'No se pueden agregar imágenes al cuerpo de la nota. Usa la portada para la foto principal.'

/** Si lo pegado o arrastrado trae algun archivo de imagen. */
function traeImagen(archivos: FileList | null | undefined): boolean {
  if (!archivos) return false
  return Array.from(archivos).some((a) => a.type.startsWith('image/'))
}

/**
 * Saca del contenido pegado cualquier nodo de imagen.
 *
 * Cubre el pegado de HTML (copiar un bloque de otra pagina, o de otra nota del
 * propio CMS), que no pasa por `handlePaste` porque ahi no hay archivo: el
 * documento viaja como markup y ProseMirror lo parsea.
 */
function quitarImagenes(fragmento: Fragment, alQuitar: () => void): Fragment {
  const nodos: NodoPM[] = []

  fragmento.forEach((nodo) => {
    if (nodo.type.name === 'image') {
      alQuitar()
      return
    }
    nodos.push(nodo.copy(quitarImagenes(nodo.content, alQuitar)))
  })

  return Fragment.fromArray(nodos)
}

type ArticleEditorProps = {
  /** Documento inicial de TipTap. */
  contenido: Json
  /** Nombre del input oculto que viaja en el form. */
  name?: string
}

/**
 * Editor del cuerpo de la nota.
 *
 * El documento se guarda como JSON de TipTap, no como HTML (CLAUDE.md seccion
 * 2). El JSON es estructura: se puede volver a renderizar con otro diseño, o
 * migrar, sin parsear markup. Guardar HTML ata el contenido a las clases CSS
 * del dia que se escribio.
 *
 * El valor viaja en un input oculto para que el formulario funcione con una
 * Server Action normal y sin fetch a mano.
 *
 * Ese input se escribe desde `onUpdate` con una referencia al nodo, y NO
 * calculando el JSON dentro del render. La diferencia es el bug que hacia que
 * el cuerpo se guardara vacio: en TipTap 3 `useEditor` ya no vuelve a
 * renderizar React en cada tecla (`shouldRerenderOnTransaction` pasa a ser
 * `false` por defecto), asi que un `value={JSON.stringify(editor.getJSON())}`
 * queda congelado en el documento vacio del primer render. Se guardaba lo que
 * habia antes de escribir.
 *
 * Escribir el nodo a mano tambien evita re-renderizar toda la barra en cada
 * tecla, que es lo que pasaria guardando el JSON en un `useState`.
 */
export function ArticleEditor({
  contenido,
  name = 'content',
}: ArticleEditorProps) {
  const campo = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const documentoInicial = useRef<object>(
    (contenido as object | null) ?? { type: 'doc', content: [] }
  )

  const sincronizar = useCallback((json: object) => {
    if (campo.current) campo.current.value = JSON.stringify(json)
  }, [])

  /*
    El input oculto se llena al MONTARLO, no con `defaultValue`.

    Esto no tiene nada que ver con las imagenes: arregla que el cuerpo se
    guardara vacio. En un input normal `defaultValue` alcanza, porque el
    navegador marca el campo como "sucio" cuando alguien le asigna `.value` por
    codigo y desde ahi el atributo deja de mandar. En un `type="hidden"` no hay
    campo sucio que valga: su IDL `value` esta en modo "default", asi que leer y
    escribir `value` es leer y escribir el atributo, y `value` y `defaultValue`
    son la misma cosa (`input.value === input.defaultValue` da true siempre).

    Entonces cada re-render de React reescribia el atributo y pisaba el JSON que
    habia puesto `sincronizar`. Y el editor re-renderiza mas seguido de lo que
    parece, porque `useEditorState` lo hace cada vez que cambia el estado de los
    botones de la barra: escribir un parrafo y despues tocar Negrita alcanzaba
    para que el input volviera al documento con el que se abrio la pagina.
    Guardar dejaba la nota como estaba antes de escribir.

    Escribiendo en el montaje, React no vuelve a tocar este nodo nunca. El
    callback es estable, asi que corre una sola vez, y para entonces el editor
    ya existe con su documento normalizado.
  */
  const montarCampo = useCallback((nodo: HTMLInputElement | null) => {
    campo.current = nodo
    if (!nodo) return
    nodo.value = JSON.stringify(
      editorRef.current?.getJSON() ?? documentoInicial.current
    )
  }, [])

  const editor = useEditor({
    // Sin esto Next avisa de un desajuste de hidratacion: el editor genera el
    // DOM en el cliente y no coincide con el HTML del servidor.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({
        openOnClick: false,
        // Los enlaces del cuerpo salen con rel seguro tambien dentro del
        // editor, para que lo que se ve sea lo que se guarda.
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      ImagenDeCuerpo.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
    ],
    content: (contenido as object) ?? { type: 'doc', content: [] },
    // `onCreate` ademas de `onUpdate`: al arrancar, TipTap normaliza el
    // documento (por ejemplo agrega el parrafo vacio que necesita para poder
    // escribir), y sin esto el input se quedaria con el JSON crudo que vino de
    // la base en vez de con el que el editor realmente tiene.
    onCreate: ({ editor }) => {
      editorRef.current = editor
      sincronizar(editor.getJSON())
    },
    onUpdate: ({ editor }) => sincronizar(editor.getJSON()),
    editorProps: {
      attributes: {
        // El tamaño y el interlineado los pone `.prose-editor` en globals.css,
        // junto con el resto de la tipografia del cuerpo. Aca irian como
        // utilidades, y las utilidades le ganan a la capa de componentes: con
        // un `text-[17px]` suelto, la regla de la hoja no se aplicaba nunca.
        class:
          'prose-editor min-h-[24rem] w-full rounded-b-lg border border-t-0 border-black/10 px-4 py-4 outline-none focus:border-accent',
      },

      // Las tres puertas de entrada de una imagen, cerradas. Ver el comentario
      // de `AVISO_SIN_IMAGENES` arriba.
      handlePaste: (_vista, evento) => {
        if (!traeImagen(evento.clipboardData?.files)) return false
        setAviso(AVISO_SIN_IMAGENES)
        return true
      },

      handleDrop: (_vista, evento, _slice, movido) => {
        // `movido` es arrastrar algo que ya esta en el documento: eso lo
        // resuelve ProseMirror y no trae ningun archivo.
        if (movido) return false
        if (!traeImagen(evento.dataTransfer?.files)) return false
        evento.preventDefault()
        setAviso(AVISO_SIN_IMAGENES)
        return true
      },

      transformPasted: (slice) => {
        let quitadas = 0
        const limpio = quitarImagenes(slice.content, () => {
          quitadas += 1
        })
        if (quitadas === 0) return slice

        setAviso(AVISO_SIN_IMAGENES)
        // `maxOpen` y no los `openStart`/`openEnd` originales: al sacar nodos,
        // aquellos numeros pueden describir una apertura que el fragmento nuevo
        // ya no tiene, y ProseMirror tira al insertarla.
        return Slice.maxOpen(limpio)
      },
    },
  })

  /*
    Estado de los botones de la barra.

    Va por `useEditorState` y no por `editor.isActive(...)` suelto en el render
    por la misma razon que el input: sin re-render por transaccion, los botones
    se quedaban marcados como estaban al montar y nunca reflejaban donde esta
    el cursor. Este hook si se suscribe a los cambios, y solo vuelve a
    renderizar cuando el resultado del selector cambia de verdad.
  */
  const marcas = useEditorState({
    editor,
    selector: ({ editor }) => ({
      negrita: editor?.isActive('bold') ?? false,
      cursiva: editor?.isActive('italic') ?? false,
      titulo: editor?.isActive('heading', { level: 2 }) ?? false,
      subtitulo: editor?.isActive('heading', { level: 3 }) ?? false,
      lista: editor?.isActive('bulletList') ?? false,
      cita: editor?.isActive('blockquote') ?? false,
      enlace: editor?.isActive('link') ?? false,
    }),
  })

  const agregarEnlace = useCallback(() => {
    if (!editor) return
    const previo = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL del enlace', previo ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const agregarYoutube = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL del video de YouTube')
    if (!url) return
    editor.commands.setYoutubeVideo({ src: url })
  }, [editor])

  if (!editor) {
    return (
      <div
        className="min-h-[24rem] animate-pulse rounded-lg bg-black/[0.03]"
        aria-hidden
      />
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-black/10 bg-black/[0.02] p-2">
        <Boton
          activo={marcas?.negrita ?? false}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Negrita
        </Boton>
        <Boton
          activo={marcas?.cursiva ?? false}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Cursiva
        </Boton>
        <Boton
          activo={marcas?.titulo ?? false}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          Título
        </Boton>
        <Boton
          activo={marcas?.subtitulo ?? false}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          Subtítulo
        </Boton>
        <Boton
          activo={marcas?.lista ?? false}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Lista
        </Boton>
        <Boton
          activo={marcas?.cita ?? false}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Cita
        </Boton>
        <Boton activo={marcas?.enlace ?? false} onClick={agregarEnlace}>
          Enlace
        </Boton>
        <Boton activo={false} onClick={agregarYoutube}>
          YouTube
        </Boton>
        <Boton
          activo={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          Separador
        </Boton>
      </div>

      <EditorContent editor={editor} />

      {/*
        `aria-live` para que el aviso se anuncie: aparece despues de una accion
        y sin eso solo lo ve quien esta mirando esa parte de la pantalla.
      */}
      <div aria-live="polite">
        {aviso ? <p className="text-accent mt-2 text-sm">{aviso}</p> : null}
      </div>

      {/*
        Ni `value` ni `defaultValue`: los dos los reescribe React en cada render
        y en un input oculto son el mismo atributo. El valor lo pone
        `montarCampo` al montar. Ver el comentario largo alla arriba.
      */}
      <input ref={montarCampo} type="hidden" name={name} />

      <p className="text-ink/45 mt-2 text-xs">
        El tiempo de lectura se calcula solo al guardar.
      </p>
    </div>
  )
}

function Boton({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'font-display flex min-h-11 items-center rounded-md px-2.5 text-xs font-bold transition-colors',
        activo ? 'bg-accent text-white' : 'text-ink/70 hover:bg-black/5'
      )}
    >
      {children}
    </button>
  )
}
