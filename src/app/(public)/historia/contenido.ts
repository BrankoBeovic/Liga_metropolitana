/**
 * Texto de /historia.
 *
 * La fuente es el documento que entregó el equipo ("Historia Liga
 * Metropolitana de Maxibásquetbol"), redactado con motivo de los 37 años de
 * la Liga (2026). Todo el contenido vive en este archivo y nada de el esta
 * escrito en el JSX: la proxima actualizacion de la historia se edita aca y
 * nada mas, sin tocar el layout.
 */

export const ES_RELLENO = false

/**
 * El acta de la primera reunión, y **lo único de esta página que NO es
 * relleno**.
 *
 * La entregó el equipo: es la foto de la primera hoja del libro de actas, del
 * 16 de mayo de 1989, donde ocho instituciones acordaron organizar el
 * campeonato que dio origen a la Liga. Se muestra al costado de la línea de
 * tiempo.
 *
 * Que sea contenido real no cambia `ES_RELLENO`: la página sigue con `noindex`
 * mientras el texto que la rodea sea lorem ipsum. Una foto verdadera adentro de
 * una página de relleno sigue siendo una página de relleno.
 *
 * El `alt` describe qué es el documento, no lo que dice. El texto es manuscrito
 * y no hay transcripción todavía; cuando la haya, el lugar donde ponerla es
 * acá, y conviene que sea el texto de verdad y no un resumen.
 *
 * Las medidas son las del archivo, leídas con `ffprobe` y no del nombre del
 * archivo, que decía otra cosa. Si se reemplaza la foto hay que actualizarlas:
 * `next/image` las usa para reservar el espacio antes de que la imagen baje.
 */
export const ACTA = {
  src: '/acta-1989.jpg',
  ancho: 752,
  alto: 1114,
  alt: 'Primera hoja del acta de la Liga, manuscrita, con fecha 16 de mayo de 1989 en Santiago y la lista de las instituciones fundadoras y sus delegados.',
  epigrafe: 'Acta N° 1, 16 de mayo de 1989.',
  detalle:
    'La reunión en la sede de Unión Española donde ocho instituciones acordaron formar la Liga y organizar el campeonato.',
  enlace: 'Ver el acta completa',
} as const

export const BAJADA =
  'Desde el 16 de mayo de 1989, treinta y siete años de básquetbol, comunidad y evolución.'

/**
 * El resumen que se muestra en el bloque "Legado" de la portada.
 *
 * Vive en este archivo y no al lado del componente para que TODO el texto de
 * historia -el largo y el corto- se reemplace en un solo lugar el dia que
 * llegue el de verdad.
 */
export const RESUMEN = [
  'El 16 de mayo de 1989, en la sede de Unión Española, ocho instituciones -Estadio Español de Las Condes, Estadio Italiano, Estadio Israelita-Macabbi, Unión Española, Club Internacional, Banco Central, Universidad de Chile y YMCA- fundaron la Liga Metropolitana de Maxibásquetbol. Desde entonces, generaciones de jugadores, dirigentes, entrenadores y árbitros han mantenido vivo un mismo principio: el básquetbol puede acompañar a las personas durante toda la vida.',
  'Hoy la Liga reúne a más de cincuenta equipos y varios cientos de jugadores, y en 2023 fue distinguida como Sports League of the Year en los South America Prestige Awards. Pero su patrimonio más grande sigue siendo el mismo de siempre: la comunidad que se forma cada vez que alguien vuelve a entrar a una cancha.',
] as const

export const INTRO = [
  'El 16 de mayo de 1989, en la sede del Club Unión Española, nació la Liga Metropolitana de Maxibásquetbol. La fundaron ocho instituciones -Estadio Español de Las Condes, Estadio Italiano, Estadio Israelita-Macabbi, Unión Española, Club Internacional, Banco Central, Universidad de Chile y YMCA- que buscaban un espacio para que los basquetbolistas siguieran jugando de manera organizada y competitiva. Desde aquella primera temporada han pasado generaciones completas de jugadores, dirigentes, entrenadores, árbitros y clubes, y sigue intacta la misma pasión por volver a entrar a una cancha.',
  'Los primeros treinta años, bajo la presidencia de Noé Méndez, se construyeron las bases: continuidad, pertenencia y una relación profunda entre jugadores e instituciones. Desde 2019, con la llegada de una nueva directiva, la Liga entró en un proceso de modernización, tecnología y profesionalización que en 2023 la llevó a ser distinguida internacionalmente como la mejor liga del año. Esta es la línea de tiempo de esas casi cuatro décadas.',
] as const

export type Hito = {
  anio: string
  titulo: string
  texto: string
}

export const HITOS: readonly Hito[] = [
  {
    anio: '1989',
    titulo: 'Nace la Liga Metropolitana',
    texto:
      'Ocho instituciones fundan la Liga en la sede de Unión Española: Estadio Español de Las Condes, Estadio Italiano, Estadio Israelita-Macabbi, Unión Española, Club Internacional, Banco Central, Universidad de Chile y YMCA. La competencia arranca con unos 10 a 12 equipos, concentrada en clubes y estadios de colonia de la zona oriente de Santiago.',
  },
  {
    anio: '1989 - 2019',
    titulo: 'Treinta años de Noé Méndez',
    texto:
      'El primer presidente de la Liga conduce la institución durante tres décadas, en las que se construyen sus bases: continuidad, pertenencia y una relación profunda entre jugadores e instituciones. En ese mismo período participa también en la creación de FECHIMAX, la federación nacional del maxibásquetbol.',
  },
  {
    anio: '2019',
    titulo: 'Una nueva etapa',
    texto:
      'Con la llegada de una nueva directiva encabezada por Rodrigo Gajardo Zavala, comienza un proceso de crecimiento, modernización y profesionalización. La Liga incorpora las planillas digitales de NBN23 -pionera en Latinoamérica, según los South America Prestige Awards- y amplía sus categorías hasta reunir más de 50 equipos y varios cientos de jugadores.',
  },
  {
    anio: '2023',
    titulo: 'Sports League of the Year',
    texto:
      'Los South America Prestige Awards distinguen a la Liga Metropolitana como la mejor liga del año, destacando la modernización de su gestión, la incorporación de tecnología y el crecimiento de sus comunicaciones y transmisiones. La publicación la describe además como la liga de maxibásquetbol más antigua de Chile.',
  },
  {
    anio: '2026',
    titulo: 'Treinta y siete años y sigue',
    texto:
      'La Metro sigue creciendo: nuevas competencias, más jugadores y jugadoras, y una organización que se fortalece sin perder lo que la trajo hasta acá. Cada nueva temporada, cada nuevo equipo y cada jugador que vuelve a entrar a una cancha empieza a escribir un nuevo capítulo de esta historia.',
  },
]

/**
 * El bloque que cierra la pagina, y **tampoco es relleno**.
 *
 * Lo que dice es lo que la Liga de verdad ofrece hoy, en la misma voz que la
 * seccion de jugadores de la portada: quien no tiene club deja sus datos y la
 * Liga lo contacta. Nada de esto depende de la historia que falta escribir, asi
 * que no habia razon para dejarlo en lorem ipsum.
 *
 * El rotulo del boton vive aca y no en el JSX por la misma regla que el resto
 * del archivo: el texto de esta pagina se cambia en un solo lugar.
 */
export const CIERRE = {
  titulo: 'Juega con nosotros',
  texto:
    'Esta historia la escribieron los que estuvieron en la cancha, y sigue abierta. Si quieres jugar y no tienes club, déjanos tus datos: la Liga te contacta cuando un equipo esté buscando gente en tu puesto.',
  // No repite el "déjanos tus datos" del párrafo: un botón que dice lo mismo
  // que la línea de arriba se lee como un eco y no como una acción.
  boton: 'Quiero jugar',
} as const
