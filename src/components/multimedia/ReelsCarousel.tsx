import { Carousel } from '@/components/ui/Carousel'
import type { ReelInstagram } from '@/lib/instagram'

import { ReelCard } from './ReelCard'

type ReelsCarouselProps = {
  items: readonly ReelInstagram[]
}

/**
 * Carrusel de Reels para la portada.
 *
 * Server Component: las tarjetas se arman en el servidor y entran al carrusel
 * como children, asi que lo unico que viaja al navegador es la logica de
 * movimiento y no el marcado de cada Reel.
 *
 * Ancho fijo por tarjeta y no una fraccion del viewport: el carrusel mide el
 * ancho de una copia de la lista para cerrar el loop, y una tarjeta que cambia
 * de ancho con el contenedor obligaria a remedir en cada paso.
 *
 * Con la lista vacia no dibuja nada. Es el caso normal mientras no llegue el
 * token de Instagram, y la portada tiene que verse entera igual.
 */
export function ReelsCarousel({ items }: ReelsCarouselProps) {
  if (items.length === 0) return null

  return (
    <Carousel etiqueta="Reels de Instagram">
      {items.map((item) => (
        <div key={item.id} className="w-40 sm:w-48 lg:w-56">
          {/*
            Los anchos del `sizes` son los mismos de la clase de arriba, en
            pixeles y no en `vw`, porque aca la tarjeta no se estira con el
            viewport. Con un `sizes` en `vw` el navegador elige del `srcset`
            variantes enormes para dibujar 224px, y esas texturas son las que
            hacen pesado el desplazamiento.
          */}
          <ReelCard
            item={item}
            sizes="(min-width: 1024px) 224px, (min-width: 640px) 192px, 160px"
          />
        </div>
      ))}
    </Carousel>
  )
}
