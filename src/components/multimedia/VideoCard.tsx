import { Play } from 'lucide-react'
import Image from 'next/image'

import { PROPS_PAUSA } from '@/lib/carousel'
import { formatearFecha } from '@/lib/format'
import type { VideoYoutube } from '@/lib/youtube'

/** `sizes` por defecto, para una tarjeta que se estira con el viewport. */
const SIZES_FLUIDO = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

type VideoCardProps = {
  video: VideoYoutube
  sizes?: string
}

/**
 * Tarjeta de un video de YouTube.
 *
 * Marco 16:9 y titulo debajo, misma estructura que `ReelCard` pero con la
 * proporcion del formato horizontal y sin el segundo recorte interno: al
 * reves que el 9:16 de Reels, aca la franja del titulo va fuera del marco
 * recortado y no hay hover-zoom que se derrame sobre ella.
 *
 * La miniatura de YouTube viene en 480x360 con el video 16:9 centrado entre
 * dos barras negras; `object-cover` sobre un marco 16:9 recorta exactamente
 * esas barras.
 */
export function VideoCard({ video, sizes = SIZES_FLUIDO }: VideoCardProps) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group focus-visible:ring-accent block overflow-hidden rounded-[22px] bg-black ring-1 ring-white/10 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes={sizes}
          draggable={false}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent to-60%"
        />

        <div className="absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2">
          <span className="font-display bg-accent text-canvas rounded-full px-2.5 py-1.5 text-[11px] tracking-[0.16em] uppercase">
            {video.esShort ? 'Short' : 'Video'}
          </span>
          {/*
            El play es lo unico que detiene el carrusel al pasarle el mouse,
            igual que en ReelCard. Sigue dentro del enlace, asi que tambien
            abre el video.
          */}
          <span
            aria-hidden
            {...PROPS_PAUSA}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/50 ring-1 ring-white/30 transition-colors group-hover:bg-black/75"
          >
            <Play className="size-4 fill-white text-white" />
          </span>
        </div>
      </div>

      <div className="bg-editorial border-t border-white/10 px-3.5 py-3">
        <p className="font-display text-ink line-clamp-2 h-[calc(2lh)] text-[13px] leading-snug font-bold">
          {video.title}
        </p>
        <p className="text-ink/50 mt-1.5 text-[11px]">
          {formatearFecha(video.publishedAt)}
          {video.views !== null
            ? ` · ${video.views.toLocaleString('es-CL')} vistas`
            : ''}
        </p>
      </div>

      <span className="sr-only">
        (se abre en YouTube, en una pestaña nueva)
      </span>
    </a>
  )
}
