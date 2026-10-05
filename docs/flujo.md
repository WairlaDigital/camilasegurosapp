# Flujo del cotizador SOAT — seguroscamila.pe

Fuentes:
- **Spec**: *Funcionalidad de diseño — Web de cotización SOAT* v1 (junio 2026). Es la fuente de verdad del producto; sus capturas son la referencia visual.
- **Referencia funcional**: el front existente `~/sites/soat-para-taxi` (Nuxt 3), que ya compra SOAT contra el mismo backend.
- **Backend**: `~/sites/app-soat-taxi` (Laravel). Contrato en [api.md](api.md).

**El front nunca se conecta a La Positiva.** Solo habla con la API `app-soat-taxi`, que es la que está homologada con La Positiva (cotización, emisión) y la que integra Culqi (órdenes y cobros). Cuando esta documentación dice "La Positiva", se refiere a datos que llegan a través de esa API.

Alcance: SOAT para usos Particular, Taxi, Carga y Comercial (solo moto lineal). Sin AFOCAT ni paneles de administración o puntos de venta.

## Pantallas

| # | Pantalla | Qué hace | API |
|---|---|---|---|
| 1 | **Inicio** (formulario) | Placa (detecta Auto/Moto), tipo y n.º de documento, uso, correo, consentimiento. CTA "Comprar SOAT virtual" | `GET /data` (catálogo de tipos y usos) |
| 2 | Consulta automática | Consulta el registro de la placa (tipo real y categoría), valida categoría y uso, y cotiza una vez con el tipo real | `POST /query-plate` (sin cotizar), luego `POST /query-info` |
| 3 | **Datos del titular** (`/cotizar/titular`, Paso 1/3) | Figma 433:174. Tipo de persona y documento, bloqueados; nombres y apellidos de `/query-info`, bloqueados si llegaron (con RUC se piden los de un contacto). Domicilio, referencia (opcional), departamento (Lima o Callao), provincia (sigue al departamento) y distrito (lista), correo (del inicio, editable) y celular. Sin comprobante. "Guardar y continuar" | — (se guarda en la sesión; se envía en `POST /data`: la referencia y la provincia van dentro del texto de la dirección) |
| 4 | **Datos del vehículo** (`/cotizar/vehiculo`, Paso 2/3) | **Siempre** se muestra. Lo que trajo la consulta de placa queda bloqueado; lo que falta lo completa la persona. Uso y tipo de vehículo quedan fijos, los de la cotización (cambiarlos exigiría otra cotización: se vuelve a cotizar desde el inicio). Solo vuelve a cotizar si se completaron datos que la placa no trajo | `GET /brands`, `/models/{brand}/type/{type}`, `/versions/{model}`; `POST /query-info` con los datos manuales solo si hace falta |
| 5 | **Cotización** (`/cotizar/cotizacion`, Paso 3/3) | "Hola {nombre}", resumen del vehículo con "Editar", tarjeta de precio con coberturas y "LO QUIERO" (sin planes AFOCAT), fecha de inicio, "Ir a pagar". El celular ya se pidió en el titular | `POST /query-info` solo al presionar "Ir a pagar" con otra fecha; si el precio cambia, se muestra y se pide confirmar |
| 6 | **Antes de pagar** (`/cotizar/antes-de-pagar`, Paso 3/3; 2/2 en la spec) | Informativa (Figma "SOAT al instante 5"): "¡Tu SOAT está casi listo!", dos notas con check (la póliza se emite al confirmar el pago y llega en PDF al correo) y "Continuar con el pago", que abre el checkout | `POST /data` (crea la orden y la orden de Culqi), con los datos del titular (paso 3) |
| 6b | **Pago rechazado** (estado de "Antes de pagar") | Culqi rechazó el cargo: "No se pudo procesar tu pago", aviso, cuatro consejos e "Intentar nuevamente", que vuelve a abrir Culqi con la misma orden | — |
| 7 | **Checkout** | Modal de **Culqi Checkout** (JS en el navegador, con la llave pública). Con tarjeta o Yape devuelve un `token`; con banca móvil, agentes o billeteras (PagoEfectivo) usa la `order` de Culqi que crea la API | `POST /data` (orden + `culqi`), luego `POST /charge` con el token. Los pagos con `order` se confirman por webhook |
| 8 | **Confirmación** (`/cotizar/confirmacion`) | Pago aprobado: "¡Listo! Recibimos tu pago", resumen (placa, vigencia, total) y "te enviaremos tu SOAT a {correo}". Pago diferido: "Tu código de pago está listo" (24 h para pagar) y opción de pagar con tarjeta o Yape | — (no hay endpoint de estado) |

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

**Implementación:** la categoría del registro llega en `vehicle.category.positiva` de `/query-info` (`Categoria.IdCategoria` de La Positiva, clases del MTC: L1–L5 = motos, M/N/O = autos, buses, camiones y remolques). Si contradice la de la placa, el inicio muestra un aviso y no guarda la sesión. Sin datos de la consulta, el backend repite la categoría del tipo enviado, así que no hay falso aviso. En "Datos del vehículo" solo se ofrecen tipos de la categoría de la placa (también se valida en el servidor).

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

**Tipo real del vehículo:** el inicio solo sabe auto/moto, pero `/query-info` cotiza con el `type_id` que enviamos. Por eso, antes de cotizar, `POST /query-plate` devuelve la clase del registro (La Positiva `IdClase`) y `catalogTypeForClass` la traduce al tipo del catálogo: 1 → Automóvil, 2 → Station wagon, 10 → Motocicleta, 25 → Mototaxi, 33 → Camioneta hasta 7 u 8 asientos (según asientos), 34 → Microbús. Es el `positiva_id` de cada tipo en la base del backend, que `GET /data` no expone. Si el uso elegido no aplica al tipo real, el inicio lo marca en el campo "Uso". Sin clase conocida se usa el tipo por defecto de la categoría (`features/quote/lib/quote-request.ts`).

**Implementación:** la tabla está en `features/quote/lib/use-matrix.ts` (tipos del catálogo asignados a cada fila; Trimoto = Motocarga es provisional). Un uso se ofrece si lo permiten la tabla **y** el catálogo; los tipos fuera de la tabla siguen el catálogo. "Comercial" no tiene IdUso, así que no se ofrece: con RUC, una moto lineal queda sin uso cotizable y el formulario lo explica. La regla RUC + moto lineal aplica en "Datos del vehículo" y, con el tipo real del registro, también en el inicio.

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

1. ~~**Datos personales para la orden.**~~ **Resuelto:** pantalla de titular como paso 1/3, antes del vehículo y la cotización (decisión 2026-10-05, orden de Figma). Con DNI/CE la API solo trae nombres; con RUC, razón social y dirección (el backend exige igual nombres y apellidos).
2. **Zona de circulación (`ubigeo_id`).** El backend la exige y el front actual pregunta Lima/Callao. La spec no tiene ese campo.
3. **Formulario manual sin placa encontrada.** Si la consulta de placa no devuelve nada, el backend descarta los datos manuales (`QueryVehicleInfo::execute` devuelve `null`). Sin vehículo no hay cotización de La Positiva, solo planes estáticos. Solo funciona cuando la consulta trae datos parciales.
4. **Placa LN-NNNN.** El backend reescribe `A1-1234` como `A11-234` (formato de auto), porque quita el guion antes de formatear. Además, sin guion `A11234` es ambiguo entre moto y auto.
5. **Catálogo.** Falta el uso Comercial para moto lineal (IdUso pendiente con Fidel), falta Camión/Furgón, y hay que confirmar si Trimoto = Motocarga.
6. **Fecha de inicio después del precio.** En la spec la fecha está debajo de la tarjeta de precio, pero cambiarla obliga a cotizar de nuevo (nuevo token y precio). El front actual bloquea la fecha una vez elegido el plan.
7. **Pago rechazado reportado como éxito.** En `PaymentService::createCharge` la excepción del SDK de Culqi se captura y se devuelve como texto, así que `/charge` responde `success`. Confirmado en el código; falta reproducirlo con una tarjeta de prueba rechazada. Riesgo alto.
8. **Estado y descarga de la póliza.** No hay endpoint público para saber si la póliza se emitió ni para descargarla (`/file/{policy}/dl` quedó sin uso; `policy_id`/`certificate_id` solo existen dentro del backend). La confirmación solo puede decir "te llegará por correo".
9. **Cotizaciones que no vencen.** `expiresAt` nunca se asigna, así que una cotización vieja se acepta.
10. **Pagos diferidos** (banca móvil, agentes, billeteras). Se confirman por webhook; el front actual no muestra nada tras generar la orden. Definir pantalla de "orden generada, paga antes de…".
11. ~~**Checkout.** Proveedor pendiente~~ **Resuelto:** la sección 9 de la spec es un error del cliente. La API ya integra Culqi (crea la orden de Culqi y cobra con el token); al front le toca integrar Culqi Checkout en el navegador.
