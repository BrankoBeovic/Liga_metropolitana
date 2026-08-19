# ESTADO - Bitácora de avance

Bitácora corta para retomar en otra sesión sin releer todo.
El detalle de cada decisión vive en `CLAUDE.md`.

## Etapa actual: 3 (Supabase, proxy y tipos) - cerrada

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
| 4. CMS | Pendiente |
| 5. Sitio público | Pendiente |
| 6. Lo nuevo (historia, documentos, inscríbete, contacto) | Pendiente |
| 7. Documentación | Pendiente |
