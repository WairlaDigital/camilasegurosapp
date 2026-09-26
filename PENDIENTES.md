# Pendientes

Registro de todo lo que falta decidir, recibir o corregir. Marca `[x]` al cerrar y anota la decisión debajo del ítem.
Detalle técnico de cada brecha: [docs/flujo.md](docs/flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar) · Contrato de la API: [docs/api.md](docs/api.md).

## Insumos por recibir

- [ ] **Token de la API** (Sanctum). Colocarlo en `.env.local` → `LAPOSITIVA_API_TOKEN`. No compartirlo por chat.
- [ ] **Figma**, si existe además de las capturas del documento de funcionalidad (hoy son la única referencia visual).
- [ ] **Logo e isotipo de Camila Seguros** en SVG, tipografía y colores exactos de marca.
- [ ] **Textos legales**: URL de la Política de Privacidad y del Consentimiento de datos para usos adicionales.

## Pendiente con La Positiva (Fidel)

- [ ] **Proveedor de checkout**: pasarela propia de La Positiva, Culqi de soatparataxi.pe o Culqi nuevo. Bloquea la pantalla de pago.
- [ ] **IdUso de "Comercial"** para moto lineal.
- [ ] **Mecanismo de invalidación del token** de cotización al usar "Editar" (en coordinación con la solución del bug de tokens duplicados).

## Decisiones de producto

- [ ] **Datos personales para la orden.** El backend exige nombres, apellidos, dirección, departamento y distrito, incluso con RUC. La spec no tiene formulario para ellos. ¿Qué se muestra si RENIEC/SUNAT no devuelven datos?
- [ ] **Zona de circulación (`ubigeo_id`).** El backend la exige; la spec no tiene el campo. ¿Se pregunta (Lima/Callao) o se asume?
- [ ] **Placa `LN-NNNN` (ej. A1-1234).** Sin guion es ambigua con la placa de auto `A11-234`. ¿Se exige escribir el guion?
- [ ] **Pasaporte.** El backend lo acepta, la spec solo pide DNI, CE y RUC. Por defecto: no se ofrece.
- [ ] **Fecha de inicio.** Cambiarla obliga a volver a cotizar (nuevo precio y token). ¿Se mueve antes del precio o se bloquea tras "LO QUIERO" como en soatparataxi.pe?
- [ ] **Catálogo de vehículos.** Falta Camión/Furgón. ¿Trimoto equivale a "Motocarga" (id 16)?
- [ ] **Confirmación de compra.** Sin endpoint de estado ni descarga, solo puede decir "te llegará por correo". ¿Es suficiente para la v1?
- [ ] **Pagos diferidos** (banca móvil, agentes, billeteras). Definir la pantalla de "orden generada, paga antes de…".

## Backend (`~/sites/app-soat-taxi`)

- [ ] **🔴 Pago rechazado reportado como éxito.** `PaymentService::createCharge` captura la excepción de Culqi y `/charge` responde `success`. Confirmado en el código; reproducir con tarjeta de prueba rechazada. Afecta también a soatparataxi.pe.
- [ ] **🔴 Datos manuales descartados.** Si la consulta de placa no devuelve nada, `QueryVehicleInfo::execute` devuelve `null` e ignora los datos manuales: no hay cotización de La Positiva.
- [ ] **Formato de placa `LN-NNNN`.** `formatPlate` convierte `A1-1234` en `A11-234`.
- [ ] **Uso Comercial y tipo Camión/Furgón** en el catálogo (`GET /data`).
- [ ] **Invalidar cotización/orden** al editar (hoy no hay endpoint).
- [ ] **Vencimiento de cotizaciones.** `expiresAt` nunca se asigna; una cotización vieja se acepta.
- [ ] **Cotización expirada responde 500** con mensaje genérico; debería ser 4xx con un código reconocible.
- [ ] **Nombres con RUC.** `first_name`/`last_name` obligatorios incluso para empresas; solo letras y espacios (rechaza guiones y apóstrofos).
- [ ] **Estado y descarga de la póliza** para el cliente (endpoint nuevo, p. ej. estado por orden y descarga firmada).
- [ ] Cada `POST /query-info` crea un registro `Driver` nuevo.

## Front (este repo)

- [ ] Design system a partir de las capturas: tokens en `app/globals.css`, primitivas en `components/ui/`.
- [ ] Pantalla de inicio: detección de categoría por placa, filtro de usos por tipo de vehículo, validación de documento.
- [ ] Service del catálogo (`GET /data`) con esquema Zod.
- [ ] Service de cotización (`POST /query-info`) con esquema Zod y mapeo de precio a céntimos.
- [ ] Persistir `quote_token` y `order_id` en servidor (cookie httpOnly firmada) para sobrevivir a recargas.
- [ ] `lang="es"` y metadata de Camila Seguros en `app/layout.tsx`.
