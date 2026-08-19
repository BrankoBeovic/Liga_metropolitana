# Liga Metropolitana - Memoria de proyecto

@AGENTS.md

Las guías generales de comportamiento del agente (formato de commits, estilo de Markdown, criterio de calidad) viven en `AGENTS.md` y se cargan arriba.
Lo que sigue acá es específico de este proyecto.

Este documento explica POR QUÉ las cosas están como están.
Varias decisiones PARECEN errores y no lo son: buscar acá antes de "arreglar" nada.

## 1. Identidad y misión

"Liga Metropolitana" (La Metro) es el sitio oficial de la liga de maxibásquetbol chileno fundada en 1989.
Bajada: "El maxibásquetbol chileno desde 1989".

- Instagram: [@ligametromaxibasquet](https://www.instagram.com/ligametromaxibasquet/)
- Dominio: pendiente, se conecta después.
- Correo para formularios: pendiente, el equipo lo entrega más adelante.
- Token de la API de Instagram: pendiente, la sección de Reels queda vacía sin romper nada hasta que llegue.

Las categorías de las noticias son dos: **Novedades** e **Institucional**.
En el CMS se llaman "categorías".

La base del código se copió de "Hablemos de Básquet" (`C:\Users\dell\Desktop\Trabajo\HABLEMOS DE BASQUET\HABLEMOS_DE_BASQUET`), que es SOLO LECTURA.
Se copió tal cual y se adaptó después; las decisiones técnicas de la fuente que siguen vigentes están documentadas acá.

Referencias de estilo: Awwwards, The Athletic, Bleacher Report, Nike News.
Limpio, editorial, con motion design cuidado y rendimiento como prioridad.

## 2. Stack tecnológico (fijo, no reabrir estas decisiones)

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router, RSC, SSR/SSG con ISR) |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Auth en servidor | `@supabase/ssr` con cookies (ver nota abajo) |
| Estilos | Tailwind CSS 4, config CSS-first (ver nota abajo) |
| Primitivas UI | Radix UI |
| Iconografía | Lucide React |
| Animaciones | Framer Motion (GPU-accelerated, `transform-gpu`) |
| Tipografía Display | **Bebas Neue** (headings, H1, badges) |
| Tipografía Body | **Plus Jakarta Sans** (cuerpo de texto, metadatos) |
| Editor CMS | **TipTap** (JSON como formato de almacenamiento de `content`) |
| Paquetes | pnpm |
| Lenguaje | TypeScript estricto |
| Calidad | ESLint + Prettier |

Bebas Neue se eligió sobre Cabinet Grotesk porque está en Google Fonts y se carga con `next/font/google` como el resto; Cabinet Grotesk habría exigido self-hosting.
Bebas Neue tiene un solo peso (400) y es toda mayúsculas: no pedir `font-bold` en display, no existe.
Plus Jakarta Sans es la misma tipografía de cuerpo de la fuente, ya probada con este sistema de diseño.

### Nota: las cookies de sesión NO son HttpOnly

`@supabase/ssr` las emite con `httpOnly: false` por defecto, porque el cliente del navegador necesita leer la sesión para hidratarla.
Lo que protege la aplicación no es la opacidad de la cookie: es que el token es de vida corta, que toda decisión de autorización se toma con `getUser()` (que valida contra el servidor de Auth) y que RLS filtra los datos en la base.
De esto se aprovecha `PanelLink`, que consulta la sesión en el navegador para decidir si muestra el atajo al CMS.
Sin esa lectura del lado del cliente habría que tocar cookies en el servidor, y eso sacaría al sitio público del render estático.

### Nota: Tailwind 4 es CSS-first, no hay `tailwind.config.ts`

El tema se define en CSS con `@theme` y los tokens viven en `src/app/globals.css`: ese archivo es la configuración de Tailwind del proyecto.
No crear `tailwind.config.ts`: la ruta `@config` existe pero es modo compatibilidad y parte la configuración en dos lugares.

### Nota: versiones fijadas a propósito

Dos dependencias están deliberadamente por debajo de su última versión porque el resto del toolchain todavía no las soporta.

- `typescript` en `^6.0.3` y no en 7.x: `typescript-eslint` (vía `eslint-config-next`) declara `typescript >=4.8.4 <6.1.0` y aborta contra TS 7.
- `eslint` en `^9.39.5` y no en 10.x: los plugins de `eslint-config-next` declaran peer `^9` y con ESLint 10 fallan en runtime.

Revisar cuando `eslint-config-next` actualice sus dependencias.
Subirlas antes rompe `pnpm lint`.

## 3. Sistema de diseño

### Color: el sitio es de fondo OSCURO

Esta es la inversión más grande respecto de la fuente, que era de fondo claro con bloques oscuros.
Acá el fondo del sitio es oscuro y no hay modo claro ni toggle de tema.

| Token | Valor | Para qué |
|---|---|---|
| `--color-canvas` | `#0B0C0E` | Fondo del sitio (Obsidian Court Black) |
| `--color-editorial` | `#15181E` | Tarjetas y bloques glass (Graphite Glass) |
| `--color-ink` | `#F4F4F6` | Texto principal (Vintage Chalk White) |
| `--color-accent` | `#D4A03D` | Acento dorado (Metropolitana Amber Gold) |

`#E5B84B` es la variante clara del acento, para hovers y estados activos sobre fondo oscuro.
Para el glassmorphism de tarjetas se usa `rgba(21, 24, 30, 0.7)` con blur.

**La tabla de contrastes de la fuente NO vale acá**: estaba medida para texto oscuro sobre blanco y texto blanco sobre `#0F1014`.
Con la paleta nueva hay que volver a medir, y la regla de medición sigue vigente: componer los colores en un canvas, no a ojo y no parseando la cadena, porque Tailwind 4 emite `oklab()` y leerlo como RGB da números falsos.
La lección general sí se conserva: las opacidades de texto por debajo de `/60` no suelen pasar AA, en ninguna dirección.
La tabla nueva se completa en la Etapa 5, medida en el DOM.

### Superficies

- Glassmorphism con blur en header flotante, badges y overlays.
- Portadas con scrim gradient inferior para contraste de texto.
- Excepción medida: los botones de play de los carruseles usan negro semitransparente y no blur, porque cuarenta `backdrop-filter` moviéndose a la vez obligan a recalcular el fondo en cada frame.

### Micro-interacciones (60 FPS, siempre GPU-accelerated)

- **Fade Up on Scroll**: `y: 24 -> 0`, `opacity: 0 -> 1`, stagger +50ms por tarjeta.
- **Hover Life Cards**: desktop (`@media (hover: hover)`) spotlight radial más micro-tilt 3D de 4 a 6 grados; touch `active:scale-[0.98]`.
- **Content Unmasking Reveal**: contenedor `overflow-hidden`, texto de `translate-y-full` a `translate-y-0`.

**Excepción crítica**: el Hero principal nunca arranca en `opacity: 0`, tiene que estar visible de inmediato para no penalizar LCP.
`prefers-reduced-motion` reduce las animaciones decorativas a 0.01ms en `globals.css`.

### Nota: el hero de la landing lleva video

`c:\Users\dell\Downloads\ligamefinaled.mp4` es la pieza original: 25,7 MB, demasiado pesado para servir tal cual.
Antes de integrarlo en la Etapa 5 hay que comprimirlo (meta: menos de 5 MB, sin pista de audio), servirlo con `poster` para el primer render, `autoplay muted loop playsinline`, y quedarse en el póster cuando `prefers-reduced-motion` está activo.

### Accesibilidad

- Mobile-first, contraste WCAG AA, áreas táctiles mínimas de 44x44px.
- **El botón que dibuja el navegador dentro de un `input type="file"` es el objetivo táctil del campo**: los formularios usan `file:py-3`, con `py-2` medía 36px.
- Los enlaces sueltos dentro de una fila y los `summary` necesitan padding propio: la altura del renglón sola deja objetivos de 16px.

### Nota: `truncate` no funciona sobre un contenedor flex

Para dar altura táctil a un texto que además se trunca, usar `padding`, no `flex min-h-11 items-center`.
En un contenedor flex el texto pasa a ser un item anónimo y `text-overflow: ellipsis` deja de aplicarse: la cadena queda cortada al ras, sin puntos suspensivos.

### Nota: el reveal observa la máscara, no el texto

`RevealText` pone la detección de viewport en el contenedor `overflow-hidden`, no en el span que se mueve.
El span animado arranca desplazado su propia altura y queda totalmente recortado, y el IntersectionObserver tiene en cuenta el recorte de los ancestros: reportaría el elemento como fuera de vista y el texto quedaría invisible para siempre.
Vale para cualquier componente con máscara y animación.

### Assets de marca

El logo es el escudo "Liga Metropolitana 1989 Maxi Basquetbol" (dorado y blanco sobre fondo oscuro).
Los assets definitivos (logo para header, `icon.png`, `apple-icon.png`) se generan en la Etapa 5.
La lección de la fuente que aplica igual: verificar el canal alfa mirando los píxeles de las esquinas, no a ojo sobre fondo claro, y comprobar el favicon sobre `#202124` (barra de navegador en modo oscuro).
Regla general: si el logo necesita que le hagan lugar, está mal ubicado.

## 4. Decisiones propias de este proyecto

### La barra de navegación es una lista fija en el código

Decidido antes de la Etapa 1.
La fuente configuraba la barra desde la tabla `categories` (`nav_label`, `show_in_navbar`) porque tenía nueve secciones que no cabían.
Acá los enlaces de la barra son páginas fijas (Historia, Documentos, Inscríbete, Contacto), no categorías, y son 4 o 5.
Se ahorran las dos columnas, `NavbarPreview` y toda la maquinaria de medición.
`categories` queda solo para clasificar noticias.

### Las notas van a una sola columna

No hay publicidad lateral (el 160x600 de la fuente) ni la grilla de tres columnas que la acompañaba.
Los sponsors se muestran solo como logos en la landing.
El recorte del esquema quedó aplicado en la migración inicial: `sponsors` no tiene `is_featured`, `is_side_banner` ni los dos banners (con sus índices únicos parciales), y `posts` no tiene `sponsor_id` (el agradecimiento al pie tampoco va).
Si algún día se venden espacios, la maquinaria completa está documentada en la fuente.

### Se conserva la maquinaria de nota destacada

`posts.is_featured` elige la nota principal de la portada, con su índice único parcial y el intercambio hecho por el trigger `private.una_sola_nota_destacada()`.
**El trigger es `security definer` a propósito y no es un hueco de seguridad**: un editor que destaca su nota no puede apagar la destacada de otra persona por RLS (el update previo se iría filtrado sin error, devolviendo cero filas) y el insert chocaría después contra el índice único.
El trigger solo le deja ceder la portada; la escritura de su propia nota sigue pasando por RLS.
Sin ninguna destacada, la principal pasa a ser la más reciente: degradación natural, no un caso de error.

### Qué se dejó afuera del traspaso

- `media_items` y `newsletter_subscribers`: nunca se usaron en la fuente.
- YouTube entero: `lib/youtube.ts`, `VideoCard`, `VideosCarousel`, la extensión de TipTap se evalúa al copiar el editor.
- `/nosotros`, `/multimedia`, `/categoria/[slug]`.
- `CategoryColumns` y el bloque "Otras secciones".

### Qué se sumó

- Tabla `documents` con sus 4 políticas RLS y un bucket de Storage para PDFs.
- Páginas `/historia`, `/documentos`, `/inscribete`, `/contacto`.
- Sección Documentos en el CMS.

### La firma anónima no dice "Equipo HDB"

`posts.is_anonymous` firma como "Equipo Liga Metropolitana".

### Pendientes que bloquean la Etapa 6

- Proveedor de correo y protección antispam para los formularios: la fuente no tiene formularios a propósito, uno que no manda nada es peor que no tenerlo.
- Si un PDF puede superar los 16 MB del tope de Server Actions, la subida va contra Storage con URL firmada, sin que el archivo cruce por la Server Action.

## 5. CMS / Admin (`/admin`)

- Protegido en `src/proxy.ts` validando sesión vía `@supabase/ssr`.
  Next 16 renombró `middleware.ts` a `proxy.ts`; `src/lib/supabase/middleware.ts` conserva su nombre porque no es una convención del framework sino un módulo propio.
- Redirección a `/admin/login` sin sesión, y header `X-Robots-Tag: noindex, nofollow` en todas las rutas `/admin/*`.
- El proxy corre en todas las rutas y no solo en `/admin`, porque el token también se refresca navegando el sitio público.
- Se usa `getUser()` y no `getSession()`: aquel valida contra el servidor de Auth, este solo lee la cookie.
- **Signup público deshabilitado en Supabase Auth.** Usuarios solo por invitación. No negociable.
- Revalidación on-demand: al publicar/editar se llama a `revalidatePath`, y `/api/revalidate` queda protegida por `REVALIDATION_SECRET` en el header `Authorization`.
- El CMS vive en el grupo de rutas `(admin)` y el sitio en `(public)`: son dos layouts raíz hermanos.
  El admin no hereda header flotante ni footer editorial.

### Nota: el CMS se queda claro aunque el sitio es oscuro

Los componentes del admin vienen de la fuente medidos sobre blanco (`ring-black/5`, `bg-white`, badges verdes y ambar).
Re-teñirlos al paleta oscura no aporta nada a una herramienta interna.
La clase `.tema-claro` en el `<body>` del layout de `(admin)` redefine `--color-canvas` y `--color-ink` con ámbito (`#ffffff` / `#0B0C0E`).
Las utilidades de Tailwind 4 emiten `var()`, así que la cascada resuelve el resto sin duplicar componentes.

### Nota: TipTap 3 no vuelve a renderizar React al escribir

`useEditor` trae `shouldRerenderOnTransaction` en `false` por defecto desde TipTap 3.
Consecuencias si se ignora: el input oculto calculado en el render queda congelado en el documento vacío del primer montaje (el cuerpo se guarda vacío), y los botones de la barra no se marcan.
La solución vigente: el JSON se escribe en el input por `ref` desde `onUpdate` (y `onCreate`, porque TipTap normaliza el documento al arrancar), y el estado de la barra sale de `useEditorState` con selector.

### Nota: en un input oculto, `defaultValue` es `value`

En un `type="hidden"` no existe el estado "sucio" de un input normal: el IDL `value` está en modo default, así que `value` y `defaultValue` son la misma cosa y cada re-render de React pisa lo que escribió el código.
**El input oculto del editor no lleva `value` ni `defaultValue`**: el valor inicial lo escribe el propio callback de `ref` al montarlo.
Regla general: un input oculto que se escribe por código no puede recibir `value` ni `defaultValue` de React.

### Las imágenes en el cuerpo de la nota están apagadas

Es a propósito y son tres puertas: el botón de la barra no existe, la Server Action de subida está borrada (la única que de verdad importa: una Server Action es un endpoint propio), y pegar/arrastrar se intercepta y rechaza con aviso (`handlePaste`, `handleDrop` y `transformPasted`).
Sin la tercera puerta, una imagen pegada entra igual: apunta a un dominio que `next/image` no sirve o queda incrustada en base64 engordando la fila varios megas.
El renderizador y el nodo `ImagenDeCuerpo` de `lib/tiptap/imagen.ts` se conservan: sin el nodo, abrir una nota vieja con imagen y guardarla borraría epígrafe y crédito.

### Nota: el editor espeja al renderizador, y la trampa de las capas

`.prose-editor` en `globals.css` repone la tipografía del cuerpo dentro del editor, porque Preflight (el reset de Tailwind) borra los estilos del navegador y nadie los repone: sin eso un `h2` sale idéntico a un párrafo.
Las medidas siguen a las de `ArticleContent` a propósito: lo que se escribe tiene que parecerse a lo que sale publicado.
**La trampa: una utilidad de Tailwind le gana a `@layer components`**, porque la capa `utilities` va después.
Si una regla de `.prose-editor` no se ve, buscar primero la utilidad que la está pisando en el `class` de `editorProps`.

### Nota: el listado del CMS filtra por autor, y RLS no alcanza

`posts_select` deja ver lo publicado sea de quien sea, más lo propio, más todo si es admin.
Correcto para el sitio público, pero en una pantalla de edición se traduce en ver notas que no se pueden tocar.
Por eso el listado agrega `eq('author_id', ...)` cuando quien mira no es admin.
Regla general: una política de lectura más amplia que la de escritura no sirve para decidir qué mostrar en una pantalla de edición.

### Nota: con RLS, "cero filas" no es un error y hay que atajarlo a mano

Un `update` que RLS filtra no devuelve error: devuelve cero filas, y la acción festeja un guardado que no ocurrió.
**Toda acción que escribe pide el resultado con un `select` y distingue tres casos: error, cero filas, listo.**
Se detecta mirando `updated_at`, porque el trigger solo corre si la fila se tocó de verdad.

### Nota: las Server Actions traen un tope que no avisa

Next limita el cuerpo a 1 MB por defecto y el error (413, antes de correr una línea de código propio) solo se ve en los logs del servidor.
`next.config.mjs` lo sube a **16 MB**.
El tope por archivo vive en `lib/imagenes.ts` porque el navegador también lo necesita: los formularios avisan al elegir el archivo.
Las dos cifras están atadas y se mueven juntas.

### Nota: al reemplazar una imagen, la vieja se borra

`borrarImagen` en `lib/admin/storage.ts` corre al reemplazar una portada, un avatar o un logo, y al borrar la fila que los usaba.
Tres propiedades que lo hacen seguro: corre después de que la escritura en la base salió bien; si la escritura falla se borra lo recién subido; nunca tira ni devuelve error (es limpieza, no puede voltear un guardado que sí se hizo).
El bucket se valida contra la lista de permitidos y la ruta vacía se rechaza.
Cada subida genera nombre con `crypto.randomUUID()`, así que dos filas nunca comparten archivo.

### Nota: la vista previa de borradores usa el modo borrador de Next

`/admin/vista-previa?slug=` enciende `draftMode()` y redirige a la nota.
No saca al sitio del render estático: a diferencia de `cookies()`, Next resuelve `draftMode()` como apagado al generar la página y solo lo enciende para las peticiones con la cookie `__prerender_bypass`.
**Lo que autoriza no es la cookie, es la sesión**: la lectura del borrador usa el cliente con cookies y decide RLS.
Es una función aparte (`getPostBorrador`) y no una bandera en `getPostBySlug`, para que no exista camino por el que la página pública muestre un borrador.
La salida (`/salir-vista-previa`) vive fuera de `/admin` a propósito: quien necesita salir puede ser alguien cuya sesión venció y el proxy lo rebotaría.

## 6. Base de datos

### Los cuatro clientes de Supabase y cuál usar dónde

| Archivo | Para qué | Lee cookies |
|---|---|---|
| `lib/supabase/public.ts` | Lecturas públicas desde el servidor | **No** |
| `lib/supabase/server.ts` | Server Components y Actions con sesión | Sí |
| `lib/supabase/client.ts` | Navegador | Sí |
| `lib/supabase/middleware.ts` | Refresco del token, desde el proxy | Sí |

**La regla que importa**: para leer contenido público desde el servidor se usa `supabasePublic`, nunca el de `server.ts`.
Tocar cookies saca a la ruta del render estático: una sola llamada en un layout pasa todo el sitio público a dinámico y mata el ISR.

### Reglas de RLS

- Toda tabla con RLS activado tiene sus cuatro políticas (SELECT, INSERT, UPDATE, DELETE) explícitas.
  Con RLS on, sin política es acceso denegado; se declaran igual para que el permiso sea legible.
- Todas las políticas son idempotentes (`drop policy if exists` antes de `create policy`).
- Varias condiciones de escritura son literalmente `true` y no son abiertas: están declaradas solo para el rol `authenticated`.
- `private.is_admin()` consulta `profiles` y no lee el rol del JWT (un cambio de rol tiene efecto inmediato); es `security definer` porque las políticas de `profiles` no pueden consultar `profiles` sin recursión de RLS, y es segura porque no toma parámetros.

### Reparto de permisos por rol

| Tabla | Editor | Admin |
|---|---|---|
| `posts` | Solo los suyos (crear, editar, borrar) | Todos |
| `profiles` | Solo el suyo, sin poder cambiarse el rol | Todos, incluido el rol |
| `sponsors` | Todo | Todo |
| `categories` | Solo lectura | Todo |
| `documents` | Todo | Todo |

El criterio: lo estructural es del admin, el resto lo trabaja el equipo.
`documents` sigue el reparto de `sponsors`: borrar un documento es reversible (se vuelve a subir el PDF), a diferencia de borrar la nota de otra persona.
`posts` es la excepción deliberada: corregir un logo mal cargado es reversible, borrar la nota publicada de otra persona no.

### Sistema de claves

El proyecto usa las claves nuevas de Supabase, no las legacy.

| Uso | Variable | Valor |
|---|---|---|
| Cliente | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| Servidor | `SUPABASE_SECRET_KEY` | `sb_secret_...` |

La clave publicable es pública por diseño: lo que protege los datos es RLS.
La secreta bypassea RLS por completo y nunca se prefija con `NEXT_PUBLIC_` ni se importa desde un componente cliente.

### Cómo se crea el primer admin

El trigger `handle_new_user` asigna `editor` a todo usuario nuevo, y `guard_profile_role_change` impide que alguien se ascienda solo.
El primer admin se promueve a mano desde el SQL Editor del dashboard, que corre sin `auth.uid()` y no queda atrapado por el guard.

```sql
update public.profiles set role = 'admin' where id = '<uuid del usuario>';
```

## 7. Mecánica del carrusel

`components/ui/Carousel.tsx` es un solo componente cliente y las tarjetas entran como `children`: se arman en el servidor y al navegador solo baja la lógica de movimiento.

**La regla general que sale de todos sus bugs: ninguna bandera que detenga el movimiento puede depender de que llegue un evento.**
Las dos que lo hacen (`arrastrando` y `pausado`) dejan el carrusel clavado si ese evento se pierde, y se pierde más seguido de lo que uno cree.
Por eso `pausado` se corrige sola en cada frame preguntándole al DOM si hay un botón bajo el cursor (`:hover`).

Decisiones no obvias y los cinco bugs que las produjeron:

- **Se mueve con `transform`, no con `scrollLeft`**: la posición tiene que poder ser fraccionaria y `transform` se compone en la GPU.
- **La lista se repite tres veces** (con dos copias, un viewport ancho deja ver un hueco al cerrar el loop).
  Las copias 2 y 3 llevan `aria-hidden` **y** `inert`; `inert` va como booleano (React 19), la cadena vacía de React 18 no hace nada.
- **El loop se normaliza con un módulo del ancho de una copia, corrigiendo el signo**: el resto de un negativo en JS es negativo y sin la corrección arrastrar hacia atrás manda el riel fuera de vista.
- **Un arrastre de más de 8px cancela el clic que lo cierra**, con un handler en fase de captura y desbloqueo en `setTimeout` de cero.
  **Nunca con `pointer-events-none` en el riel**: el riel es el mismo elemento que tiene la captura del puntero y sin eventos dejaba de recibir el `pointerup`, el gesto no terminaba nunca y el carrusel quedaba trabado.
- **El gesto se cierra desde el riel y también desde `window`**: un arrastre que sale del riel suelta en otro elemento y el `pointerup` no llega.
- **El puntero se captura recién cuando el gesto pasa a ser arrastre, nunca en `pointerdown`**: con captura desde el inicio el `click` terminaba en el riel y ninguna tarjeta se abría.
- **La velocidad no salta, persigue**: `crucero += (objetivo - crucero) * (1 - exp(-dt / RESPUESTA))`, con el `dt` real y no un número fijo por frame.
- **La pausa por hover es solo sobre el botón de play, no sobre la tarjeta** (las tarjetas ocupan todo el riel), resuelta por delegación con `pointerover`/`pointerout`.
  `PROPS_PAUSA` vive en `lib/carousel.ts` y no en `Carousel.tsx`: ese archivo es `'use client'` y una constante importada desde ahí por un Server Component no llega con su valor.
- **El movimiento se detiene al enfocar con el teclado**, y quien pide menos movimiento no recibe desplazamiento automático pero sí puede arrastrar.

Rendimiento, encontrado midiendo:

- **El `sizes` de `next/image` va en píxeles en tarjetas de ancho fijo**, no en `vw`: con `vw` el navegador elegía la variante de 3840px para dibujar 224.
  Si se agregan tarjetas a un carrusel, revisar el `sizes` antes que ninguna otra cosa.
- Botones de play con negro semitransparente, no blur (ver sección 3).
- Un `IntersectionObserver` con 200px de margen deja quietos los carruseles fuera de pantalla; la bandera arranca en `true`.
- `draggable={false}` en cada `next/image` **y** `onDragStart` cancelado en el riel: sin las dos cosas el arrastre nativo de imágenes se come el gesto.
- Los títulos llevan alto fijo de dos líneas (`line-clamp-2` más `min-h`); con `border-box` el `min-height` incluye el padding, así que si el elemento tiene relleno propio va `min-h-[calc(2lh+...)]`.

**En las copias `aria-hidden` que deben seguir siendo clicables (avisos, no decorado) NO va `inert`**: `inert` cancela los clics.
La combinación correcta ahí es `aria-hidden` en el contenedor más `tabIndex={-1}` en el enlace.

## 8. Convenciones de código

- TypeScript estricto, sin `any` salvo justificación explícita en comentario.
- Server Components por defecto; `'use client'` solo con estado o interacción real.
- Tipos de base de datos generados con `pnpm supabase:types`, no a mano.
- Nombres de archivo de componentes en PascalCase, uno por archivo.
- Español de Chile, sin voseo, en código e interfaz.
- Nunca usar raya larga; guion simple.

## 9. Entorno de esta máquina

- **`pnpm` no está en el PATH**: usar `corepack pnpm ...` o correr `corepack enable` primero.
- **Nunca editar archivos con reemplazos de PowerShell**: lee como ANSI y corrompe los acentos.
- **Para mensajes de commit largos usar `git commit -F archivo`**: los here-strings de PowerShell se rompen con acentos.
- Proyecto Supabase: "liga metropolitana", ref `cvmhjzwrzahpbsogrhbc`, región `sa-east-1`.
- La CLI de Supabase ya está autenticada en esta máquina.

## 10. Cómo trabajar en este repo

- Este archivo es la fuente de verdad de las decisiones.
  Si una tarea contradice algo de acá, avisar antes de proceder.
- Verificar corriendo, no leyendo: levantar el preview y medir en el DOM.
- Actualizar este archivo al tomar una decisión de arquitectura o diseño, y al cerrar cada etapa.
- La bitácora corta de avance vive en `ESTADO.md`.
