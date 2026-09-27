# API app-soat-taxi

Backend Laravel que expone vehículos, cotización de planes SOAT (incluida La Positiva) y emisión de pólizas. Código fuente local: `~/sites/app-soat-taxi` (`routes/api.php`, `app/Http/Controllers/Api/`).

- **Base URL (local):** `http://app-soat-taxi.test/api`, en `LAPOSITIVA_API_URL`.
- **Autenticación:** Laravel Sanctum. Header `Authorization: Bearer <token>` (`LAPOSITIVA_API_TOKEN`). Sin token o con uno inválido: `401 {"message":"Unauthenticated."}`.
- **Siempre enviar** `Accept: application/json`; si no, Laravel responde errores en HTML.
- En local `APP_DEBUG` está activo: los errores incluyen trazas y rutas del servidor. `services/http.ts` nunca reenvía el cuerpo del error a la UI.

Todo acceso pasa por `apiRequest()` en `services/http.ts`.

## Cómo lo usa este front

| Endpoint | Dónde | Notas |
|---|---|---|
| `GET /data` | `services/catalog.ts` → `getVehicleTypes()` | Caché 24 h. Se descartan los tipos sin usos. |
| `GET /brands?search=` | `/api/vehicles/brands` → `searchBrands()` | 2.684 marcas: siempre búsqueda remota. Ids **locales**. |
| `GET /models/{brand}/type/{type}` | `/api/vehicles/models` → `getModels()` | Ids de **La Positiva**, llegan como texto. |
| `GET /versions/{model}` | `/api/vehicles/versions` → `getVersions()` | Ids de **La Positiva**, llegan como número. |
| `POST /query-info` | `services/quotes.ts` → `queryInfo()` | Inicio (sin datos manuales) y datos del vehículo (con `brand_id` local, `model_id`/`version_id` de La Positiva, `seats`, `year`, `serial`, `vin`: todos o ninguno). **Cada llamada crea una cotización nueva**: una por paso, más una en la cotización si se cambia la fecha de inicio (`start_date`, siempre se envía; por defecto hoy en Lima). El mapper descarta los planes AFOCAT (nombre "AFOCAT--…"): no se venden en seguroscamila.pe. |

En las pruebas e2e todo esto lo responde el servidor falso `e2e/mock-api/server.mjs`.

## Endpoints protegidos (requieren token)

### `GET /brands`
Marcas de vehículos. Query opcional: `search`, `limit` (máx. 100).
Respuesta: `{ data: [{ id, name }] }`.

### `GET /models/{brand}/type/{type}`
Modelos de una marca para un tipo de vehículo. `brand` es el id de marca, `type` el id de tipo. Query: `search`, `limit`.
Respuesta: `{ data: [{ id, name }] }`. `503 { error }` si La Positiva no responde.

### `GET /versions/{modelId}`
Versiones de un modelo. Query: `search`, `limit`.
Respuesta: `{ data: [{ id, name }] }`. `503 { error }` si La Positiva no responde.

### `POST /query-plate`
Datos del vehículo por placa. Body: `{ plate }`.
Respuesta: `{ data: VehicleInfo }` · `404 { error }` si no hay información.

### `POST /query-info` — cotización
Devuelve titular, vehículo y planes con precio.

| Campo | Tipo | Notas |
|---|---|---|
| `document_type` | int | `1` DNI · `2` RUC · `3` Carnet de Extranjería · `12` Pasaporte |
| `document_number` | string | |
| `plate` | string | El backend la normaliza (mayúsculas, guion) |
| `type_id` | int | Tipo de vehículo |
| `use_id` | int | Uso del vehículo |
| `ubigeo_id` | string(6) | Código de ubigeo |
| `start_date` | `YYYY-MM-DD` | Opcional. Inicio de vigencia |
| `brand_id`, `model_id`, `version_id`, `seats`, `year`, `serial`, `vin` | | Opcionales, **todos o ninguno** (datos manuales del vehículo). `year` 1980–2030, `seats` 1–99, `serial`/`vin` mín. 8 caracteres |

Respuesta (las claves nulas se omiten):

```jsonc
{
  "document": { "id", "names", "last_name", "company_name", "address", "state", "district",
                "document_number", "doc_type", "person_type", "document_type_label", "person_type_label" },
  "vehicle":  { "plate", "color", "steering_wheel", "circulation_zone", "commercial_value", "year",
                "seats", "tons", "vin", "serial", "engine",
                "category", "type", "use", "brand", "model", "version", "origin" },
  "plans":    { "id", "featured", "plans": [{ "id", "name", "price", "quote_token", "features" }] }
}
```

Notas de negocio:
- `price` es un **decimal en soles** (float). El mapper lo convierte a céntimos enteros: `Math.round(price * 100)`.
- Si no hay stock de La Positiva o la cotización dinámica falla, el backend **quita** los planes dinámicos y los de La Positiva. La UI debe soportar que la lista cambie o venga vacía.
- `quote_token` identifica la cotización del plan dinámico.

### `POST /generar-poliza`
Body: `{ policy_id, certificate_id }` (ids internos de La Positiva). Devuelve el PDF de la póliza en base64 (`data.Pdf_Data`). Sin validación de request; solo lo usa el panel de administración.

## Endpoints públicos (sin token)

El front actual (`soat-para-taxi`) igual envía el Bearer en todas las llamadas; `apiRequest()` hace lo mismo.

### `GET /data` — catálogo
Tipos de vehículo con sus usos permitidos (cacheado para siempre en el backend). `groups` ya no se usa: los planes salen de `/query-info`.

```jsonc
{ "types": [{ "id", "order", "name", "uses": [{ "id", "name" }] }], "groups": [ ... ] }
```

`ubigeo_id` no tiene catálogo: el front actual usa Lima `150101` y Callao `070101`.

### `POST /data` — crear orden
Crea (o reutiliza, si llega `order_id`) la póliza pendiente, el conductor y una orden de Culqi que vence en 24 h.

```jsonc
{
  "reseller": null,
  "order_id": null,            // id de la póliza en reintentos
  "driver": { "id", "document_type", "document_number", "first_name", "last_name", "company_name",
              "address", "phone", "email", "state", "district", "country_code": "PE" },
  "vehicle": { "plate", "type_id", "use_id", "color", "seats", "year_built", "serial", "vin",
               "ubigeo_id", "brand", "model", "version" },
  "plan": { "id", "title", "price", "token" },   // token = quote_token
  "delivery": { "date": "YYYY-MM-DD" },
  "is_renewable": false,
  "accept_terms": true
}
```

Respuesta: `{ "order_id", "culqi": { "amount" /* céntimos */, "title", "currency", "order" /* id de orden Culqi */ } }`.

- Con `plan.token`, **el precio sale de la cotización guardada**; el precio enviado se ignora.
- Validación (`ValidateResponseRequest`): nombres y apellidos solo letras y espacios (mín. 2, obligatorios incluso con RUC), `phone` empieza con 9, `email` con verificación DNS, `serial` alfanumérico mín. 8, `year_built` 1980–2030.
- Cotización inválida o expirada → **500** con mensaje genérico (no 422).

### `POST /charge` — cobrar con token de Culqi
Body: `{ "token": <objeto Culqi.token completo>, "order": <order_id> }`.
Respuesta **siempre HTTP 200**: `{ "status": "success" }` o `{ "status": "error", "data": { "user_message" } }`.

⚠ Un rechazo del SDK de Culqi se captura y termina como `success` (ver [flujo.md](flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar)).

Tras el pago, Culqi llama al webhook `POST /culqi-service`, que dispara la emisión en La Positiva (`IssuePolicyJob`) y el envío por correo. Los pagos diferidos (banca móvil, agentes, billeteras) también se confirman por ese webhook.

### Otros
- `GET /file/{policy}/dl`: descarga firmada del PDF. Hoy no se genera ninguna URL firmada: sin uso.
- `POST /generar-poliza` (protegido): lo usa solo el panel de administración; `policy_id`/`certificate_id` no están disponibles para el front.
