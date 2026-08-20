'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { NAV_LINKS } from '@/lib/navigation'

/**
 * El menú del sitio: una píldora que crece hacia la izquierda desde un botón
 * redondo.
 *
 * Plegada es un círculo de 44px; al pasarle el mouse se despliega en horizontal
 * y muestra las secciones a su izquierda. Es una sola píldora de vidrio que
 * cambia de ancho, no un panel que aparece encima: el botón es el extremo
 * derecho de la misma superficie.
 *
 * **Solo desde `lg`.** Desplegada mide 736px, y a 768px de pantalla el header
 * deja 704px útiles: medido a 360px, los seis enlaces se dibujaban entre x=290
 * y x=970, o sea los seis fuera de la pantalla. Debajo de `lg` el menú es
 * `MenuLateral`, un panel que entra desde el costado.
 *
 * **El ancho se anima con `max-width`, y no con el truco de
 * `grid-template-columns: 0fr -> 1fr`.** Aquel es el camino habitual para
 * desplegables y acá NO funciona: se probó y la pista resolvía a `0px` con el
 * menú abierto. El motivo es que el hijo lleva `overflow-hidden`, lo que deja su
 * aporte mínimo en cero, y como la píldora se dimensiona por su contenido no hay
 * espacio libre contra el cual resolver el `1fr`. El truco funciona en vertical
 * porque ahí la altura del contenedor sí es automática.
 *
 * `max-width` no tiene ese problema: va de `0` a un tope, y el ancho visible es
 * el del contenido -680px medidos con los seis rótulos actuales- porque queda
 * por debajo del tope. **El tope de 48rem tiene que quedar por encima del ancho
 * real**: si algún día los rótulos suman más que eso, los últimos se recortan.
 *
 * **Abre con hover, pero no solo con hover**, porque hover no existe en una
 * pantalla táctil ni en un teclado:
 *
 * - Mouse: entra y sale del puntero. El `pointerType` se chequea para que el
 *   toque de un dedo no dispare el hover fantasma que emiten los navegadores
 *   móviles y deje el menú abierto sin que nadie lo pueda cerrar.
 * - Táctil: el botón funciona como interruptor.
 * - Teclado: `focus` sobre el botón lo abre, y se cierra cuando el foco se va
 *   de todo el bloque.
 *
 * Los enlaces van DESPUÉS del botón en el DOM aunque se dibujen a su izquierda.
 * Es a propósito: así el tabulador llega primero al botón -que es lo que abre el
 * menú- y recién después entra en las secciones. Al revés, el teclado se topaba
 * con enlaces invisibles antes de tener forma de mostrarlos.
 *
 * Plegado, el bloque de enlaces lleva `inert`: sin eso el tabulador entra en
 * secciones que no se ven y el foco desaparece de la pantalla.
 *
 * **Al salir el mouse, el menú espera un segundo antes de cerrarse.** Pedido
 * del equipo, y además arregla algo que molestaba: la píldora se despliega
 * hacia la izquierda, o sea que los enlaces aparecen lejos del botón que los
 * abrió, y el camino del puntero hasta ellos pasa cerca del borde. Cerrando al
 * instante, un desvío mínimo del mouse plegaba el menú en la cara y había que
 * volver a empezar. La espera solo corre al salir: entrar abre de inmediato, y
 * volver a entrar antes del segundo cancela el cierre, así que ir y venir no
 * hace parpadear nada.
 *
 * El cierre por teclado no espera. Cuando el foco se va del bloque, la persona
 * ya está en otra parte de la página y dejar el menú abierto un segundo más
 * solo taparía lo que acaba de enfocar.
 */

/**
 * Cuánto espera el menú antes de plegarse al salir el mouse, en milisegundos.
 *
 * Un segundo es lo que se pidió y funciona bien: alcanza para corregir el rumbo
 * del puntero sin que el menú quede colgado cuando alguien de verdad se fue.
 */
const MS_ANTES_DE_CERRAR = 1000

export function MenuFlotante() {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)
  const idPanel = useId()

  /*
    El cierre pendiente.

    Va en una ref y no en el estado a propósito: cambiarlo no tiene que
    redibujar nada, y ademas los manejadores necesitan leer el valor actual sin
    quedar atados al que existía cuando se creó el closure.
  */
  const cierrePendiente = useRef<number | null>(null)

  const cancelarCierre = () => {
    if (cierrePendiente.current !== null) {
      window.clearTimeout(cierrePendiente.current)
      cierrePendiente.current = null
    }
  }

  const abrir = () => {
    cancelarCierre()
    setAbierto(true)
  }

  /** Cierre inmediato: el teclado y el botón no esperan. */
  const cerrarYa = () => {
    cancelarCierre()
    setAbierto(false)
  }

  const cerrarDespues = () => {
    cancelarCierre()
    cierrePendiente.current = window.setTimeout(() => {
      cierrePendiente.current = null
      setAbierto(false)
    }, MS_ANTES_DE_CERRAR)
  }

  // Un temporizador vivo despues de desmontar llamaria a `setAbierto` sobre un
  // componente que ya no esta.
  useEffect(() => cancelarCierre, [])

  return (
    <div
      // `focus`/`blur` de React son `focusin`/`focusout`: burbujean, así que
      // puestos acá cubren al botón y a todos los enlaces de adentro.
      onFocus={abrir}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) cerrarYa()
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') abrir()
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') cerrarDespues()
      }}
      className="bg-canvas/70 hidden items-center rounded-full p-1.5 ring-1 ring-white/15 backdrop-blur-xl lg:flex"
    >
      <div
        id={idPanel}
        inert={!abierto}
        className={cn(
          'overflow-hidden transition-[max-width] duration-300 ease-out',
          abierto ? 'max-w-3xl' : 'max-w-0'
        )}
      >
        <div>
          <nav aria-label="Secciones del sitio">
            <ul className="flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                // Comparación exacta: con `startsWith`, "Inicio" (que apunta a
                // "/") quedaría marcado como activo en todo el sitio.
                const activo = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={activo ? 'page' : undefined}
                      className={cn(
                        'font-display flex min-h-11 items-center rounded-full px-4 text-[15px] tracking-[0.08em] whitespace-nowrap uppercase transition-colors',
                        activo
                          ? 'text-accent bg-white/10'
                          : 'text-ink/80 hover:text-ink hover:bg-white/10'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        // Cancela cualquier cierre pendiente: si alguien toca el botón para
        // cerrar, el menú no puede volver a plegarse un segundo después sobre
        // una decisión que ya se tomó.
        onClick={() => {
          cancelarCierre()
          setAbierto((v) => !v)
        }}
        className="text-ink focus-visible:ring-accent flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none"
      >
        {/*
          El icono cambia a una X con el menú abierto: sin eso el botón sigue
          diciendo "abrir" cuando lo que hace es cerrar.
        */}
        {abierto ? (
          <X className="size-6" aria-hidden />
        ) : (
          <Menu className="size-6" aria-hidden />
        )}
      </button>
    </div>
  )
}
