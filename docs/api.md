# API app-soat-taxi

Backend Laravel que expone vehículos, cotización de planes SOAT (incluida La Positiva) y emisión de pólizas. Código fuente local: `~/sites/app-soat-taxi` (`routes/api.php`, `app/Http/Controllers/Api/`).

- **Base URL (local):** `http://app-soat-taxi.test/api`, en `LAPOSITIVA_API_URL`.
- **Autenticación:** Laravel Sanctum. Header `Authorization: Bearer <token>` (`LAPOSITIVA_API_TOKEN`). Sin token o con uno inválido: `401 {"message":"Unauthenticated."}`.
- **Siempre enviar** `Accept: application/json`; si no, Laravel responde errores en HTML.
- En local `APP_DEBUG` está activo: los errores incluyen trazas y rutas del servidor. `services/http.ts` nunca reenvía el cuerpo del error a la UI.

Todo acceso pasa por `apiRequest()` en `services/http.ts`.

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
Body: `{ policy_id, certificate_id }`. Emite la póliza.

## Endpoints públicos (sin token)

Existen, pero aún no se revisaron para este front: `GET /data` (tipos de vehículo con usos y grupos de planes), `POST /data`, `POST /charge` (cobro), `GET /file/{policy}/dl` (PDF de la póliza), `POST /culqi-service` (webhook de Culqi).

## Pendiente de confirmar

- Cómo se obtienen `policy_id` y `certificate_id` para `/generar-poliza`, y si el cobro pasa por `/charge` (Culqi).
- De dónde sale el catálogo de `type_id`, `use_id` y `ubigeo_id` (¿`GET /data`?).
