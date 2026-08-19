# AGENTS.md - Liga Metropolitana

Guías generales para cualquier agente de IA (Claude Code, Cursor, Copilot,
etc.) que trabaje en este repositorio.

## General Guidelines

- Nunca usar la raya "—" (em dash).
  Usar guion simple "-" en su lugar.
- Al escribir mensajes de commit, nunca agregar el nombre del agente como
  co-author.
- Nunca modificar manualmente `CHANGELOG.md` ni ningún archivo marcado
  como auto-generado.
- Al escribir o editar sustancialmente archivos Markdown largos, poner
  cada oración completa en su propia línea.
  Mantener la estructura normal de Markdown, pero evitar encadenar varias
  oraciones en una misma línea física.
- Al tomar decisiones técnicas, no darle mucho peso al costo de
  desarrollo.
  Preferir en cambio calidad, simplicidad, robustez, escalabilidad y
  mantenibilidad a largo plazo.
- Al hacer bug fixes, siempre empezar reproduciendo el bug en un entorno
  E2E lo más alineado posible con la experiencia real del usuario final.
  Esto asegura encontrar el problema real, para que la solución lo
  resuelva de verdad.
- Al hacer testing end-to-end de un producto, ser exigente con la UI que
  se observa y obsesionarse con el pixel-perfect.
  Si algo se ve claramente mal, aunque no esté directamente relacionado
  con la tarea en curso, intentar corregirlo de paso.
- Aplicar ese mismo estándar alto a la excelencia de ingeniería: lint,
  fallos de tests y flakiness de tests.
  Si se detecta alguno, aunque no lo haya causado la tarea actual,
  corregirlo igual.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
