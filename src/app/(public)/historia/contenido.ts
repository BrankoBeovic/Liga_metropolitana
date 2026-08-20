/**
 * TEXTO PROVISORIO DE /historia.
 *
 * ============================================================================
 * TODO LO QUE SIGUE ES RELLENO. No es informacion de la Liga Metropolitana.
 * ============================================================================
 *
 * Esta pagina se maqueto antes de tener el texto real, por pedido explicito del
 * equipo. Todo el contenido vive en este archivo y NADA de el esta escrito en
 * el JSX: reemplazar el relleno por la historia de verdad es editar acá y nada
 * mas, sin tocar el layout.
 *
 * Mientras esto sea lorem ipsum, la pagina esta marcada como `noindex` y NO
 * aparece en el sitemap. Un sitio con una pagina de relleno indexada le dice a
 * Google que el contenido es de baja calidad, y esa señal cuesta mas de
 * remontar de lo que cuesta esperar el texto.
 *
 * **Al cargar el texto real hay que hacer las tres cosas**: reemplazar esto,
 * sacar el `robots: { index: false }` de `page.tsx`, y agregar `/historia` a
 * `src/app/sitemap.ts`. Estan anotadas en los tres lugares.
 */

/** Cambiar a `false` cuando el texto sea el de verdad. */
export const ES_RELLENO = true

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
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio praesent libero sed cursus ante dapibus diam, desde 1989.'

/**
 * El resumen que se muestra en el bloque "Legado" de la portada.
 *
 * Vive en este archivo y no al lado del componente para que TODO el texto de
 * historia -el largo y el corto- se reemplace en un solo lugar el dia que
 * llegue el de verdad.
 */
export const RESUMEN = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.',
  'Maecenas ligula massa, varius a, semper congue, euismod non mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.',
] as const

export const INTRO = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
  'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor.',
] as const

export type Hito = {
  anio: string
  titulo: string
  texto: string
}

export const HITOS: readonly Hito[] = [
  {
    anio: '1989',
    titulo: 'Lorem ipsum dolor',
    texto:
      'Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales.',
  },
  {
    anio: '1997',
    titulo: 'Consectetur adipiscing',
    texto:
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum.',
  },
  {
    anio: '2006',
    titulo: 'Integer nec odio',
    texto:
      'Maecenas adipiscing ante non diam sodales hendrerit. Ut velit mauris, egestas sed, gravida nec, ornare ut, mi. Aenean ut orci vel massa suscipit pulvinar.',
  },
  {
    anio: '2014',
    titulo: 'Praesent libero',
    texto:
      'Nulla sollicitudin. Fusce varius, ligula non tempus aliquam, nunc turpis ullamcorper nibh, in tempus sapien eros vitae ligula. Pellentesque rhoncus nunc.',
  },
  {
    anio: '2026',
    titulo: 'Sed cursus ante',
    texto:
      'Vivamus a tellus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede.',
  },
]

export const CIERRE = {
  titulo: 'Lorem ipsum dolor sit',
  texto:
    'Donec vitae dolor. Nullam tristique diam non turpis. Cras placerat accumsan nulla. Nullam rutrum. Nam vestibulum accumsan nisl. Pellentesque dapibus suscipit ligula donec posuere augue in quam.',
} as const
