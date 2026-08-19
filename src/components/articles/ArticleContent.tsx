import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Json } from '@/types/database.types'

/**
 * Renderiza el documento JSON de TipTap.
 *
 * Se recorre el arbol y se emite React directamente, en vez de convertirlo a
 * HTML con `generateHTML` y volcarlo con `dangerouslySetInnerHTML`. Dos
 * motivos: no hay ni una via por la que el contenido del CMS pueda inyectar
 * markup arbitrario, y los enlaces salientes salen con el `rel` correcto sin
 * tener que post-procesar una cadena de HTML.
 *
 * Los nodos que no estan contemplados se ignoran en silencio: es preferible a
 * romper la pagina entera porque el editor uso una extension que todavia no
 * soportamos.
 *
 * El nodo `image` sigue soportado aunque el CMS ya no deje insertar imagenes
 * en el cuerpo (CLAUDE.md seccion 5): borrarlo dejaria ilegibles las notas que
 * ya tuvieran una.
 */

type TipTapMark = { type: string; attrs?: Record<string, unknown> }
type TipTapNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: TipTapMark[]
  content?: TipTapNode[]
}

function esNodo(valor: unknown): valor is TipTapNode {
  return typeof valor === 'object' && valor !== null
}

function attrString(node: TipTapNode, clave: string): string | null {
  const v = node.attrs?.[clave]
  return typeof v === 'string' ? v : null
}

/** Aplica las marcas (negrita, cursiva, enlace...) sobre un nodo de texto. */
function renderTexto(node: TipTapNode, key: number): ReactNode {
  let salida: ReactNode = node.text ?? ''

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        salida = <strong>{salida}</strong>
        break
      case 'italic':
        salida = <em>{salida}</em>
        break
      case 'strike':
        salida = <s>{salida}</s>
        break
      case 'code':
        salida = (
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">
            {salida}
          </code>
        )
        break
      case 'link': {
        const href =
          typeof mark.attrs?.href === 'string' ? mark.attrs.href : null
        if (!href) break
        const externo = /^https?:\/\//i.test(href)
        salida = externo ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-light underline decoration-2 underline-offset-2 transition-colors hover:no-underline"
          >
            {salida}
          </a>
        ) : (
          <Link
            href={href}
            className="text-accent hover:text-accent-light underline decoration-2 underline-offset-2 transition-colors hover:no-underline"
          >
            {salida}
          </Link>
        )
        break
      }
      default:
        break
    }
  }

  return <span key={key}>{salida}</span>
}

function attrNumero(node: TipTapNode, clave: string): number | null {
  const v = node.attrs?.[clave]
  // Puede venir como cadena, porque el nodo de TipTap lo guardaba tal cual
  // salia del DOM antes de que se tipara como numero.
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : v
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null
}

/**
 * El ancho de la columna de lectura, en pixeles.
 *
 * Es el `max-w-[38rem]` de la pagina de la nota, medido para dar unos 74
 * caracteres por linea. Se usa como ancho nominal de la imagen y en el
 * `sizes`; si alla cambia el ancho, aca tambien, o el navegador vuelve a
 * elegir del `srcset` una variante que no corresponde.
 */
const ANCHO_LECTURA = 608

/**
 * Alto de reserva cuando el nodo no trae medidas.
 *
 * 16:9 como ultimo recurso, para las imagenes que se guardaron antes de que el
 * editor anotara ancho y alto.
 */
const ALTO_POR_DEFECTO = Math.round((ANCHO_LECTURA * 9) / 16)

/**
 * Una imagen del cuerpo, con su epigrafe y su credito.
 *
 * Respeta la proporcion real y no la recorta a 16:9: una infografia alta
 * quedaria reducida a una franja del medio y un retrato vertical perderia la
 * cabeza o los pies.
 *
 * `width` y `height` son los del archivo y no los de la pantalla: `next/image`
 * los usa para calcular la proporcion y reservar el alto exacto antes de que
 * la imagen baje.
 */
function renderImagen(node: TipTapNode, key: number): ReactNode {
  const src = attrString(node, 'src')
  if (!src) return null

  const decorativa = node.attrs?.decorative === true
  const epigrafe = attrString(node, 'caption')
  const credito = attrString(node, 'credit')

  const ancho = attrNumero(node, 'width')
  const alto = attrNumero(node, 'height')

  // Las dos medidas van juntas o no va ninguna: con una sola, la proporcion
  // que calcula `next/image` sale de un numero real y uno inventado.
  const tieneMedidas = ancho !== null && alto !== null

  return (
    <figure key={key} className="my-8">
      <Image
        src={src}
        /*
          El alt vacio de una decorativa no es un descuido: es lo que hace que
          un lector de pantalla la saltee en vez de leer un nombre de archivo.
        */
        alt={decorativa ? '' : (attrString(node, 'alt') ?? '')}
        width={tieneMedidas ? ancho : ANCHO_LECTURA}
        height={tieneMedidas ? alto : ALTO_POR_DEFECTO}
        sizes={`(max-width: ${ANCHO_LECTURA}px) 100vw, ${ANCHO_LECTURA}px`}
        className="h-auto w-full rounded-xl bg-white/5"
      />

      {epigrafe || credito ? (
        <figcaption className="mt-2 text-sm">
          {/*
            El epigrafe y el credito se distinguen por color, no por un guion
            que los separe: son dos datos distintos, uno dice que se ve y el
            otro de quien es la foto, y tiene que poder haber credito sin
            epigrafe, que es el caso normal en una foto de agencia.

            Ninguno de los dos baja de `/60`. Medido sobre el canvas, `/60` da
            6.7:1 y `/45` -que es lo que pide el ojo- da 4.2:1, o sea que no
            pasa AA. Es la misma trampa que la fuente documentaba del lado
            claro, con el texto aclarandose hasta desaparecer en vez de
            oscurecerse.
          */}
          {epigrafe ? <span className="text-ink/70">{epigrafe}</span> : null}
          {epigrafe && credito ? ' ' : null}
          {credito ? (
            <span className="text-ink/60 text-xs tracking-wide uppercase">
              {credito}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

function renderNodos(nodos: TipTapNode[] | undefined): ReactNode {
  if (!nodos?.length) return null
  return nodos.map((n, i) => renderNodo(n, i))
}

function renderNodo(node: TipTapNode, key: number): ReactNode {
  if (!esNodo(node)) return null

  switch (node.type) {
    case 'text':
      return renderTexto(node, key)

    case 'paragraph':
      return (
        <p key={key} className="text-ink/85 mt-5 text-lg leading-[1.75]">
          {renderNodos(node.content)}
        </p>
      )

    case 'heading': {
      const nivel = typeof node.attrs?.level === 'number' ? node.attrs.level : 2
      // El h1 lo usa el titulo de la nota. Lo que venga del editor arranca en
      // h2 para no romper la jerarquia de encabezados.
      const Tag = `h${Math.min(Math.max(nivel, 2), 4)}` as 'h2' | 'h3' | 'h4'
      const tamano =
        Tag === 'h2'
          ? 'text-3xl sm:text-4xl'
          : Tag === 'h3'
            ? 'text-2xl'
            : 'text-xl'
      /*
        `uppercase` no es un capricho de diseño: Bebas Neue no tiene
        minusculas de verdad, las mapea a versalitas. Un subtitulo escrito
        "Un cambio de era" saldria con la U alta y el resto bajo, como si la
        tipografia estuviera rota. En mayusculas es la unica forma en que la
        familia se ve pareja.
      */
      return (
        <Tag
          key={key}
          className={`font-display text-ink mt-10 leading-tight tracking-wide uppercase ${tamano}`}
        >
          {renderNodos(node.content)}
        </Tag>
      )
    }

    case 'bulletList':
      return (
        <ul
          key={key}
          className="text-ink/85 marker:text-accent mt-5 list-disc space-y-2 pl-6 text-lg"
        >
          {renderNodos(node.content)}
        </ul>
      )

    case 'orderedList':
      return (
        <ol
          key={key}
          className="text-ink/85 marker:text-accent mt-5 list-decimal space-y-2 pl-6 text-lg"
        >
          {renderNodos(node.content)}
        </ol>
      )

    case 'listItem':
      return (
        <li key={key} className="leading-[1.7] [&>p]:mt-0">
          {renderNodos(node.content)}
        </li>
      )

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-accent text-ink/75 my-8 border-l-4 pl-5 italic [&>p]:mt-0"
        >
          {renderNodos(node.content)}
        </blockquote>
      )

    case 'codeBlock':
      return (
        <pre
          key={key}
          className="text-ink mt-6 overflow-x-auto rounded-xl bg-black/40 p-5 text-sm ring-1 ring-white/10"
        >
          <code>{renderNodos(node.content)}</code>
        </pre>
      )

    case 'horizontalRule':
      return <hr key={key} className="my-10 border-white/10" />

    case 'hardBreak':
      return <br key={key} />

    case 'image':
      return renderImagen(node, key)

    case 'doc':
      return <div key={key}>{renderNodos(node.content)}</div>

    default:
      return null
  }
}

export function ArticleContent({ content }: { content: Json }) {
  if (!esNodo(content)) return null
  const doc = content as TipTapNode

  if (!doc.content?.length) {
    return (
      <p className="text-ink/60 mt-6 text-lg italic">
        Esta nota todavía no tiene cuerpo cargado.
      </p>
    )
  }

  return (
    <div className="mt-8 [&>*:first-child]:mt-0">
      {renderNodos(doc.content)}
    </div>
  )
}
