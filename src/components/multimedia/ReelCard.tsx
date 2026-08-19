import { Play } from 'lucide-react'
import Image from 'next/image'

import { PROPS_PAUSA } from '@/lib/carousel'
import type { ReelInstagram } from '@/lib/instagram'

/**
 * `sizes` por defecto, para una tarjeta que se estira con el viewport. El
 * carrusel pasa los suyos, que son fijos.
 */
const SIZES_FLUIDO = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'

type ReelCardProps = {
  item: ReelInstagram
  /**
   * Cuanto va a medir la tarjeta, para que `next/image` pida el tamaño justo.
   *
   * No es un detalle de afinado: con el valor equivocado el navegador elige del
   * `srcset` la variante de 3840px para dibujar 224, o sea una textura catorce
   * veces mas grande de lo necesario, multiplicada por las tres copias que el
   * carrusel repite. Eso es lo que hace pesado el desplazamiento.
   */
  sizes?: string
}

/**
 * Tarjeta de un Reel: marco 9:16 y barra con el titulo debajo.
 *
 * El titulo va afuera del marco y no encima de la imagen. Sobre la miniatura el
 * texto depende de que la foto tenga una zona oscura donde apoyarse; abajo se
 * lee siempre igual.
 *
 * **El titulo va en la tipografia de cuerpo y no en la display**, al reves que
 * el resto de las tarjetas del sitio. Sale de un `caption` de Instagram, o sea
 * texto que escribio alguien y no un titular compuesto: Bebas Neue obligaria a
 * ponerlo en mayusculas -no tiene minusculas de verdad- y eso convierte
 * cualquier pie de Reel en un grito.
 *
 * La miniatura viene firmada por Instagram y caduca, pero el lector nunca le
 * pega a Meta: `next/image` la descarga en el servidor y la sirve desde nuestra
 * cache, que dura 31 dias por `minimumCacheTTL` en `next.config.mjs`.
 *
 * El clic abre el `permalink`, que a diferencia de la miniatura es estable.
 */
export function ReelCard({ item, sizes = SIZES_FLUIDO }: ReelCardProps) {
  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group focus-visible:ring-accent block overflow-hidden rounded-[22px] bg-black ring-1 ring-white/10 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="relative aspect-[9/16] w-full">
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes={sizes}
          // Sin esto, arrastrar el carrusel desde una tarjeta levanta la
          // miniatura con el arrastre nativo del navegador en vez de correr el
          // riel.
          draggable={false}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent to-60%"
        />

        <div className="absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2">
          <span className="font-display bg-accent text-canvas rounded-full px-2.5 py-1.5 text-[11px] tracking-[0.16em] uppercase">
            Reel
          </span>
          {/*
            El play es lo unico que detiene el carrusel al pasarle el mouse.
            Sigue dentro del enlace, asi que tambien abre el Reel: es el boton
            visible de la tarjeta, no un adorno.

            Sin `backdrop-blur`, a diferencia del resto de las superficies de
            vidrio del sitio. Desenfocar el fondo obliga al navegador a leer lo
            que hay detras y recalcularlo, y en un carrusel ese fondo cambia en
            cada frame: serian cuarenta filtros vivos moviendose a la vez. Sobre
            una foto, un negro semitransparente da el mismo contraste al icono
            por una fraccion del costo.
          */}
          <span
            aria-hidden
            {...PROPS_PAUSA}
            className="flex size-9 items-center justify-center rounded-full bg-black/50 ring-1 ring-white/30 transition-colors group-hover:bg-black/70"
          >
            <Play className="size-4 fill-white text-white" />
          </span>
        </div>
      </div>

      {/*
        Alto fijo de dos lineas, no minimo.

        Reservar el alto de dos aunque el titulo entre en una es lo que mantiene
        parejas las tarjetas del carrusel. Que ademas sea fijo y no minimo es lo
        que hace que un titulo mas largo se corte limpio: con `min-h` la caja
        crece unos pixeles y deja asomar media tercera linea, que se ve peor que
        un corte.

        `line-clamp-2` queda como red, pero no alcanza solo: en Chromium recorta
        la caja sin truncar el texto, asi que el largo de verdad se limita al
        derivar el titulo en `lib/instagram.ts`.

        El `calc` suma las dos lineas mas el `py-3`, porque con `border-box` la
        altura incluye el relleno: `2lh` a secas reserva menos que una linea de
        texto y no cambia nada.
      */}
      <p className="bg-editorial text-ink line-clamp-2 h-[calc(2lh+1.5rem)] border-t border-white/10 px-3.5 py-3 text-[13px] leading-snug font-semibold">
        {item.title}
      </p>

      <span className="sr-only">
        (se abre en Instagram, en una pestaña nueva)
      </span>
    </a>
  )
}
