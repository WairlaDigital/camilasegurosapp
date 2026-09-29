# Camila Seguros — cotizador SOAT

Front de **seguroscamila.pe**: cotiza y vende el SOAT de La Positiva. Next.js 16 (App Router), React 19, Tailwind 4 y TypeScript. Consume la API Laravel **app-soat-taxi**, la misma que usa soatparataxi.pe.

## Empezar aquí

| Documento | Para qué |
|---|---|
| [AGENTS.md](AGENTS.md) | Reglas del proyecto (arquitectura, React/Next, pruebas). Léelas antes de escribir código |
| [PENDIENTES.md](PENDIENTES.md) | Backlog y **estado actual / siguiente paso** |
| [DESIGN.md](DESIGN.md) | Sistema de diseño: tokens, componentes, patrones, diferencias con Figma |
| [docs/flujo.md](docs/flujo.md) | Pantallas y reglas de negocio del cotizador |
| [docs/api.md](docs/api.md) | Contrato de la API y cómo la usa este front |

## Requisitos

- Node 24 y npm.
- Para trabajar con datos reales: la API app-soat-taxi corriendo en local (`http://app-soat-taxi.test/api`) y un token de Sanctum. Sin API se puede trabajar con el servidor falso (`npm run dev:mock`).
- Para las pruebas e2e: Google Chrome instalado (en CI, `npx playwright install chromium`).

## Configuración

```bash
npm install
cp .env.example .env.local
```

Completa `.env.local` (nunca se sube al repo):

| Variable | Qué es |
|---|---|
| `LAPOSITIVA_API_URL` | URL de la API, con `/api` al final |
| `LAPOSITIVA_API_TOKEN` | Token de Sanctum. Solo servidor: nunca con prefijo `NEXT_PUBLIC_` |
| `SESSION_SECRET` | Clave para cifrar la cookie de la cotización (mínimo 32 caracteres). Genérala con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `RATE_LIMIT_START_PER_10_MIN`, `RATE_LIMIT_REQUOTE_PER_10_MIN`, `RATE_LIMIT_CATALOG_PER_MIN` | Opcionales. Límites de uso del inicio (por IP), de las recotizaciones y de los catálogos (por persona). Por defecto 20, 10 y 60. |

Sin estas variables la app no arranca y muestra cuál falta.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | App en http://localhost:3000 contra la API real |
| `npm run dev:mock` | App en http://localhost:3100 contra el **servidor falso** (`e2e/mock-api`), sin datos reales. Placas de ejemplo: `ABC-123` (vehículo completo), `AEF-710` (incompleto), `ZZZ-999` (sin datos), `ERR-500` (error de la API) |
| `npm run build` · `npm start` | Build y servidor de producción |
| `npm run lint` · `npx tsc --noEmit` | Lint y tipos |
| `npm test` · `npm run test:watch` | Pruebas unitarias (Vitest) |
| `npm run test:e2e` | Pruebas e2e (Playwright, desktop y mobile). Hace un build y lo corre en el puerto 3211 contra el servidor falso |
| `npm run test:all` | Unitarias + e2e. Obligatorio antes de fusionar a `main` |

Next 16 permite **un solo `next dev` por carpeta**. Las e2e usan un build de producción, así que pueden correr con `npm run dev` abierto.

Cuándo correr cada verificación: [.claude/rules/react-nextjs.md](.claude/rules/react-nextjs.md#cuándo-correr-cada-verificación).

## Estructura

```
app/          Rutas: páginas, layouts, Route Handlers (/api/vehicles/*)
features/     UI por funcionalidad: home, quote (formularios, Server Actions, sesión)
components/   ui/ (primitivas del design system) y layout/ (header, footer)
services/     Única capa que habla con la API (Zod + mappers)
types/        Tipos compartidos
lib/          Utilidades (env, cn, contenido del sitio)
e2e/          Pruebas Playwright y servidor falso de la API
docs/         Flujo, API y capturas de Figma
```

Las dependencias entre capas las valida ESLint. Detalle en [.claude/rules/architecture.md](.claude/rules/architecture.md).
