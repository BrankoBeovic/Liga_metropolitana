import { cn } from '@/lib/cn'

type MarcaProps = {
  className?: string
  /** Dibuja la teja oscura detras de la pelota, como en el favicon. */
  conTeja?: boolean
}

/**
 * El isotipo: la pelota dorada del escudo.
 *
 * El escudo completo ("LIGA METROPOLITANA 1989 MAXI BASQUETBOL") es un
 * lockup ancho y con mucho detalle: a 40px de alto sus letras miden cuatro
 * pixeles y se vuelven ruido. Para los tamaños chicos hace falta una marca
 * reducida, y la unica pieza del escudo que sobrevive a 16px es la pelota.
 *
 * Va en SVG y no como archivo de imagen por tres razones concretas: no cuesta
 * una peticion, es nitida en cualquier tamaño y hereda el color del texto
 * cuando hace falta apagarla (los estados vacios la usan al 25%).
 *
 * **Es la misma geometria que `src/app/icon.png` y `src/app/apple-icon.png`**,
 * en un lienzo de 64 unidades: teja de radio 14, pelota de radio 21 centrada, y
 * dos costuras rectas de 2.6 de grosor. Si se cambia una, hay que rehacer las
 * otras dos o el favicon deja de ser el mismo dibujo que el sitio.
 *
 * Las costuras curvas del dibujo original quedaron afuera a proposito: medidas
 * a 32px se leian como los meridianos de un globo terraqueo y no como una
 * pelota. La pelota partida en cuatro por dos costuras rectas sobrevive al
 * tamaño de una pestaña.
 */
export function Marca({ className, conTeja = false }: MarcaProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <defs>
        {/*
          El id lleva prefijo porque un documento puede tener varias marcas y
          los ids de SVG son globales a la pagina. Con un id repetido, todas
          las copias resuelven al primer degradado, que es el mismo dibujo, asi
          que no se nota; el dia que haya dos variantes, si.
        */}
        <linearGradient id="marca-oro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E5B84B" />
          <stop offset="0.5" stopColor="#D4A03D" />
          <stop offset="1" stopColor="#A67A2A" />
        </linearGradient>
      </defs>

      {conTeja ? <rect width="64" height="64" rx="14" fill="#0B0C0E" /> : null}

      <circle cx="32" cy="32" r="21" fill="url(#marca-oro)" />

      {/*
        Las costuras se pintan del color del fondo del sitio y no en negro:
        sobre el canvas oscuro tienen que leerse como cortes en la pelota, no
        como lineas dibujadas encima.
      */}
      <path
        d="M32 11V53M11 32H53"
        stroke="#0B0C0E"
        strokeWidth="2.6"
        strokeLinecap="butt"
      />
    </svg>
  )
}
