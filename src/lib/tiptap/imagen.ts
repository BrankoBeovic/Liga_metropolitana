import Image from '@tiptap/extension-image'

/**
 * El nodo `image` de TipTap, con los datos que una foto de prensa necesita.
 *
 * El nodo que viene de fabrica tiene `src`, `alt`, `title`, `width` y `height`.
 * Faltaban tres cosas:
 *
 * - `caption`, el epigrafe. El nodo base ofrece `title`, que el navegador
 *   dibuja como tooltip al pasar el mouse. Un epigrafe escondido detras de un
 *   hover no es un epigrafe: no se ve en tactil, no se lee en voz alta y no se
 *   imprime. Se guarda aparte y se dibuja siempre.
 * - `credit`, el credito de la foto, separado del epigrafe y no metido dentro
 *   con un guion. Son dos cosas distintas: el epigrafe dice que se ve, el
 *   credito dice de quien es. Tiene que poder haber credito sin epigrafe, que
 *   es el caso mas frecuente en una foto de agencia.
 * - `decorative`, para las imagenes que no aportan informacion. Es la unica
 *   forma honesta de tener un `alt` vacio: sin la casilla, un `alt` en blanco
 *   es indistinguible de un `alt` que alguien olvido escribir.
 *
 * Todos los atributos son opcionales y con valor por defecto, asi que las notas
 * escritas antes de esto siguen abriendo sin romperse: les faltan los
 * atributos, y ProseMirror los completa con el default al parsear el documento.
 *
 * `width` y `height` no son decorativos ni un capricho del editor: son lo que
 * deja reservar el espacio exacto antes de que la imagen baje. Sin ellos el
 * renderizador tendria que asumir una proporcion, que es exactamente lo que se
 * decidio dejar de hacer.
 */

/** Los atributos propios, tal cual viajan en el JSON del documento. */
export type AtributosImagen = {
  src: string
  alt: string | null
  caption: string | null
  credit: string | null
  width: number | null
  height: number | null
  decorative: boolean
}

/**
 * Un atributo que existe solo en el JSON, no en el HTML del editor.
 *
 * `renderHTML: () => ({})` es lo que evita que `caption`, `credit` y
 * `decorative` terminen como atributos sueltos de un `<img>` dentro del
 * contenedor editable. El dato igual se guarda: el JSON sale de ProseMirror y
 * no del DOM.
 *
 * `parseHTML` lee el `data-*` correspondiente para que copiar y pegar una
 * imagen dentro del mismo editor no le pierda el epigrafe por el camino: ese
 * viaje si pasa por HTML.
 */
function soloEnElJson(nombre: string) {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute(`data-${nombre}`),
    renderHTML: () => ({}),
  }
}

export const ImagenDeCuerpo = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      caption: soloEnElJson('caption'),
      credit: soloEnElJson('credit'),

      decorative: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-decorative') === 'true',
        renderHTML: () => ({}),
      },

      /*
        `width` y `height` se guardan como numero, no como la cadena que sale
        del DOM. Si quedaran como cadena, el renderizador tendria que parsear y
        `next/image` recibiria un string donde espera un numero.

        El `renderHTML` si los emite: dentro del editor sirven para que la
        imagen ocupe su lugar mientras carga, igual que en el sitio.
      */
      width: dimension('width'),
      height: dimension('height'),
    }
  },
})

function dimension(nombre: 'width' | 'height') {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => {
      const crudo = element.getAttribute(nombre)
      if (!crudo) return null
      const valor = Number.parseInt(crudo, 10)
      return Number.isFinite(valor) && valor > 0 ? valor : null
    },
    renderHTML: (attrs: Record<string, unknown>) => {
      const valor = attrs[nombre]
      return typeof valor === 'number' ? { [nombre]: String(valor) } : {}
    },
  }
}
