<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proyecto: Camila Seguros (front La Positiva)

Front en Next.js que consume una API propia con los planes de pólizas de La Positiva y sus precios, y permite comprarlos.

Reglas de desarrollo (obligatorias, léelas antes de escribir código):

- [Arquitectura por capas](.claude/rules/architecture.md) — UI (`app`, `features`, `components`) → `services` → API; `types` compartidos. Reglas de dinero y compra.
- [React y Next.js](.claude/rules/react-nextjs.md) — Server Components por defecto, Server Actions, caché explícita, APIs de Next 16.
- [UI/UX](.claude/rules/ui-ux.md) — design system con tokens, estados obligatorios, flujo de compra, accesibilidad.

Resumen rápido:

1. Las páginas en `app/` solo componen; no hacen `fetch` ni lógica de negocio.
2. Solo `services/` habla con la API; valida la respuesta con Zod y la convierte a los tipos de `types/`.
3. Montos en céntimos enteros; el precio se revalida en servidor al comprar; compras con idempotencia.
4. `'use client'` solo en hojas interactivas. Sin `any`.
5. Toda vista de datos tiene estados de carga, vacío, error y éxito. Mobile-first y WCAG AA.
6. Antes de terminar: `npm run lint` y `npx tsc --noEmit` sin errores.
