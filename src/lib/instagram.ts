import 'server-only'

/**
 * Cuantos Reels entran en el carrusel de la portada.
 *
 * Ocho y no cinco: el carrusel gira en loop, y con cinco tarjetas 9:16 en una
 * pantalla grande se ven casi todas a la vez, con lo cual el giro se percibe
 * como un temblor en vez de un recorrido.
 */
export const REELS_EN_PORTADA = 8

export type ReelInstagram = {
  id: string
  /** Primera linea del texto del Reel. Instagram no tiene campo de titulo. */
  title: string
  /** Enlace estable al Reel. Es a donde lleva el clic. */
  permalink: string
  thumbnailUrl: string
  publishedAt: string
}

/**
 * Los Reels de la cuenta, leidos en vivo de la API de Instagram.
 *
 * Se piden al generar la pagina, se cachean y no hay base de datos en el
 * medio. Publicar en Instagram alcanza para que aparezca en el sitio.
 *
 * Esto **si necesita credencial**: la API de Instagram no tiene un feed
 * publico. El token sale de `INSTAGRAM_ACCESS_TOKEN`, dura 60 dias y hay que
 * renovarlo antes de que venza. Si vence no se puede refrescar y hay que
 * rehacer la autorizacion desde cero.
 */
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

/**
 * Cuantos elementos pedirle a la API.
 *
 * Mas de los que se van a mostrar, porque `me/media` devuelve todo mezclado
 * (fotos del feed, carruseles, Reels) y recien despues se filtra. Con 25 hay
 * margen de sobra para juntar ocho Reels aunque haya rachas de fotos.
 */
const A_PEDIR = 25

/**
 * Cada cuanto se le vuelve a preguntar a Instagram.
 *
 * Quince minutos, y la razon no es la frescura del contenido sino la de las
 * URLs: las miniaturas de Instagram vienen firmadas y caducan. Cada consulta
 * trae firmas nuevas, asi que preguntar mas seguido achica la ventana en la
 * que una pagina cacheada apunta a una firma vencida.
 */
const REVALIDAR_SEGUNDOS = 900

const CAMPOS = [
  'id',
  'caption',
  'media_product_type',
  'permalink',
  'thumbnail_url',
  'timestamp',
].join(',')

/**
 * Tope del titulo derivado.
 *
 * Treinta y cuatro, medido con los titulos reales y no estimado: es el mayor
 * valor con el que todos entran en dos lineas en la tarjeta mas angosta en la
 * que se dibujan, la del carrusel a 160px de ancho (`w-40`).
 *
 * **Contar caracteres subestima el ancho real.** Un emoji de bandera son cuatro
 * unidades de JavaScript pero se dibuja como un glifo ancho, y una palabra
 * larga puede dejar media linea vacia al cortar. Por eso el numero salio de
 * medir y no de una cuenta: con 36 ya habia un titulo que se iba a tres lineas.
 *
 * **El recorte va aca y no solo en CSS a proposito.** `line-clamp-2` limita el
 * alto de la caja pero NO trunca el texto: la tercera linea queda cortada por
 * la mitad en vez de terminar en puntos suspensivos. Con los titulos escritos a
 * mano nunca se noto porque eran cortos; los que salen de un `caption` de
 * Instagram llegan a 92 caracteres y ocupaban cinco lineas.
 */
const MAX_TITULO = 34

/**
 * Titulo a partir del texto del Reel.
 *
 * Instagram no tiene campo de titulo: tiene `caption`, que suele ser un texto
 * largo con saltos de linea, hashtags y emojis. La primera linea funciona como
 * titular en la practica.
 *
 * Un Reel sin texto es raro pero posible, y la tarjeta necesita algo que
 * mostrar y algo que leerle a un lector de pantalla.
 */
function tituloDesde(caption: string | undefined): string {
  const primeraLinea = (caption ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)

  if (!primeraLinea) return 'Reel de la Liga Metropolitana'
  if (primeraLinea.length <= MAX_TITULO) return primeraLinea

  // Se corta en el ultimo espacio para no partir una palabra al medio. Si no
  // hay ninguno (una palabra larguisima, o texto sin espacios), se corta seco:
  // peor que una palabra partida es una linea que desborda.
  const recorte = primeraLinea.slice(0, MAX_TITULO)
  const ultimoEspacio = recorte.lastIndexOf(' ')
  const base =
    ultimoEspacio > MAX_TITULO / 2 ? recorte.slice(0, ultimoEspacio) : recorte

  return `${base.trimEnd()}...`
}

type MediaCrudo = {
  id?: string
  caption?: string
  media_product_type?: string
  permalink?: string
  thumbnail_url?: string
  timestamp?: string
}

/**
 * Los ultimos Reels de la cuenta, del mas reciente al mas viejo.
 *
 * Ante cualquier problema devuelve una lista vacia, igual que
 * `getCategories`: que Instagram este caido, o que el token haya vencido, no
 * deberia tirar abajo la portada. La seccion simplemente no se dibuja.
 *
 * Ese silencio es comodo para el lector y peligroso para el equipo, asi que el
 * fallo se registra con detalle: es la unica señal de que el token vencio.
 */
export async function getReelsInstagram(
  limite: number
): Promise<ReelInstagram[]> {
  /*
    Interruptor de contenido de prueba, para poder mirar el carrusel sin token.

    Las dos condiciones hacen falta. `REELS_DEMO` es la que se enciende a mano
    en `.env.local`; el chequeo de `NODE_ENV` es el que garantiza que esto no
    pueda pasar a produccion por una variable mal puesta en el panel del
    hosting. Un carrusel de contenido inventado en el sitio publicado seria
    bastante peor que no tener carrusel.

    El import es dinamico para que el modulo de muestra no entre en el camino
    normal del servidor.
  */
  if (process.env.NODE_ENV !== 'production' && process.env.REELS_DEMO === '1') {
    const { reelsDeMuestra } = await import('./instagram.demo')
    return reelsDeMuestra(limite)
  }

  if (!TOKEN) {
    console.error(
      'Falta INSTAGRAM_ACCESS_TOKEN: la seccion de Reels no se va a dibujar.'
    )
    return []
  }

  const url =
    `https://graph.instagram.com/v23.0/me/media` +
    `?fields=${CAMPOS}&limit=${A_PEDIR}&access_token=${TOKEN}`

  let payload: { data?: MediaCrudo[] }

  try {
    const respuesta = await fetch(url, {
      next: { revalidate: REVALIDAR_SEGUNDOS },
    })

    if (!respuesta.ok) {
      // El cuerpo trae el motivo real de Meta, que casi siempre es el token.
      const detalle = await respuesta.text()
      console.error(
        `Instagram respondio ${respuesta.status}. ¿Venció el token? ${detalle}`
      )
      return []
    }

    payload = (await respuesta.json()) as { data?: MediaCrudo[] }
  } catch (error) {
    console.error('No se pudo leer la API de Instagram:', error)
    return []
  }

  return (payload.data ?? [])
    .filter((m) => m.media_product_type === 'REELS')
    .flatMap((m): ReelInstagram[] => {
      // Sin miniatura no hay tarjeta que dibujar, y sin enlace no hay a donde
      // ir. Se descarta entero antes que entrar a medias.
      if (!m.id || !m.permalink || !m.thumbnail_url) return []

      return [
        {
          id: m.id,
          title: tituloDesde(m.caption),
          permalink: m.permalink,
          thumbnailUrl: m.thumbnail_url,
          publishedAt: m.timestamp ?? '',
        },
      ]
    })
    .slice(0, limite)
}
