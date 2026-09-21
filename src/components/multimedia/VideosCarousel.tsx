import { Carousel } from '@/components/ui/Carousel'
import type { VideoYoutube } from '@/lib/youtube'

import { VideoCard } from './VideoCard'

type VideosCarouselProps = {
  videos: readonly VideoYoutube[]
}

/**
 * Carrusel de videos del canal de YouTube, para la portada.
 *
 * Mismo planteo que `ReelsCarousel` pero con tarjetas 16:9. Con la lista
 * vacia no dibuja nada: puede pasar si el feed de YouTube falla las cuatro
 * veces que reintenta `getVideosYoutube`, y la portada tiene que verse
 * entera igual.
 */
export function VideosCarousel({ videos }: VideosCarouselProps) {
  if (videos.length === 0) return null

  return (
    <Carousel etiqueta="Videos del canal de YouTube">
      {videos.map((video) => (
        <div key={video.id} className="w-64 sm:w-80 lg:w-[28rem]">
          {/* En pixeles y no en `vw`: aca la tarjeta tiene ancho fijo. */}
          <VideoCard
            video={video}
            sizes="(min-width: 1024px) 448px, (min-width: 640px) 320px, 256px"
          />
        </div>
      ))}
    </Carousel>
  )
}
