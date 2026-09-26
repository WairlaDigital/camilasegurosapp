# Arquitectura por capas

El front consume una API propia que expone los planes de pólizas de La Positiva, sus precios y el flujo de compra. La lógica de negocio vive en esa API. El front solo muestra datos, valida formularios y orquesta la compra. Mantenerlo simple: sin DDD, sin puertos/adaptadores ni contenedores de inyección.

## Capas

```
UI (app, features, components)  →  services  →  API externa
              ↘ types ↙
```

1. **UI**: renderiza y maneja la interacción. No sabe cómo es la API.
2. **services**: única capa que habla con la API. Expone funciones con nombre de negocio (`getPlans`, `createQuote`), valida las respuestas y las convierte a los tipos del front.
3. **types**: tipos compartidos por UI y services.

## Estructura de carpetas

```
app/                     # Solo routing: layouts, páginas, metadata, loading/error
  planes/[planId]/page.tsx
  api/                   # Route Handlers solo si algo externo necesita un endpoint (webhooks)
components/
  ui/                    # Primitivas del design system (Button, Card, Input…). Sin datos ni negocio
  layout/                # Header, Footer, Container…
features/                # UI agrupada por funcionalidad
  plans/
    components/          # PlanCard, PlanList, PlanComparison…
    hooks/
  quote/
    components/
    actions.ts           # Server Actions ("use server"): validan input y llaman a services
  checkout/
services/
  http.ts                # fetch base: baseURL, headers, timeout, errores → ApiError
  schemas/               # Esquemas Zod de las respuestas crudas de la API + función de mapeo
    plan.schema.ts
  plans.ts               # getPlans(), getPlanById()
  quotes.ts              # createQuote()
  checkout.ts            # purchasePolicy()
types/                   # Plan, Quote, Money… (tipos del front, no de la API)
lib/                     # Utilidades genéricas: cn, formatMoney, env
```

## Reglas de dependencias

| Carpeta | Puede importar | NO puede importar |
|---|---|---|
| `types/` | nada | todo lo demás |
| `services/` | `types/`, `lib/` | `app/`, `features/`, `components/` |
| `features/`, `app/` | `services/*` (funciones públicas), `components/`, `types/`, `lib/` | `services/http`, `services/schemas/*` |
| `components/ui/` | `lib/` | `services/`, `features/`, `types/` de negocio |

ESLint aplica estas reglas (`no-restricted-imports` en `eslint.config.mjs`). No las desactives con `eslint-disable`.

## Reglas

- **Páginas delgadas.** Un `page.tsx` llama a un service y compone componentes de `features/`. Nada de `fetch` ni transformaciones de datos en `app/` o en componentes.
- **Un solo cliente HTTP** (`services/http.ts`). Todo archivo de `services/` empieza con `import 'server-only'`: la API y sus credenciales nunca llegan al navegador.
- **Validar y mapear en el borde.** Cada respuesta se parsea con Zod en `services/schemas/` y se convierte a un tipo de `types/`. Los componentes nunca reciben la respuesta cruda de la API. Si el contrato cambia, falla ahí con un error claro.
- **Errores**: `http.ts` lanza un `ApiError` con `status` y `code`. La UI decide qué mostrar; nunca muestra mensajes crudos del backend.
- **Server Actions delgadas**: validan el input con Zod, llaman al service y devuelven un resultado serializable `{ ok: true, data } | { ok: false, error }`.
- No crear abstracciones "por si acaso". Una función en `services/` es suficiente hasta que haya una necesidad real.

## Dinero y compra

- Montos como **enteros en céntimos** + código de moneda (`PEN`/`USD`). Formato solo al mostrar, con `Intl.NumberFormat('es-PE', { style: 'currency', currency })` en `lib/`.
- **El precio nunca viene del cliente.** Al comprar se envía `planId`/`quoteId`; el servidor confirma el precio con la API.
- Las cotizaciones vencen: respetar `expiresAt` y avisar a la persona si expiró.
- Toda compra envía una **clave de idempotencia** para evitar cobros duplicados por doble clic o reintentos.
- Datos personales (DNI, correo, teléfono) no van en query strings, logs ni `localStorage`.

## Configuración y secretos

- Variables en `lib/env.ts`, validadas con Zod al arrancar. `LAPOSITIVA_API_URL` y tokens **sin** prefijo `NEXT_PUBLIC_`.
- `.env.local` nunca se commitea; mantener `.env.example` actualizado.
