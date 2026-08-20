'use client'

import { useEffect, useRef } from 'react'

/**
 * El video de fondo del Hero.
 *
 * **No lleva el atributo `autoplay`, y eso es deliberado.** Con `autoplay` en
 * el HTML no hay forma de respetar `prefers-reduced-motion`: el navegador
 * arranca la reproduccion antes de que corra una linea de JavaScript, y quien
 * pidio menos movimiento veria el video empezar y recien despues frenarse.
 * Arrancandolo desde este efecto, quien pide menos movimiento simplemente se
 * queda en el poster, que es el primer cuadro del video: no ve una animacion
 * que se corta, ve una foto.
 *
 * **El loop es el nativo del navegador.** Hubo una version que lo reiniciaba a
 * mano con el evento `ended` para dejar el ultimo cuadro quieto un rato; se
 * saco porque la pausa cortaba el ritmo del clip. El atributo `loop` encadena
 * sin costura y sin JavaScript en el medio.
 *
 * El poster hace ademas todo el trabajo de LCP. Va en el HTML que manda el
 * servidor -este componente es cliente, pero igual se renderiza en el
 * servidor- asi que el navegador lo descubre y lo empieza a bajar en el primer
 * parseo, sin esperar a la hidratacion.
 *
 * El video se pausa al salir de pantalla. Son muchos pixeles decodificandose
 * treinta veces por segundo: dejarlo corriendo mientras alguien lee las
 * noticias de mas abajo es gastar bateria en algo que nadie mira.
 *
 * ## En un telefono, arrancar una sola vez no alcanza
 *
 * La version anterior pedia `play()` al montar y, si el navegador decia que no,
 * se rendia ahi mismo. En un escritorio eso casi nunca se nota; en un telefono
 * es la diferencia entre un Hero que se mueve y uno clavado en el poster. Los
 * tres caminos por los que se rompia, todos reales:
 *
 * 1. **El sistema operativo pausa el video por su cuenta.** Una llamada, un
 *    cambio de app, la pantalla que se bloquea, el modo de ahorro de energia.
 *    Al volver, el video sigue entero en pantalla, asi que el
 *    `IntersectionObserver` NO cambia de estado y nunca vuelve a dar la orden.
 *    Verificado en el navegador: pausado a mano, con el elemento visible, a los
 *    1,5 segundos seguia pausado y en el mismo cuadro. Ese es exactamente el
 *    "de repente se para y queda pegado".
 * 2. **La politica de autoplay lo bloquea de entrada.** iOS con Bajo Consumo
 *    activado rechaza toda reproduccion automatica hasta que la persona toque
 *    la pantalla. El `catch` vacio se tragaba ese rechazo y no quedaba nadie
 *    para reintentar.
 * 3. **Todavia no habia datos que reproducir.** Con la pagina recien abierta en
 *    datos moviles, el primer `play()` puede llegar antes que el primer byte
 *    util del video. Al navegar a otra pagina y volver, el archivo ya esta en
 *    la cache y arranca de una: de ahi el "no parte a no ser que cambie de
 *    pagina".
 *
 * La respuesta a los tres es la misma: `reproducir()` no se llama una vez, se
 * llama en cada oportunidad nueva -datos listos, pestaña que vuelve al frente,
 * pagina restaurada del bfcache, primer toque de la persona, pausa que no
 * pedimos nosotros- y es barata cuando no hay nada que hacer.
 *
 * **La bandera `bloqueado` existe para no entrar en bucle.** Si el navegador
 * rechaza la reproduccion, reintentar desde el evento `pause` seria pedirla
 * otra vez para que la rechacen otra vez. Se apaga sola en cuanto aparece una
 * oportunidad nueva de verdad, que son los eventos de arriba.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')

    /** Arranca en `true`: el Hero es lo primero de la pagina. */
    let enPantalla = true
    /** Distingue la pausa que pedimos nosotros de la que impone el sistema. */
    let pausaNuestra = false
    /** El navegador rechazo la ultima reproduccion. Corta el bucle de reintentos. */
    let bloqueado = false

    /**
     * Intenta reproducir sin romper nada si el navegador dice que no.
     *
     * `play()` devuelve una promesa que se rechaza cuando la politica de
     * autoplay lo bloquea. Sin manejar ese rechazo sale como error no manejado
     * en la consola, y no hay nada que reparar en pantalla: el poster es el
     * mismo primer cuadro del video.
     *
     * La propiedad `muted` se vuelve a afirmar aca a proposito. El atributo
     * viaja en el HTML, pero es la propiedad la que mira la politica de
     * autoplay, y un video que llega sin ella a ese chequeo es un video que no
     * arranca en ningun telefono.
     */
    const reproducir = () => {
      if (consulta.matches || !enPantalla || !video.paused) return

      video.muted = true
      pausaNuestra = false

      void video.play().then(
        () => {
          bloqueado = false
        },
        () => {
          bloqueado = true
        }
      )
    }

    /** Una oportunidad nueva: vuelve a habilitar el reintento y lo hace. */
    const reintentar = () => {
      bloqueado = false
      reproducir()
    }

    const pausar = () => {
      pausaNuestra = true
      video.pause()
    }

    /*
      Arranca sin esperar al observador, y esto se descubrio midiendo.

      La primera version dejaba que el `IntersectionObserver` diera la orden de
      empezar. Medido en el navegador, con la pestaña en segundo plano el
      observador NO dispara: Chrome no calcula intersecciones para una pagina
      que no esta renderizando. O sea que abrir el sitio en una pestaña nueva
      -clic con el boton del medio, que es de lo mas comun- dejaba el Hero
      congelado en el poster hasta que la pestaña se mirara por primera vez.

      Por lo mismo, la visibilidad de la pestaña NO es condicion para arrancar:
      es solo una oportunidad mas de reintentar.

      Es el mismo principio que ya esta escrito para el carrusel en CLAUDE.md
      seccion 7: nada que ponga las cosas en movimiento puede depender de que
      llegue un evento. El observador se queda solo con lo que si es seguro
      diferir, que es apagar.
    */
    reproducir()

    /*
      El video volvio a tener con que reproducir. Es la red respondiendo, que en
      un telefono llega bastante despues del montaje.
    */
    video.addEventListener('canplay', reproducir)

    /*
      Una pausa que no pedimos: la impuso el sistema (llamada, cambio de app,
      pantalla bloqueada). Si el video sigue en pantalla, la orden es volver.
    */
    const alPausar = () => {
      if (pausaNuestra || bloqueado) return
      reproducir()
    }
    video.addEventListener('pause', alPausar)

    /*
      La pestaña vuelve al frente. En un telefono esto es "la persona volvio a
      la app", que es justo cuando el video quedo pausado por el sistema.
    */
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') reintentar()
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    /*
      Volver atras con el boton del navegador restaura la pagina desde el
      bfcache: el efecto NO se vuelve a ejecutar, asi que sin esto el video
      quedaria pausado para siempre.
    */
    window.addEventListener('pageshow', reintentar)

    /*
      El primer toque de la persona.

      iOS en Bajo Consumo bloquea toda reproduccion automatica hasta que hay un
      gesto; despues del gesto, la misma llamada que fallaba funciona. El
      listener queda puesto -no `once`- porque el primer toque puede ocurrir
      antes de que el video tenga datos, y entonces habria que esperar al
      siguiente. Cuando no hay nada que hacer, `reproducir()` sale en la primera
      linea.
    */
    document.addEventListener('pointerdown', reintentar, { passive: true })

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada) return
        enPantalla = entrada.isIntersecting
        if (enPantalla) reintentar()
        else pausar()
      },
      { rootMargin: '100px' }
    )
    io.observe(video)

    // Si alguien cambia el ajuste con la pagina abierta, el video obedece sin
    // recargar: se detiene y vuelve a su primer cuadro, que es el poster.
    const alCambiarMovimiento = () => {
      if (consulta.matches) {
        pausar()
        video.currentTime = 0
      } else {
        reintentar()
      }
    }
    consulta.addEventListener('change', alCambiarMovimiento)

    return () => {
      io.disconnect()
      video.removeEventListener('canplay', reproducir)
      video.removeEventListener('pause', alPausar)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      window.removeEventListener('pageshow', reintentar)
      document.removeEventListener('pointerdown', reintentar)
      consulta.removeEventListener('change', alCambiarMovimiento)
    }
  }, [])

  return (
    <video
      ref={ref}
      poster="/hero-poster.jpg"
      muted
      loop
      playsInline
      preload="auto"
      // Decorativo: lo que dice el video ya esta escrito en el h1 y en la
      // bajada. Fuera del arbol de accesibilidad y fuera del tabulador.
      aria-hidden
      tabIndex={-1}
      /*
        `object-cover` a secas, y el escudo se recorta en los bordes.

        Se probo reencuadrar el video y cambiar a `object-contain` fuera de la
        franja donde el recorte no lo respeta. Funcionaba -el escudo entraba
        entero- pero `contain` deja bandas a los costados en cuanto la ventana
        es mas ancha que 16:9, y esas bandas se ven. Entre un escudo completo
        con bandas y uno recortado a sangre, se eligio lo segundo.
      */
      className="absolute inset-0 size-full object-cover"
    >
      {/*
        En telefono va otro archivo, y el orden importa: el navegador se queda
        con la PRIMERA fuente cuyo `media` coincide, asi que la version liviana
        tiene que ir arriba.

        `hero-mobile.mp4` es el mismo clip a 1280x720 y CRF 26: 1,45 MB contra
        3,0 MB, o sea la mitad de datos moviles antes de que el Hero se mueva.
        No es un recorte de calidad visible: medido, su SSIM contra el archivo
        grande da 0,9848, y en un telefono en vertical el video ya se amplia mas
        del doble por `object-cover`, asi que los pixeles que se descartan no
        llegaban a verse. La alternativa de mantener 1080p bajando el bitrate
        pesaba 1,9 MB para un SSIM de 0,9857: 33% mas de peso por una diferencia
        de nueve diezmilesimos.

        El corte va en 820px y no en 768: apunta a telefonos y tablets en
        vertical, que son los que navegan con datos.

        La fuente se elige al cargar y no se revisa al redimensionar la ventana.
        Es correcto para lo que se busca -nadie pasa de telefono a escritorio a
        mitad de visita- y de todas formas el archivo chico aguanta bien
        estirado.
      */}
      <source
        src="/hero-mobile.mp4"
        type="video/mp4"
        media="(max-width: 820px)"
      />
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )
}
