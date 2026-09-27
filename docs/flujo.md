# Flujo del cotizador SOAT — seguroscamila.pe

Fuentes:
- **Spec**: *Funcionalidad de diseño — Web de cotización SOAT* v1 (junio 2026). Es la fuente de verdad del producto; sus capturas son la referencia visual.
- **Referencia funcional**: el front existente `~/sites/soat-para-taxi` (Nuxt 3), que ya compra SOAT contra el mismo backend.
- **Backend**: `~/sites/app-soat-taxi` (Laravel). Contrato en [api.md](api.md).

Alcance: SOAT para usos Particular, Taxi, Carga y Comercial (solo moto lineal). Sin AFOCAT ni paneles de administración o puntos de venta.

## Pantallas

| # | Pantalla | Qué hace | API |
|---|---|---|---|
| 1 | **Inicio** (formulario) | Placa (detecta Auto/Moto), tipo y n.º de documento, uso, correo, consentimiento. CTA "Comprar SOAT virtual" | `GET /data` (catálogo de tipos y usos) |
| 2 | Consulta automática | Consulta la placa y cotiza | `POST /query-info` |
| 3 | **Datos incompletos** | Solo si faltan datos del vehículo. Mensaje simple + "Completa y cotiza" | — |
| 4 | **Datos del vehículo** (Paso 1) | Formulario prellenado y **editable**: uso, tipo, marca, modelo, asientos, año, VIN/serie | `GET /brands`, `/models/{brand}/type/{type}`, `/versions/{model}`, luego `POST /query-info` con los datos manuales |
| 5 | **Cotización** (`/cotizar/cotizacion`) | "Hola {nombre}", resumen del vehículo con "Editar", tarjeta de precio con coberturas y "LO QUIERO" (sin planes AFOCAT), fecha de inicio, celular, "Ir a pagar" | `POST /query-info` solo al presionar "Ir a pagar" con otra fecha; si el precio cambia, se muestra y se pide confirmar |
| 6 | **Antes de pagar** (Paso 2/2) | Informativa. "Continuar con el pago" | `POST /data` (crea la orden y la orden de Culqi) |
| 7 | **Checkout** | Modal de pago. **Proveedor pendiente** | `POST /charge` (si es Culqi) |
| 8 | Confirmación | Gracias + qué sigue (la póliza llega por correo) | — |

## Reglas de negocio

### Categoría por placa (spec 4.1)
Moto/Mototaxi/Trimoto si la placa coincide **exactamente** con uno de estos patrones; si no, es Auto/Camioneta/Camión. La categoría queda fija.

| Patrón | Ejemplo | Regex |
|---|---|---|
| NNNN-LL | 1234-AB | `^\d{4}-[A-Z]{2}$` |
| LL-NNNN | AB-1234 | `^[A-Z]{2}-\d{4}$` |
| NNNN-NL | 1234-1A | `^\d{4}-\d[A-Z]$` |
| LN-NNNN | A1-1234 | `^[A-Z]\d-\d{4}$` |

Si la consulta de placa devuelve un tipo que contradice la categoría detectada, se muestra un mensaje claro en lugar de fallar en silencio.

### Tipo de vehículo → usos (spec 2 vs catálogo real de `GET /data`)

| Spec | Usos (spec) | Catálogo backend (id → usos) |
|---|---|---|
| Auto / Camioneta | Particular, Taxi | Automóvil (1), Camioneta hasta 7 (25), Camioneta 8 (27), Station wagon (9) → Taxi (1), Particular (5) ✅ |
| Mototaxi | Particular, Taxi | Mototaxi (2) → Particular, Taxi ✅ |
| Moto lineal | Particular, **Comercial** | Motocicleta (10) → solo Particular ❌ falta Comercial |
| Camión / Furgón | Carga | **No existe** en el catálogo ❌ |
| Trimoto | Carga | ¿Motocarga (16) → Carga? Por confirmar |
| Otros | Lo que diga la API | Microbús, Ómnibus, Combi, Minivan (Servicio público - Urbano), Camioneta rural (sin usos) |

- Si solo hay un uso posible (Carga), no se muestra selector.
- **RUC + Moto lineal ⇒ solo Comercial.** No aplica a otros tipos.
- Cambiar el tipo de vehículo vuelve a filtrar los usos.

### Documento
DNI, Carné de Extranjería y RUC (el backend también acepta Pasaporte; la spec no lo incluye). El nombre del saludo viene de `document.names` (RENIEC) o `document.company_name` (SUNAT) en `/query-info`.

Validaciones tomadas del front actual y del backend (`ValidateResponseRequest`):
- DNI: 8 dígitos. RUC: 11 dígitos, empieza con 10 o 20. CE: 6–12 caracteres.
- Celular: `^9\d{8}$`.
- Correo: formato válido (el backend además verifica DNS).
- Año 1980–2030, asientos 1–99, serie alfanumérica de mín. 8.

### Token único de cotización (spec 3 y 7)
Un solo token de principio a fin. No se regenera al volver atrás ni con doble clic. "Editar" invalida el token anterior antes de crear otro. El monto del checkout sale de la cotización confirmada, nunca se recalcula.

Cómo encaja con el backend:
- `quote_token` se crea en **cada** `POST /query-info` (uno por plan dinámico).
- La orden se crea con `POST /data`. Si se reenvía `order_id`, el backend reutiliza la orden y **toma el precio de la cotización guardada** (ignora el precio del cliente). ✅
- Guardar `order_id` y `quote_token` en el servidor (cookie httpOnly firmada) para sobrevivir a recargas; el front actual lo pierde al recargar.
- No hay endpoint para invalidar una cotización u orden. ❌

## Brechas: spec vs backend (decidir antes de implementar)

1. **Datos personales para la orden.** `POST /data` exige nombres, apellidos, dirección, departamento y distrito. La spec no tiene formulario de datos personales: solo sirve si RENIEC/SUNAT los devuelven. Falta definir qué pasa si la consulta falla o si es RUC (el backend exige `first_name`/`last_name` incluso para empresas).
2. **Zona de circulación (`ubigeo_id`).** El backend la exige y el front actual pregunta Lima/Callao. La spec no tiene ese campo.
3. **Formulario manual sin placa encontrada.** Si la consulta de placa no devuelve nada, el backend descarta los datos manuales (`QueryVehicleInfo::execute` devuelve `null`). Sin vehículo no hay cotización de La Positiva, solo planes estáticos. Solo funciona cuando la consulta trae datos parciales.
4. **Placa LN-NNNN.** El backend reescribe `A1-1234` como `A11-234` (formato de auto), porque quita el guion antes de formatear. Además, sin guion `A11234` es ambiguo entre moto y auto.
5. **Catálogo.** Falta el uso Comercial para moto lineal (IdUso pendiente con Fidel), falta Camión/Furgón, y hay que confirmar si Trimoto = Motocarga.
6. **Fecha de inicio después del precio.** En la spec la fecha está debajo de la tarjeta de precio, pero cambiarla obliga a cotizar de nuevo (nuevo token y precio). El front actual bloquea la fecha una vez elegido el plan.
7. **Pago rechazado reportado como éxito.** En `PaymentService::createCharge` la excepción del SDK de Culqi se captura y se devuelve como texto, así que `/charge` responde `success`. Confirmado en el código; falta reproducirlo con una tarjeta de prueba rechazada. Riesgo alto.
8. **Estado y descarga de la póliza.** No hay endpoint público para saber si la póliza se emitió ni para descargarla (`/file/{policy}/dl` quedó sin uso; `policy_id`/`certificate_id` solo existen dentro del backend). La confirmación solo puede decir "te llegará por correo".
9. **Cotizaciones que no vencen.** `expiresAt` nunca se asigna, así que una cotización vieja se acepta.
10. **Pagos diferidos** (banca móvil, agentes, billeteras). Se confirman por webhook; el front actual no muestra nada tras generar la orden. Definir pantalla de "orden generada, paga antes de…".
11. **Checkout.** Proveedor pendiente: pasarela de La Positiva, Culqi de soatparataxi.pe o Culqi nuevo.
