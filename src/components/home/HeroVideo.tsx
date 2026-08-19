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
 * El video se pausa al salir de pantalla. Son 1920x1080 decodificandose treinta
 * veces por segundo: dejarlo corriendo mientras alguien lee las noticias de mas
 * abajo es gastar bateria en algo que nadie mira.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')

    /**
     * Intenta reproducir sin romper nada si el navegador dice que no.
     *
     * `play()` devuelve una promesa que se rechaza cuando la politica de
     * autoplay lo bloquea (ahorro de energia, o un ajuste del usuario). Sin el
     * `catch`, ese rechazo sale como error no manejado en la consola. Y no hay
     * nada que reparar: el poster ya esta en pantalla y es el mismo cuadro.
     */
    const reproducir = () => {
      if (consulta.matches) return
      void video.play().catch(() => {})
    }

    /*
      Arranca sin esperar al observador, y esto se descubrio midiendo.

      La primera version dejaba que el `IntersectionObserver` diera la orden de
      empezar. Medido en el navegador, con la pestaña en segundo plano el
      observador NO dispara: Chrome no calcula intersecciones para una pagina
      que no esta renderizando. O sea que abrir el sitio en una pestaña nueva
      -clic con el boton del medio, que es de lo mas comun- dejaba el Hero
      congelado en el poster hasta que la pestaña se mirara por primera vez.

      Es el mismo principio que ya esta escrito para el carrusel en CLAUDE.md
      seccion 7: nada que ponga las cosas en movimiento puede depender de que
      llegue un evento. El observador se queda solo con lo que si es seguro
      diferir, que es apagar.
    */
    reproducir()

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada) return
        if (entrada.isIntersecting) reproducir()
        else video.pause()
      },
      { rootMargin: '100px' }
    )
    io.observe(video)

    // Si alguien cambia el ajuste con la pagina abierta, el video obedece sin
    // recargar: se detiene y vuelve a su primer cuadro, que es el poster.
    const alCambiar = () => {
      if (consulta.matches) {
        video.pause()
        video.currentTime = 0
      } else {
        reproducir()
      }
    }
    consulta.addEventListener('change', alCambiar)

    return () => {
      io.disconnect()
      consulta.removeEventListener('change', alCambiar)
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
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )
}
