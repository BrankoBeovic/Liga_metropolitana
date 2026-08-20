# ESTADO - Bitácora de avance

Bitácora corta para retomar en otra sesión sin releer todo.
El detalle de cada decisión vive en `CLAUDE.md`.

## Cambio: el video del hero en el celular

### Hecho

- **El Hero ya no se queda pegado.** Reportado desde un celular: el video se paraba solo, o no partía hasta cambiar de página.
  `HeroVideo` ahora reintenta la reproducción en cada oportunidad nueva (`canplay`, vuelta al frente de la pestaña, `pageshow` del bfcache, primer toque, y toda pausa que no haya pedido el propio componente) en vez de rendirse en el primer `play()` rechazado.
  El detalle de las tres fallas y de las dos banderas que sostienen esto está en `CLAUDE.md` sección 3.
- **La mitad de datos móviles**: `public/hero-mobile.mp4`, el mismo clip a 720p CRF 26, 1,45 MB contra 3,0 MB.
  Entra por `<source media="(max-width: 820px)">`.

### Verificado en el navegador

- Pausa impuesta desde afuera con el video en pantalla: antes seguía pausado a los 1,5 s; ahora reanuda solo (avanzó 0,98 s en 900 ms).
- Con `play()` parcheado para rechazar siempre: **un** intento en 2 segundos, sin ráfaga de reintentos. Al soltar el parche, un toque en la pantalla lo hace arrancar.
- A 375px baja `hero-mobile.mp4` (1280x720); a 1280px baja `hero.mp4` (1920x1080). Nunca las dos.
- Las cuatro compuertas pasan (`type-check`, `lint`, `format:check`, `build`), y la consola queda sin errores.

### Lo que no se pudo probar en esta máquina

- **La pausa al salir de pantalla.** En el navegador de la vista previa ningún `IntersectionObserver` informa, porque la pestaña no está renderizando: se comprobó con un observador de control, que tampoco disparó nunca.
  Esa parte de la lógica no cambió respecto de la versión anterior, salvo la bandera que la marca como pausa propia.
- **Un iPhone de verdad**, que es donde apareció el problema. El equipo tiene que confirmarlo ahí, con Bajo Consumo activado y con datos móviles.

## Cambio: Inscríbete pasa a Jugadores

### Hecho

- La barra, el sitemap y la portada dicen **Jugadores**, no Inscríbete.
  `/inscribete` redirige 301 a `/jugadores`.
- El formulario ya no pide un equipo: pide nombre, apellido, edad, RUT, posición, bio, correo y teléfono (el teléfono es opcional).
  Correo y teléfono no estaban en el pedido original; sin un dato de contacto la ficha no sirve.
- Tabla `players` con RLS: el sitio publico no lee nada (el RUT no sale).
  El alta lo hace la Server Action con la clave secreta, despues del antispam.
  El CMS lista y borra (`/admin/jugadores`).
- Si el correo de aviso no sale, la fila igual queda: la ficha es la fuente de verdad.
- `SUPABASE_SECRET_KEY` tiene que estar en `.env.local`: sin ella el formulario no puede insertar (bypassea RLS a proposito). Hoy esta vacia en esta maquina.

## Etapa actual: 6 (Historia, documentos, inscríbete y contacto) - cerrada

### Hecho

- `/documentos` público con buscador (filtra en memoria, sin tilde y sin distinguir mayúsculas) y `/admin/documentos` completo: alta, edición, ocultar y borrar.
- **El PDF sube directo a Storage con URL firmada**, sin cruzar por la Server Action: un reglamento escaneado pasa los 16 MB del cuerpo de una acción, y ese error solo se ve en los logs del servidor. La validación real de tipo y peso ocurre después, leyendo el `metadata` del objeto ya subido.
- `/contacto` e `/inscribete` con formularios que mandan correo por Resend. Destino provisorio: `brankobeovic24@gmail.com`.
- Antispam sin captcha: campo trampa escondido con CSS más una trampa de tiempo de 2,5 segundos. Un envío detectado devuelve éxito y no se manda.
- `/historia` maquetada con texto de relleno, por pedido del equipo. Va con `noindex`, con un aviso en pantalla y fuera del sitemap hasta que llegue el texto real.
- `lib/admin/storage.ts` reescrito: la lista de buckets ya no dice `media-thumbnails` (nunca existió en este proyecto) y ahora incluye `documents`. `borrarImagen` pasó a llamarse `borrarDeStorage`, porque también borra PDF.
- `/documentos`, `/inscribete` y `/contacto` entraron al sitemap. `/historia` no, mientras sea relleno.
- Encabezado común de páginas interiores (`PageHeader`) y campos de formulario propios del sitio oscuro, aparte de los del CMS.

### Verificado

- Las cuatro compuertas pasaron. El build lista las cuatro páginas nuevas como estáticas.
- Contraste, desborde horizontal y objetivos táctiles: barrido elemento por elemento en las cuatro páginas, a 360px y a 1265px. Cero incumplimientos.
- **Las dos trampas del antispam disparan de verdad**, confirmado contra el log del servidor: `Contacto descartado (campo trampa completado)` y `Contacto descartado (enviado en 28 ms)`. En los dos casos la pantalla dice "Mensaje enviado" y el correo no sale.
- Un formulario que se envía a los 9 segundos NO dispara la trampa de tiempo: no hay falso positivo.
- El envío sin `RESEND_API_KEY` avisa en pantalla ("El envío de correos no está configurado todavía") en vez de fingir que salió.
- La lista de documentos, con datos de prueba: pesos en castellano (2,3 MB / 313 KB / 39,1 MB), fechas en `es-CL` y el `?download` en cada enlace de descarga.
- El buscador: sin tilde encuentra "inscripción", ignora mayúsculas y muestra su propio mensaje cuando no hay coincidencias.
- `/historia` sirve `noindex, nofollow` y muestra el aviso de página en preparación.

### Un bug encontrado midiendo, no leyendo

- **Un error de validación vaciaba el formulario entero.** React resetea solo un `<form action={accion}>` cuando la acción termina, así que quien se equivocaba en un campo perdía todo lo que había escrito y encima leía que corrigiera algo que ya no estaba en pantalla. La acción ahora devuelve lo enviado más un `nonce` que remonta el formulario con esos valores; verificado enviando un mensaje demasiado corto y comprobando que los cuatro campos siguen ahí.

### Lo que no se pudo probar en esta máquina

- **La subida de PDF de punta a punta.** Firmar la URL exige sesión y no hay credenciales del CMS acá; Storage rechaza la firma para un anónimo. El código compila y está revisado, pero el circuito completo -firmar, subir, verificar, guardar, reemplazar, borrar- lo tiene que probar el equipo con un PDF real.
- **El envío real de un correo**: falta la `RESEND_API_KEY`. Sí quedó probado todo lo anterior al envío y la rama de configuración incompleta.

### Pendiente conocido, no es un bug

- `RESEND_API_KEY`: la genera el equipo en resend.com y va en `.env.local` y en el entorno de producción.
- Con `CORREO_REMITENTE` vacía el remitente es `onboarding@resend.dev`, que **solo entrega a la casilla dueña de la cuenta de Resend**. Para mandar a otra dirección hace falta dominio propio verificado.
- El texto real de `/historia`, y con él las tres cosas anotadas en `contenido.ts`.
- Las categorías de `/inscribete` son los tramos habituales del maxibásquetbol, no la lista oficial de la Liga.

## Etapa 5 (Sitio público) - cerrada

### Hecho

- Layout público: header flotante de vidrio con el escudo más el nombre escrito, barra fija de `lib/navigation.ts` desde `md`, panel lateral Radix debajo, `PanelLink` y footer editorial.
- Portada: Hero con video, "Lo último" (destacada grande más dos laterales), carrusel de Reels, "Más noticias" (grilla de cinco) y logos de sponsors.
- Página de la nota en `/noticia/[slug]` (la fuente la tenía en `/articulo/`), a una sola columna, con migas, JSON-LD `NewsArticle`, tarjeta de autor, relacionadas y el aviso de vista previa de borradores.
- `robots.ts`, `sitemap.ts`, `/salir-vista-previa` y la metadata completa (canónica, OpenGraph, Twitter Card, `metadataBase`, `themeColor`, `colorScheme`).
- Componentes copiados y re-teñidos a la paleta oscura: `Carousel` (verbatim), `Badge`, `MotionCard`, `RevealText`, `SectionHeading`, `SpotlightCard`, `EmptyState`, las tarjetas de nota, `ReelCard` y los de sponsors.
- Assets de marca generados desde el video, porque el escudo nunca llegó como archivo: `escudo.png` con alfa, `og.jpg`, `hero.mp4` (3,0 MB, sin audio), `hero-poster.jpg`, `icon.png`, `apple-icon.png` y el isotipo `components/ui/Marca.tsx`.
- Se descartó YouTube, `CategoryColumns`, `/nosotros`, `/multimedia` y `/categoria/[slug]`, como estaba acordado.
- El CMS quedó alineado con la ruta nueva: las seis referencias a `/articulo/` pasan por `rutaNoticia()` de `lib/site.ts`.

### Verificado

- Las cuatro compuertas pasaron. El build lista `/` como `○ (Static)` con revalidación de 5m, `/noticia/[slug]` como `● (SSG)`, y `/robots.txt`, `/sitemap.xml`, `/icon.png` y `/apple-icon.png` como estáticas.
- Contraste: barrido por cada elemento con texto propio de la portada y de la nota, componiendo el fondo efectivo en un canvas. Cero incumplimientos de AA a 360px y a 1280px. La tabla quedó en `CLAUDE.md` sección 3.
- El texto del Hero sobre el video: medido el píxel más claro bajo la bajada en nueve momentos del clip, compuesto con los dos scrims. Peor caso 7.69:1.
- CLS 0, y el LCP cae en el póster del video (616 ms en dev).
- A 360px no hay scroll horizontal y todos los objetivos táctiles llegan a 44px. El único que no llegaba era el enlace de marca del header, que se ajustaba al alto del escudo (36px); se le puso `min-h-11`.
- Columna de lectura medida: 74 caracteres por línea. Los 768px de la fuente daban 93.
- `robots.txt` y `sitemap.xml` con el contenido correcto; `/salir-vista-previa` devuelve 307 a `/admin/noticias` y borra la cookie `__prerender_bypass`.
- El CMS sigue entero: `/admin/noticias` sin sesión redirige al login con `x-robots-tag: noindex`, y el layout conserva `.tema-claro`.
- Estados vacíos probados de verdad (sin notas y sin Reels): la sección de Reels desaparece entera y "Lo último" muestra el recuadro con la marca.
- `prefers-reduced-motion` en el Hero: probado invirtiendo la guarda, el video se queda pausado en el cuadro 0 y a la vista queda el póster.

### Dos bugs encontrados midiendo, no leyendo

- **El build moría por `NEXT_PUBLIC_SITE_URL` vacía.** `.env.local` la declara sin valor, y `??` no atrapa la cadena vacía: `new URL('')` reventaba al recolectar la portada. Ahora `lib/site.ts` usa `||`.
- **El Hero no arrancaba en una pestaña en segundo plano.** Ni `requestAnimationFrame` ni `IntersectionObserver` corren mientras `document.hidden` es `true` (medido: cero frames en dos segundos). `HeroVideo` dejaba el arranque en manos del observador, así que abrir el sitio en una pestaña nueva dejaba el video congelado hasta mirarla. Ahora arranca de una y el observador solo apaga.

### Lo que no se pudo probar en esta máquina

- El movimiento del carrusel, el fade up de las tarjetas y el reveal de los títulos: el panel del navegador no compone cuadros, así que no corren ni `rAF` ni las animaciones de Framer Motion. La estructura sí quedó verificada (tres copias, `inert` más `aria-hidden` en la segunda y la tercera).
- El recorrido con sesión del CMS y la vista previa de borradores: no hay credenciales en esta máquina.

### Pendiente conocido, no es un bug

- Los cuatro enlaces de la barra (Historia, Documentos, Inscríbete, Contacto) apuntan a páginas que todavía no existen: dan 404 hasta la Etapa 6.
- Sin `INSTAGRAM_ACCESS_TOKEN` la sección de Reels no se dibuja. El build lo avisa por consola.
- `NEXT_PUBLIC_SITE_URL` sigue vacía: hasta que se conecte el dominio, las canónicas y el sitemap salen con `https://ligametropolitana.cl`, que es un respaldo y no una confirmación.

## Etapa 4 (CMS) - cerrada

### Hecho

- Copiado de la fuente y adaptado al esquema recortado: login, dashboard, noticias (antes `articulos`), categorias, sponsors, perfil, vista previa y `/api/revalidate`.
- Dos layouts raiz hermanos: `(admin)` con `.tema-claro` (CMS claro) y `(public)` con la paleta oscura.
  Se borraron `src/app/layout.tsx` y `src/app/page.tsx` de la Etapa 1 para que no choquen con los grupos.
- Recortes: sin selector de sponsor en notas, categorias solo nombre/bajada/orden, sponsors solo logo/nombre/url/orden/activo, sin `NavbarPreview`.
- Menu del CMS: Inicio, Noticias, Categorias, Sponsors, Documentos, Mi perfil.
  `/admin/documentos` es una pagina provisoria; la subida de PDFs entra en la Etapa 6.
- Logo de la fuente quitado de login, shell, EmptyState y perfil (placeholder de inicial si no hay avatar).
- Se adelanto `lib/instagram.ts` (titulo fallback "Reel de la Liga Metropolitana") y `lib/navigation.ts` (barra fija + `FIRMA_EQUIPO`).

### Verificado

- Las cuatro compuertas pasaron.
- El build lista `/` como `○ (Static)` y todas las rutas `/admin/*` como `ƒ (Dynamic)`, mas `/api/revalidate` y `ƒ Proxy (Middleware)`.
- El type-check fallo una vez por tipos stale de `.next` (`src/app/page.js` / `layout.js` viejos); se resolvio borrando `.next`.
- El recorrido con sesion lo prueba el equipo: no hay credenciales del CMS en esta maquina.

## Etapa 3 (Supabase, proxy y tipos) - cerrada

### Hecho

- Copiados tal cual: los cinco clientes de `src/lib/supabase/`, `src/lib/admin/session.ts`, `src/lib/admin/storage.ts`, `src/proxy.ts`, `src/types/env.d.ts` y `src/types/server-only.d.ts`.
- `src/lib/imagenes.ts` se adelantó de la Etapa 4: `storage.ts` lo importa y sin él no compila. Copiado tal cual.
- `src/types/database.types.ts` generado con `corepack pnpm supabase:types` contra el proyecto nuevo.
- Pendiente anotado para la Etapa 6: la lista de buckets de `storage.ts` todavía dice `media-thumbnails`; se reescribe cuando entre la subida de PDFs (`documents`).

### Verificado

- Los tipos generados describen exactamente las 5 tablas nuevas (sin `media_items` ni `newsletter_subscribers`): el project-id corregido funcionó.
- Con el servidor levantado: `/admin/dashboard` sin sesión responde 307 a `/admin/login?redirectTo=%2Fadmin%2Fdashboard` con `x-robots-tag: noindex, nofollow`; `/` responde 200 sin ese header.
- En el build aparece `ƒ Proxy (Middleware)` y `/` sigue `○ (Static)`: el proxy no saca al sitio público del render estático.
- Las cuatro compuertas pasaron.

## Etapa 2 (Base de datos) - cerrada

### Hecho

- `supabase init` y `link` contra el proyecto nuevo (`cvmhjzwrzahpbsogrhbc`).
- Migración inicial consolidada (`20260819000000_esquema_inicial.sql`): `profiles`, `categories`, `posts`, `sponsors`, `documents`, 20 políticas RLS más 4 de Storage, 5 funciones, triggers y 4 buckets (`article-covers`, `avatars`, `sponsor-logos`, `documents`).
- Recortes acordados: sin `media_items` ni `newsletter_subscribers`, sin columnas de navegación en `categories`, sin espacios de publicidad en `sponsors` ni `sponsor_id` en `posts`.
- `seed.sql` con Novedades e Institucional, aplicado con `--include-seed`.

### Verificado

- `supabase migration list`: local = remoto.
- Lectura anónima por REST: las 2 categorías del seed visibles; `posts` y `documents` responden vacíos.
- Insert anónimo en `categories` rechazado con 401 (RLS).
- Buckets verificados por respuesta pública: los 4 existen ("Object not found") y `media-thumbnails` no ("Bucket not found").

### Pendiente de configuración manual en el dashboard

- Deshabilitar el registro público en Authentication (no se controla por SQL). Sin esto, cualquiera puede crearse un usuario editor.

## Etapa 1 (Infraestructura y memoria) - cerrada

### Hecho

- Repo git nuevo inicializado, con historial propio.
- `CLAUDE.md` escrito: memoria técnica podada de la fuente más las decisiones propias.
- Infraestructura copiada tal cual de la fuente: `.gitignore`, `.gitattributes`, Prettier, ESLint, PostCSS, tsconfig, `pnpm-workspace.yaml`, `.env.example`, `AGENTS.md`, `.github/workflows/ci.yml`.
- Dos correcciones de marca en archivos copiados: título de `AGENTS.md` y dominio en `.env.example`.
- `package.json` editado: nombre, descripción y el project-id de `supabase:types` apuntando al proyecto nuevo (`cvmhjzwrzahpbsogrhbc`).
- `next.config.mjs` editado: sin el patrón de imágenes de YouTube; quedan Supabase (derivado de env) e Instagram.
- `.env.local` creado con la URL y la clave publicable del proyecto nuevo (no se versiona).
- `corepack pnpm install`: 502 paquetes, lockfile generado, versiones fijadas (ESLint 9, TS 6) respetadas.
- Placeholder mínimo en `src/app/` (layout + portada) para que las compuertas tengan qué verificar; se reemplaza en la Etapa 5.

### Verificado

- Las cuatro compuertas pasaron: `type-check`, `lint`, `format:check` y `build` (Next 16.3.1, `/` y `/_not-found` estáticas).
- Decisiones tomadas antes de empezar:
  - Barra de navegación como lista fija en el código (no sale de `categories`).
  - Notas a una sola columna, sin publicidad lateral; sponsors solo como logos en la landing.
  - Tipografías: Bebas Neue (display) + Plus Jakarta Sans (cuerpo).
  - Paleta oscura: canvas `#0B0C0E`, editorial `#15181E`, ink `#F4F4F6`, accent `#D4A03D` / `#E5B84B`.
  - Categorías iniciales: Novedades, Institucional.

### Pendiente de datos del equipo

- Dominio (se conecta después).
- Token de la API de Instagram.
- Correo receptor de los formularios (Etapa 6).

## Etapas

| Etapa | Estado |
|---|---|
| 1. Infraestructura y memoria | Cerrada |
| 2. Base de datos | Cerrada |
| 3. Supabase, proxy y tipos | Cerrada |
| 4. CMS | Cerrada |
| 5. Sitio público | Cerrada |
| 6. Lo nuevo (historia, documentos, inscríbete, contacto) | Cerrada |
| 7. Documentación | Pendiente |
