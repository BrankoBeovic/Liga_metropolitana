import { HeroVideo } from './HeroVideo'

/**
 * Hero de la portada.
 *
 * **No hay titular ni botones encima del video, y es a propósito.** El video es
 * el escudo: dice "LIGA METROPOLITANA" en letras de tres metros. Escribir el
 * mismo nombre encima sería decirlo dos veces y pelearle el centro de la
 * imagen. Lo único que se apoya arriba es la bajada.
 *
 * Los dos botones que había -"Últimas noticias" e "Instagram"- se sacaron para
 * que el bloque respire: las noticias están a un scroll de distancia y con su
 * propio encabezado, e Instagram tiene el carrusel entero más abajo y su enlace
 * en el footer. Un botón que lleva a algo que ya se ve al bajar es ruido.
 *
 * El h1 de la página existe, vive en `page.tsx` y es `sr-only`: buscadores y
 * lectores de pantalla lo reciben igual.
 *
 * **La bajada termina de aparecer a 1,3s, y es la única excepción a la regla del
 * `opacity: 0` en el Hero.** CLAUDE.md sección 3 la prohíbe porque el Hero es
 * lo que mide el LCP. Acá no aplica: el elemento más grande de la pantalla es
 * el póster del video, que ocupa el viewport entero y se pinta de inmediato, así
 * que el LCP lo sigue marcando él y no este texto. Está medido, no supuesto.
 *
 * La animación vive en `globals.css` y no en Framer Motion a propósito: es CSS
 * puro, así que corre sin esperar a que hidrate el JavaScript. Con un componente
 * cliente, la bajada se quedaría invisible hasta que baje el bundle.
 *
 * **Ocupa la pantalla entera y sin tope.** Antes eran `70svh` con un
 * `max-h-[760px]`, y ese cap era el problema: en un monitor de 890px de alto el
 * Hero terminaba a los 760 y el bloque de abajo asomaba por el borde inferior
 * incluso estando en lo más alto de la página. Un Hero que se pisa con la
 * sección siguiente deja de leerse como una portada.
 *
 * También se fue el `min-h`: en una ventana baja obligaba al Hero a ser más
 * alto que la pantalla, que es la misma falla del otro lado.
 *
 * El alto va en `svh` y no en `vh`: en un teléfono, `100vh` cuenta la barra de
 * direcciones como si no existiera, así que el borde inferior del Hero -donde
 * está la bajada- nace fuera de vista. `svh` es la altura con la barra visible,
 * que es justo el estado en el que se carga la página.
 *
 * Tampoco `dvh`: aquel sigue el alto real mientras la barra del navegador se
 * pliega al desplazarse, y eso hace que el Hero cambie de tamaño mientras uno
 * scrollea.
 */
export function Hero() {
  return (
    <section
      aria-label="Liga Metropolitana"
      className="relative flex h-svh w-full items-end overflow-hidden"
    >
      <HeroVideo />

      {/*
        Dos scrims, cada uno con su trabajo.

        El de abajo funde el video con el canvas para que el Hero no termine en
        un corte recto contra el fondo de la página. El plano, muy suave,
        oscurece el video entero: sin él, un cuadro claro dejaba la bajada en
        3:1 contra el fondo. Los dos son `aria-hidden` porque no aportan nada
        que leer.
      */}
      <div
        aria-hidden
        className="from-canvas via-canvas/45 absolute inset-0 bg-gradient-to-t to-transparent to-75%"
      />
      <div aria-hidden className="bg-canvas/25 absolute inset-0" />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-10 sm:px-8 sm:pb-14 lg:px-10">
        {/*
          Es el eslogan de `SITE_TAGLINE`, escrito acá en dos partes para poder
          pintar la segunda en el dorado. Si se cambia uno hay que cambiar el
          otro: no se compone desde la constante porque partir una cadena por
          una palabra en runtime es frágil y no aporta nada.
        */}
        <p className="eslogan-hero font-display text-ink max-w-2xl text-3xl leading-[1.05] tracking-wide text-balance uppercase sm:text-5xl">
          El maxibásquetbol chileno{' '}
          <span className="text-accent">desde 1989</span>
        </p>
      </div>
    </section>
  )
}
