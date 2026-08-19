import Image from 'next/image'

import { Marca } from '@/components/ui/Marca'
import { cn } from '@/lib/cn'

type ArticleCoverProps = {
  src: string | null
  alt: string | null
  /** Titulo del post. Solo se usa para construir un alt decente si falta. */
  title: string
  /**
   * `sizes` de next/image. Es obligatorio pasarlo bien: con `fill`, si el
   * navegador no sabe el ancho real termina bajando la variante mas grande
   * incluso para una tarjeta chica del feed.
   */
  sizes: string
  /**
   * Que la imagen empiece a bajar de inmediato, sin esperar al lazy-loading.
   *
   * Es para UNA imagen por pagina: la que va a ser el LCP. En la nota es la
   * portada; en la portada del sitio no es ninguna, porque el Hero ocupa toda
   * la pantalla y la nota destacada nace debajo del pliegue.
   *
   * No usa la prop `priority` de `next/image`: Next 16 la marco como obsoleta
   * justamente porque no se entendia que hacia. `loading="eager"` dice cuando
   * empieza a bajar y `fetchPriority="high"` dice con que prioridad, que son
   * dos cosas distintas y ahora se leen como lo que son.
   */
  prioritaria?: boolean
  className?: string
}

/**
 * Portada de una nota, con respaldo de marca cuando no hay imagen.
 *
 * El respaldo no es un placeholder gris: es la pelota sobre el fondo
 * editorial. Una nota sin portada sigue pareciendo del sitio en vez de parecer
 * rota.
 */
export function ArticleCover({
  src,
  alt,
  title,
  sizes,
  prioritaria = false,
  className,
}: ArticleCoverProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'bg-editorial flex items-center justify-center overflow-hidden',
          className
        )}
      >
        <Marca className="w-2/5 max-w-28 opacity-30" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      // Si quien publico no cargo un alt, el titulo es mejor que una cadena
      // vacia para quien navega con lector de pantalla.
      alt={alt ?? title}
      fill
      sizes={sizes}
      loading={prioritaria ? 'eager' : 'lazy'}
      fetchPriority={prioritaria ? 'high' : undefined}
      className={cn('object-cover', className)}
    />
  )
}
