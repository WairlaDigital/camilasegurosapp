# Buenas prácticas React 19 + Next.js 16

> Next 16 cambió APIs respecto a versiones anteriores. Antes de usar una API de Next, consulta `node_modules/next/dist/docs/`.

## Server vs Client Components

- **Server Components por defecto.** `'use client'` solo en hojas interactivas (formularios, toggles, selectores), lo más abajo posible en el árbol.
- Nunca marcar como cliente una página o layout completo para usar un hook: extrae el trozo interactivo a su propio componente.
- Props que cruzan la frontera servidor→cliente deben ser serializables y **mínimas**: pasa solo los campos que el componente usa, no el objeto completo.
- Código con secretos o acceso a la API: `import 'server-only'`.

## Datos

- Leer datos en Server Components llamando a funciones de `services/` (ver `architecture.md`). No usar `useEffect` + `fetch` para cargar datos iniciales.
- Peticiones independientes en paralelo con `Promise.all`; evitar cascadas de `await`.
- Streaming con `<Suspense>` y `loading.tsx` para que el shell se pinte de inmediato.
- Mutaciones (cotizar, comprar) con **Server Actions** + `useActionState` / `useFormStatus` para estados pendientes. Revalidar con `revalidateTag` / `updateTag` / `refresh` según corresponda.
- Route Handlers (`app/api/**/route.ts`) cuando algo externo necesita un endpoint HTTP (webhooks) o cuando un componente cliente consulta un catálogo (ej. `/api/vehicles/*`): validan los parámetros con Zod, llaman a `services/` y nunca devuelven detalles del backend.

## Caché

- Catálogo de planes: cacheable. Cotizaciones, datos del usuario y compra: **nunca** cacheados de forma compartida.
- Si se usa Cache Components (`cacheComponents: true`), toda directiva `'use cache'` va acompañada de `cacheLife(...)` y `cacheTag(...)` para poder invalidar (ej. `cacheTag('plans')`).
- No asumir que `fetch` cachea por defecto: la caché es explícita.

## APIs de Next 16 a recordar

- `params`, `searchParams`, `cookies()`, `headers()` y `draftMode()` son **asíncronos**: `const { planId } = await params`. Usar los tipos globales `PageProps<'/planes/[planId]'>` y `LayoutProps<'/'>`.
- `middleware.ts` está deprecado → usar `proxy.ts` con `export function proxy()`.
- `next lint` ya no existe → `npm run lint` (ESLint flat config).
- Turbopack es el bundler por defecto.

## Rutas y UX de navegación

- Cada segmento relevante tiene `loading.tsx`, `error.tsx` (Client Component con botón de reintento) y `not-found.tsx` donde aplique. Usar `notFound()` cuando un plan no exista.
- `generateMetadata` en páginas públicas de planes (título, descripción, Open Graph).
- Navegación con `<Link>`; imágenes con `next/image` (con `alt`, `sizes`); fuentes con `next/font`.

## Componentes

- Componentes pequeños, una responsabilidad, nombrados en PascalCase y en su propio archivo. Export con nombre (salvo los archivos de convención de Next que exigen `default`).
- Props tipadas con `type`, sin `any`. Preferir composición (`children`, slots) sobre props booleanas que se multiplican.
- Estado: derivar en lugar de duplicar; nada de `useEffect` para sincronizar estado derivable. Estado de filtros/paginación en la URL (`searchParams`) para que sea compartible.
- No agregar `useMemo`/`useCallback` por reflejo; solo con un problema medido (o dejarlo al React Compiler si se habilita).
- `key` estable (el id del recurso), nunca el índice en listas que cambian.

## Formularios

- Validar con el mismo esquema Zod en cliente (UX) y en servidor (seguridad). El servidor siempre revalida.
- Mensajes de error por campo, accesibles (`aria-invalid`, `aria-describedby`).
- Botón de envío deshabilitado y con indicador mientras está pendiente; evitar doble envío en compras.

## TypeScript y calidad

- `strict` activado; prohibido `any` y `as` para silenciar errores (usar Zod o type guards).
- Imports absolutos con `@/`.
- Antes de dar por terminado un cambio: `npm run lint`, `npx tsc --noEmit` y `npm test` sin errores.

## Pruebas

- **Unitarias (Vitest)**: `npm test`. Archivos `*.test.ts` junto al código. Para reglas puras (placa, usos, documento, esquemas, mappers de `services/schemas/` con respuestas reales de la API). Sin red.
- **E2E (Playwright)**: `npm run test:e2e`. Carpeta `e2e/`, proyectos `desktop` y `mobile`. Corren contra un build de producción en el puerto 3211 (Next 16 permite un solo `next dev` por proyecto). Localmente usan el Chrome instalado; en CI, `npx playwright install chromium`.
- Toda pantalla o flujo nuevo agrega su escenario e2e. Selectores por rol y label (`getByRole`, `getByLabel`), nunca por clases.

### Cuándo correr cada verificación

| Verificación | Comando | Cuándo |
|---|---|---|
| Unitarias | `npm run test:watch` | Siempre abierto mientras se editan reglas, esquemas o mappers. |
| Unitarias | `npm test` | Antes de **cada commit**. |
| Tipos y lint | `npx tsc --noEmit` · `npm run lint` | Antes de **cada commit**. |
| E2E | `npm run test:e2e` | Antes de cada commit que toque pantallas, componentes, formularios, Server Actions o el layout. |
| Todo | `npm run test:all` | Antes de **fusionar a `main`** y antes de cada despliegue. |
| Revisión visual | Navegador, ver [DESIGN.md](../../DESIGN.md#revisión-visual) | Al crear o cambiar una pantalla o un componente, antes del commit. |
| CI (cuando haya remoto) | `npm test` + `npm run test:e2e` | En cada push y en cada PR; el PR no se fusiona en rojo. |

Si una prueba falla, se corrige el código o se actualiza la prueba con una razón explícita; nunca se salta ni se borra para que pase.
- La API se llama desde el servidor de Next, así que Playwright no puede interceptarla: las e2e usan el **servidor falso** `e2e/mock-api/server.mjs` (lo levanta `playwright.config.ts`). Sus placas de ejemplo definen cada caso (ABC-123 completa, AEF-710 incompleta, ZZZ-999 sin datos, ERR-500 error). Al agregar un endpoint o un caso, se agrega también al servidor falso. Nunca usar la API real en pruebas: consulta datos de personas reales y crea cotizaciones.
- No se comparan capturas contra las exportaciones de Figma (no coinciden píxel a píxel).
