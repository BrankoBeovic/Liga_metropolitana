import { MenuFlotante } from './MenuFlotante'
import { MenuLateral } from './MenuLateral'
import { PanelLink } from './PanelLink'

/**
 * Navegacion flotante, arriba a la derecha.
 *
 * **No lleva logo ni el nombre del sitio.** El video del hero ya dice "LIGA
 * METROPOLITANA" en letras de tres metros, y repetirlo arriba era decirlo dos
 * veces. Lo que el logo sí resolvía sin que se notara era el enlace al inicio,
 * y por eso "Inicio" pasó a ser el primer item de `NAV_LINKS`: sin él, desde
 * una página interior no había forma de volver.
 *
 * **Va plegada en un botón.** La píldora con las seis secciones medía 541px y
 * le competía la atención al hero. Desde `lg`, `MenuFlotante` la despliega
 * hacia la izquierda al pasarle el mouse; debajo, `MenuLateral` abre un panel
 * desde el costado.
 *
 * **Es `fixed`, no `sticky`.** Con `sticky` ocupa una fila en el flujo y empuja
 * al hero hacia abajo; con `fixed` sale del flujo y el video llega al borde
 * superior de la pantalla, que es lo que hace que se lea como flotante.
 *
 * La contrapartida de sacarla del flujo: las páginas interiores no tienen un
 * header que les reserve el espacio, así que llevan su propio `pt-28`. Está
 * anotado en cada una.
 *
 * `pointer-events-none` en el contenedor de ancho completo y `auto` en los
 * botones: sin eso, la franja invisible que va de borde a borde se come los
 * clics de la parte superior del hero.
 */
export function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/*
        Sin contenedor de 1400px, al reves que el resto del sitio.

        Es una capa flotante sobre el video, no contenido: atada al contenedor
        se despegaba del borde en cuanto la pantalla pasaba los 1400px -medido,
        297px de aire a la derecha en un monitor de 1900- y quedaba nadando en
        el medio del hero. Pegada al viewport se comporta igual en cualquier
        ancho.
      */}
      <div className="flex justify-end px-5 py-4 sm:px-8 sm:py-5 lg:px-12">
        <div className="pointer-events-auto flex items-center gap-2">
          {/*
            Solo aparece con sesion abierta. Se resuelve en el cliente para no
            sacar al sitio del render estatico.
          */}
          <PanelLink />
          {/*
            Dos menus, uno por forma de pantalla, y cada uno se esconde solo con
            su breakpoint: la pildora que se despliega en horizontal desde `lg`,
            el panel lateral debajo. No es duplicacion: la interaccion es
            distinta de verdad, y la horizontal no cabe en un telefono.
          */}
          <MenuFlotante />
          <MenuLateral />
        </div>
      </div>
    </header>
  )
}
