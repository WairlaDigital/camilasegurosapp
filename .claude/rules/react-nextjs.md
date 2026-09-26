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
- Route Handlers (`app/api/**/route.ts`) solo cuando algo externo necesita un endpoint HTTP (webhooks de pago, callbacks).

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
- Antes de dar por terminado un cambio: `npm run lint` y `npx tsc --noEmit` sin errores.
- Tests: los esquemas/mapeos de `services/schemas/` se prueban con respuestas reales de ejemplo de la API; los componentes con lógica, con Testing Library.
