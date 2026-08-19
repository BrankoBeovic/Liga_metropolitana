# ESTADO - Bitácora de avance

Bitácora corta para retomar en otra sesión sin releer todo.
El detalle de cada decisión vive en `CLAUDE.md`.

## Etapa actual: 1 (Infraestructura y memoria) - cerrada

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
| 2. Base de datos | Pendiente |
| 3. Supabase, proxy y tipos | Pendiente |
| 4. CMS | Pendiente |
| 5. Sitio público | Pendiente |
| 6. Lo nuevo (historia, documentos, inscríbete, contacto) | Pendiente |
| 7. Documentación | Pendiente |
