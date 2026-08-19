'use client'

import { Children, useCallback, useEffect, useRef, type ReactNode } from 'react'

import { ATRIBUTO_PAUSA } from '@/lib/carousel'
import { cn } from '@/lib/cn'

/**
 * Cuantas veces se repite la lista.
 *
 * Tres y no dos: con dos copias, si el viewport llega a ser mas ancho que una
 * copia entera, al final del recorrido aparece un hueco. Tres cubre ese caso
 * incluso con pocas tarjetas en una pantalla grande.
 *
 * Solo la primera copia existe para lectores de pantalla y para el tabulador;
 * las otras dos van `aria-hidden` y sin foco, porque son la misma informacion
 * repetida para tapar la costura del loop.
 */
const COPIAS = 3

/** Pixeles por segundo del desplazamiento automatico, a velocidad de crucero. */
const VELOCIDAD = 28

/**
 * Cuanto tarda la velocidad en acercarse a su objetivo, en segundos.
 *
 * El carrusel no arranca ni frena de golpe: la velocidad se acerca a donde
 * tiene que estar de forma exponencial. Cortar en seco al pasar el mouse por
 * el play se veia trabado, como si la pagina se hubiera colgado.
 *
 * Es una constante de tiempo, no una duracion: en este lapso recorre el 63%
 * de lo que le falta, y queda practicamente quieto al triple. Con 0.45s la
 * frenada dura algo mas de un segundo, que es lo que se lee como suave.
 */
const RESPUESTA = 0.45

/** Cuanto hay que arrastrar antes de que deje de contar como clic. */
const UMBRAL_ARRASTRE = 8

/** Cuanto decae la inercia por frame a 60fps. */
const ROCE = 0.94

/** Por debajo de esta velocidad la inercia se corta y vuelve el automatico. */
const INERCIA_MINIMA = 12

function enZonaDePausa(nodo: EventTarget | null): boolean {
  return nodo instanceof Element && nodo.closest(`[${ATRIBUTO_PAUSA}]`) !== null
}

type CarouselProps = {
  /** Va en el `aria-label` de la region. */
  etiqueta: string
  children: ReactNode
  className?: string
}

/**
 * Carrusel de desplazamiento continuo.
 *
 * Se mueve solo, en loop, y se puede arrastrar con el dedo o con el mouse.
 * Al soltar conserva la inercia y despues retoma el movimiento automatico.
 *
 * Por que `transform` y no `scrollLeft`: la posicion tiene que poder ser
 * fraccionaria para que el avance se vea continuo y no a saltos de un pixel, y
 * `transform` ademas se compone en la GPU, que es lo que pide CLAUDE.md para
 * las micro-interacciones.
 *
 * El loop no tiene costura porque la lista esta repetida y la posicion se
 * normaliza con un modulo del ancho de una copia: cuando el desplazamiento
 * llega justo al ancho de una copia, se resta ese ancho y el contenido que
 * queda debajo es identico, asi que el salto no se ve.
 *
 * El movimiento se detiene al pasar el mouse por encima y al enfocar algo con
 * el teclado. Esto ultimo no es un lujo: sin eso, tabular por las tarjetas
 * mueve el contenido justo debajo del foco.
 */
export function Carousel({ etiqueta, children, className }: CarouselProps) {
  const hijos = Children.toArray(children)
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)

  /*
    Todo el estado del movimiento vive en refs y no en useState: cambia en cada
    frame, y pasarlo por el render de React lo volveria a dibujar 60 veces por
    segundo para mover un elemento que ya se mueve con transform.
  */
  const offset = useRef(0)
  /** Velocidad suavizada, en px/s. Persigue a `VELOCIDAD` o a cero. */
  const crucero = useRef(0)
  const anchoCopia = useRef(0)
  const pausado = useRef(false)
  /**
   * Si el carrusel esta a la vista.
   *
   * Arranca en `true` para que el primer frame no dependa de que el observador
   * ya haya informado: si arrancara en `false`, un carrusel visible desde el
   * principio se quedaria quieto hasta la primera medicion.
   */
  const visible = useRef(true)
  const arrastrando = useRef(false)
  /**
   * Si el gesto en curso ya paso de clic a arrastre.
   *
   * Va en un ref y no en el estado porque se consulta dentro del mismo evento
   * que lo enciende, y el estado de React todavia no habria cambiado ahi.
   */
  const esArrastre = useRef(false)
  const inercia = useRef(0)
  const ultimoX = useRef(0)
  const ultimoT = useRef(0)
  const recorrido = useRef(0)

  /**
   * Si el proximo clic hay que cancelarlo por venir de un arrastre.
   *
   * Va en un ref y no en el estado: el gesto no necesita repintar nada, y
   * meter a React en el medio de cada arrastre solo agrega renders.
   */
  const bloquearClic = useRef(false)

  const medir = useCallback(() => {
    const t = track.current
    if (!t || hijos.length === 0) return
    // El primer elemento de la segunda copia empieza exactamente un ancho de
    // copia mas a la derecha, con el gap ya incluido. Medirlo asi evita tener
    // que leer el gap del CSS y sumarlo a mano.
    const primerClon = t.children[hijos.length] as HTMLElement | undefined
    if (primerClon) anchoCopia.current = primerClon.offsetLeft
  }, [hijos.length])

  useEffect(() => {
    medir()
    const t = track.current
    if (!t) return

    const ro = new ResizeObserver(medir)
    ro.observe(t)
    return () => ro.disconnect()
  }, [medir])

  /*
    Fuera de la pantalla, quieto.

    Sin esto el carrusel de Reels sigue escribiendo su `transform` sesenta
    veces por segundo mientras alguien lee las noticias de mas arriba, y cada
    escritura obliga al navegador a recomponer. Es trabajo constante por algo
    que nadie esta mirando.

    El margen de 200px lo despierta un poco antes de entrar, para que al llegar
    ya venga en movimiento y no arranque de golpe delante del lector.
  */
  useEffect(() => {
    const v = viewport.current
    if (!v) return

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada) visible.current = entrada.isIntersecting
      },
      { rootMargin: '200px' }
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const t = track.current
    if (!t) return

    // Quien pide menos movimiento no recibe el desplazamiento automatico. El
    // arrastre sigue disponible, asi que la seccion no queda inaccesible: pasa
    // de moverse sola a moverse cuando la persona quiere.
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    let autoPermitido = !consulta.matches
    const alCambiar = (e: MediaQueryListEvent) => {
      autoPermitido = !e.matches
    }
    consulta.addEventListener('change', alCambiar)

    let frame = 0
    let anterior = 0

    const paso = (ahora: number) => {
      // Fuera de la pantalla no se calcula ni se escribe nada. El `anterior` se
      // olvida para que al volver el primer `dt` no sea el hueco entero.
      if (!visible.current && !arrastrando.current) {
        anterior = 0
        frame = requestAnimationFrame(paso)
        return
      }

      const dt = anterior ? Math.min((ahora - anterior) / 1000, 0.05) : 0
      anterior = ahora

      /*
        La pausa se corrige sola.

        `pausado` se encendia con `pointerover` sobre el play y se apagaba con
        `pointerout`, o sea que dependia de que ese segundo evento llegara. Si
        no llegaba (el mouse se va de la ventana, o el gesto termina con el
        cursor encima del boton) el carrusel quedaba pausado para siempre sin
        que nada lo despertara.

        Preguntarle al DOM si de verdad hay un boton bajo el cursor no depende
        de ningun evento. Solo se consulta estando pausado, que es justo cuando
        no hay animacion que optimizar.
      */
      if (
        pausado.current &&
        !arrastrando.current &&
        !t.querySelector(`[${ATRIBUTO_PAUSA}]:hover`)
      ) {
        pausado.current = false
      }

      /*
        La velocidad persigue a su objetivo en vez de saltar a el.

        `1 - Math.exp(-dt / RESPUESTA)` es la fraccion del camino que se
        recorre en este frame. Se calcula con el `dt` real y no con un factor
        fijo por frame para que la frenada dure lo mismo a 60fps que a 120, y
        para que no se descontrole si el navegador se saltea frames.
      */
      const objetivo =
        autoPermitido && !pausado.current && !arrastrando.current
          ? VELOCIDAD
          : 0
      crucero.current +=
        (objetivo - crucero.current) * (1 - Math.exp(-dt / RESPUESTA))

      // La inercia del arrastre es un extra pasajero que se suma al crucero y
      // se apaga por roce, en vez de competir con el.
      if (inercia.current !== 0) {
        inercia.current *= Math.pow(ROCE, dt * 60)
        if (Math.abs(inercia.current) < INERCIA_MINIMA) inercia.current = 0
      }

      if (!arrastrando.current) {
        offset.current += (crucero.current - inercia.current) * dt
      }

      const ancho = anchoCopia.current
      if (ancho > 0) {
        // Modulo con correccion de signo: el resto de un negativo en JS es
        // negativo, y sin esto arrastrar hacia atras deja el riel fuera de vista.
        offset.current = ((offset.current % ancho) + ancho) % ancho
      }

      t.style.transform = `translate3d(${-offset.current}px, 0, 0)`
      frame = requestAnimationFrame(paso)
    }

    frame = requestAnimationFrame(paso)
    return () => {
      cancelAnimationFrame(frame)
      consulta.removeEventListener('change', alCambiar)
    }
  }, [])

  const alPresionar = (e: React.PointerEvent) => {
    // Solo el boton principal del mouse. Con el secundario el menu contextual
    // se abre y el puntero nunca suelta, dejando el riel trabado.
    if (e.button !== 0) return
    arrastrando.current = true
    esArrastre.current = false
    inercia.current = 0
    recorrido.current = 0
    ultimoX.current = e.clientX
    ultimoT.current = e.timeStamp
    /*
      Aca NO se captura el puntero, y esa ausencia es deliberada.

      Con `setPointerCapture` activa, el navegador dirige al elemento que
      capturo no solo los eventos de puntero sino tambien el `click` que los
      cierra. Capturando en `pointerdown`, ese click terminaba en el riel en vez
      de en el enlace de la tarjeta, asi que ningun Reel ni video se abria al
      hacerle clic. La captura se pide recien cuando el gesto se convierte en
      arrastre, en `alMover`.
    */
  }

  const alMover = (e: React.PointerEvent) => {
    if (!arrastrando.current) return
    const dx = e.clientX - ultimoX.current
    const dt = (e.timeStamp - ultimoT.current) / 1000

    offset.current -= dx
    recorrido.current += Math.abs(dx)

    if (!esArrastre.current && recorrido.current > UMBRAL_ARRASTRE) {
      esArrastre.current = true
      /*
        Ahora si: el gesto ya es un arrastre y no un clic, asi que quedarse con
        el puntero no le roba el click a nadie. Sirve para que el riel siga
        respondiendo aunque el dedo se salga, que es lo normal en un arrastre
        rapido.

        Va protegida porque `setPointerCapture` lanza si el puntero ya no
        existe, y esa excepcion dejaria `arrastrando` en true para siempre: el
        carrusel quedaria trabado sin volver a moverse.
      */
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Sin captura el arrastre sigue funcionando, solo se corta si el
        // puntero se va del elemento.
      }
    }

    if (dt > 0) inercia.current = dx / dt

    ultimoX.current = e.clientX
    ultimoT.current = e.timeStamp
  }

  /**
   * Cierra el gesto, venga de donde venga.
   *
   * Se llama desde el riel (`pointerup`, `pointercancel`,
   * `lostpointercapture`) y tambien desde `window`, porque el riel solo se
   * entera de lo que pasa encima suyo.
   *
   * Va en `useCallback` con dependencias vacias para que la referencia sea
   * estable: los listeners globales se registran una sola vez y se limpian con
   * la misma funcion.
   */
  const terminarGesto = useCallback(() => {
    if (!arrastrando.current) return
    arrastrando.current = false

    /*
      El clic que cierra un arrastre se bloquea, y el desbloqueo se difiere.

      El `click` llega despues del `pointerup`. Sin esto, soltar encima de una
      tarjeta abriria el Reel que la persona solo queria correr. El
      `setTimeout` de cero corre despues de ese click y antes de cualquier otro.
    */
    if (esArrastre.current) {
      esArrastre.current = false
      bloquearClic.current = true
      window.setTimeout(() => {
        bloquearClic.current = false
      }, 0)
    }
  }, [])

  /*
    El gesto tambien se cierra desde `window`.

    El riel solo se entera de lo que pasa encima suyo. Mientras el gesto no
    cruzo el umbral no hay captura, asi que un arrastre que sale del riel (en
    diagonal hacia arriba o hacia abajo, que con tarjetas de 345px de alto es
    facil) suelta en otro elemento y el `pointerup` no llega nunca. Ahi
    `arrastrando` se quedaba en `true` y el carrusel no volvia a moverse.

    Escuchando en `window` da igual donde se suelte.
  */
  useEffect(() => {
    window.addEventListener('pointerup', terminarGesto)
    window.addEventListener('pointercancel', terminarGesto)
    return () => {
      window.removeEventListener('pointerup', terminarGesto)
      window.removeEventListener('pointercancel', terminarGesto)
    }
  }, [terminarGesto])

  const alSoltar = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ya liberada por el navegador al terminar el gesto.
    }
    terminarGesto()
  }

  /**
   * Cancela el clic que cierra un arrastre.
   *
   * Antes esto se hacia apagando los punteros del riel con
   * `pointer-events-none`, y ahi estaba el bug de que el carrusel se trababa al
   * arrastrar rapido: el riel es el mismo elemento que tiene la captura del
   * puntero, y sin eventos de puntero dejaba de recibir el `pointerup`. El
   * gesto no terminaba nunca y el riel quedaba clavado.
   *
   * Cancelar el clic en fase de captura hace lo mismo sin tocar los eventos de
   * puntero, asi que la captura sigue viva y el `pointerup` llega siempre.
   */
  const alHacerClic = (e: React.MouseEvent) => {
    if (!bloquearClic.current) return
    e.preventDefault()
    e.stopPropagation()
  }

  if (hijos.length === 0) return null

  const copias = Array.from({ length: COPIAS }, (_, c) =>
    hijos.map((hijo, i) => (
      <li
        key={`${c}-${i}`}
        /*
          Solo la primera copia se anuncia y recibe foco. Las otras son relleno
          visual para que el loop no muestre la costura.

          Las dos cosas juntas y no solo `aria-hidden`: sin `inert` las tarjetas
          repetidas siguen siendo tabulables, asi que el teclado recorre tres
          veces la misma lista y el foco entra en contenido que el lector de
          pantalla no anuncia, que es de los peores estados posibles.

          `inert` va como booleano porque React 19 lo soporta nativo. Pasarlo
          como cadena vacia, que era el truco de React 18, aca no hace nada.
        */
        aria-hidden={c > 0 ? true : undefined}
        inert={c > 0}
        className="shrink-0"
      >
        {hijo}
      </li>
    ))
  ).flat()

  return (
    <div
      role="region"
      aria-label={etiqueta}
      ref={viewport}
      className={cn('overflow-hidden', className)}
      /*
        La pausa es solo sobre el boton de play, no sobre la tarjeta entera.
        Pausar con toda la tarjeta dejaba el carrusel casi siempre detenido:
        las tarjetas ocupan todo el riel, asi que apenas el mouse entraba en la
        seccion ya no se movia mas.

        Se resuelve por delegacion con `pointerover` y `pointerout`, que
        burbujean, en vez de un handler por tarjeta: asi las tarjetas siguen
        siendo Server Components y solo tienen que marcar su boton.
      */
      onPointerOver={(e) => {
        if (enZonaDePausa(e.target)) pausado.current = true
      }}
      onPointerOut={(e) => {
        // El segundo chequeo evita el parpadeo al pasar de un hijo a otro
        // dentro del mismo boton, que dispara `pointerout` sin haber salido.
        if (enZonaDePausa(e.target) && !enZonaDePausa(e.relatedTarget)) {
          pausado.current = false
        }
      }}
      // Con el teclado no hay hover. Sin esto, tabular por las tarjetas las
      // mueve debajo del foco.
      onFocusCapture={() => {
        pausado.current = true
      }}
      onBlurCapture={() => {
        pausado.current = false
      }}
    >
      <ul
        ref={track}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        // Red de seguridad: si el navegador suelta la captura por su cuenta, el
        // gesto termina igual y el riel no queda clavado.
        onLostPointerCapture={terminarGesto}
        onClickCapture={alHacerClic}
        /*
          Corta el arrastre nativo del navegador.

          Las imagenes y los enlaces son arrastrables por defecto: al intentar
          correr el carrusel desde una tarjeta, el navegador levantaba la
          miniatura como si la estuvieran soltando en otra ventana, con su
          fantasma pegado al cursor, y el gesto del carrusel nunca llegaba a
          empezar. Es lo mismo que pasa al arrastrar una foto de una pagina
          cualquiera.
        */
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          'flex w-max gap-4 will-change-transform',
          // `touch-pan-y` deja el scroll vertical de la pagina al navegador y
          // se queda solo con el horizontal. Sin esto, arrastrar en diagonal en
          // un telefono pelea contra el scroll de la pagina.
          'cursor-grab touch-pan-y select-none active:cursor-grabbing'
        )}
      >
        {copias}
      </ul>
    </div>
  )
}
