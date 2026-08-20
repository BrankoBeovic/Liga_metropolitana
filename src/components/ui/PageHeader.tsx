import Image from 'next/image'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type PageHeaderProps = {
  titulo: string
  /** Segunda parte del titulo, en el dorado. Opcional. */
  acento?: string
  bajada?: string
  /** Botones o enlaces al pie del encabezado. */
  children?: ReactNode
  className?: string
}

/**
 * Encabezado de una pagina interior.
 *
 * Lo comparten Noticias, Historia, Documentos, Inscribete y Contacto para que
 * las cinco arranquen con el mismo ritmo: un `h1` en display, una regla dorada,
 * la bajada en ancho de lectura y el escudo al costado.
 *
 * **El escudo es decorativo y por eso va con `alt=""` y `aria-hidden`.** No
 * aporta informacion que no este ya en el `h1` de la pagina y en el footer, que
 * si lo lleva con su nombre. Anunciarlo en cada pagina interior seria repetir
 * "Liga Metropolitana" antes de cada titulo.
 *
 * **Se dibuja a 300px como maximo, y el numero sale del archivo.** El escudo
 * recortado que entrego el equipo mide 439px de ancho: a 300 se ve nitido en
 * una pantalla normal y apenas estirado en una de densidad doble. Pedirle mas
 * ancho lo empieza a ablandar de verdad. Si algun dia llega un export mas
 * grande, este numero puede subir con el.
 *
 * Solo desde `lg`. Abajo de eso la columna de texto necesita todo el ancho, y
 * el escudo apilado arriba del titulo empujaria la bajada fuera de la primera
 * pantalla.
 *
 * **El `mr-28` lo separa del borde derecho a pedido del equipo.** Pegado al
 * margen del contenedor quedaba demasiado al filo de la pantalla; corrido 112px
 * hacia adentro respira y deja de competir con el borde. Va como margen y no
 * como `translate` justamente para que el grid lo tenga en cuenta: asi el
 * espacio se le descuenta a la columna del texto y el escudo nunca puede
 * terminar encima del titulo en una ventana angosta.
 *
 * **Sin animacion de entrada.** Es el primer bloque de la pagina y por lo tanto
 * el candidato natural a LCP en las paginas sin foto grande. Un `opacity: 0`
 * inicial corre esa medicion, que es justo lo que CLAUDE.md pide cuidar en el
 * Hero y vale igual aca.
 */
export function PageHeader({
  titulo,
  acento,
  bajada,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16',
        className
      )}
    >
      <div className="max-w-3xl">
        <h1 className="font-display text-ink text-5xl leading-[1.05] tracking-wide text-balance uppercase sm:text-7xl">
          {titulo}
          {acento ? <span className="text-accent"> {acento}</span> : null}
        </h1>

        {/* La regla dorada no es decorado suelto: es lo que separa el titulo de
            la bajada sin meter otro tamaño de tipografia en el medio. */}
        <div aria-hidden className="bg-accent mt-5 h-1 w-16 rounded-full" />

        {bajada ? (
          <p className="text-ink/75 mt-5 text-lg leading-relaxed text-pretty">
            {bajada}
          </p>
        ) : null}

        {children ? <div className="mt-6">{children}</div> : null}
      </div>

      <Image
        src="/escudo.png"
        alt=""
        aria-hidden
        width={439}
        height={278}
        sizes="300px"
        className="hidden w-[300px] justify-self-end lg:mr-28 lg:block"
      />
    </header>
  )
}
