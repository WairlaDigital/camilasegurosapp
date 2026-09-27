# Pendientes

Registro de todo lo que falta decidir, recibir o corregir. Marca `[x]` al cerrar y anota la decisión debajo del ítem.
Detalle técnico de cada brecha: [docs/flujo.md](docs/flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar) · Contrato de la API: [docs/api.md](docs/api.md).

## Insumos por recibir

- [ ] **Token de la API** (Sanctum). Colocarlo en `.env.local` → `LAPOSITIVA_API_TOKEN`. No compartirlo por chat.
- [x] **Figma**. Recibido 2026-09-26. Lineamientos en [DESIGN.md](DESIGN.md); capturas en [docs/figma/](docs/figma).
- [x] **Recursos del home** exportados de Figma (2026-09-27): foto del hero, ícono de categoría auto, 4 íconos de beneficios y 5 de coberturas. Integrados y revisados contra Figma.
- [ ] **Recursos que aún faltan:** ícono de menú mobile ([559:71](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=559-71), hoy es un ícono CSS provisional) y manchas decorativas del fondo ([197:296](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-296), [197:297](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-297)).
- [ ] **Respuestas de la FAQ.** Figma solo trae la primera; las otras 5 son textos provisionales en `features/home/content.ts`. Validarlas.
- [x] **Logo, tipografía y colores**. Tomados de Figma (Red Hat Display, violeta `#4740de`).
- [ ] **URLs del sitio**: menú (Seguros, Beneficios, Testimonios, Blog), Contáctanos, Términos y Condiciones, Facebook. Hoy son `#` en `lib/site.ts`.
- [ ] **Textos legales**: URL de la Política de Privacidad y del Consentimiento de datos para usos adicionales.

## Pendiente con La Positiva (Fidel)

- [ ] **Proveedor de checkout**: pasarela propia de La Positiva, Culqi de soatparataxi.pe o Culqi nuevo. Bloquea la pantalla de pago.
- [ ] **IdUso de "Comercial"** para moto lineal.
- [ ] **Mecanismo de invalidación del token** de cotización al usar "Editar" (en coordinación con la solución del bug de tokens duplicados).

## Decisiones de producto

- [ ] **Datos personales para la orden.** Figma agrega la pantalla "Completa los datos del titular" (tipo de persona, documento, apellidos, nombres, domicilio, referencia, departamento/provincia/distrito, correo, celular, comprobante a nombre del contratante), que la spec no tiene. Falta definir en qué paso va y qué campos llegan prellenados de RENIEC/SUNAT. El backend no recibe provincia, referencia ni la opción de comprobante.
- [ ] **Orden de pasos.** Figma usa "PASO x/3" (titular → vehículo → cotización); la spec usa "PASO 1" en vehículo y "PASO 2/2" en "Antes de pagar".
- [ ] **Entrega por WhatsApp.** El hero y la FAQ de Figma dicen que el SOAT llega por WhatsApp; el backend solo envía correo.
- [ ] **"Desde S/33 al año"** en el hero: confirmar el precio mínimo real.
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

- [x] Design system desde Figma: tokens en `app/globals.css`, primitivas en `components/ui/`, header y footer en `components/layout/`.
- [x] Pantalla de inicio: hero, formulario con detección de categoría por placa, filtro de usos por categoría, validación de documento (cliente y servidor); coberturas y FAQ. Verificada contra Figma en 430, 1100 y 1640 px.
- [ ] Conectar el envío del formulario de inicio: hoy solo valida (`features/quote/actions.ts`). Falta consultar la placa/cotizar, guardar el estado y pasar al siguiente paso (depende del orden de pasos y del token).
- [ ] Pantalla "Datos incompletos" (transición hacia el formulario del vehículo).
- [ ] Pantalla "Completa los datos del titular" (depende de la decisión sobre datos personales y orden de pasos).
- [ ] Pantalla "Ingresa los datos de su vehículo": campos prellenados y editables, marca/modelo/versión remotos.
- [ ] Pantalla de cotización: saludo, resumen del vehículo con "Editar", tarjeta de plan, fecha de inicio, celular.
- [ ] Pantalla "Antes de pagar" (informativa).
- [ ] Checkout (bloqueado por la decisión del proveedor de pago).
- [ ] Pantalla de confirmación de compra (y de orden generada para pagos diferidos).
- [ ] Service del catálogo (`GET /data`) con esquema Zod.
- [ ] Service de cotización (`POST /query-info`) con esquema Zod y mapeo de precio a céntimos.
- [ ] Persistir `quote_token` y `order_id` en servidor (cookie httpOnly firmada) para sobrevivir a recargas.
- [x] `lang="es"` y metadata de Camila Seguros en `app/layout.tsx`.
- [x] Pruebas: Vitest (reglas de placa, usos y documento) y Playwright (home en desktop y mobile).
- [ ] Servidor falso de la API para las e2e cuando el flujo consulte placa/cotización (las llamadas salen del servidor de Next, Playwright no puede interceptarlas).
- [ ] Correr `npm test` y `npm run test:e2e` en CI cuando haya remoto.

### Diseño

- [ ] Verificar contra Figma el estado marcado del checkbox de consentimiento (no aparece en las capturas).
- [ ] Confirmar si la etiqueta azul (`info`) del campo de fecha es intencional; hoy se unificó en `brand-500` (ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones)).
- [ ] Footer mobile: Figma oculta el mapa de sitio, seguros y redes sociales (incluido "Términos y Condiciones"). Confirmar que es intencional.
- [ ] Selector de uso del home: antes de ingresar la placa queda deshabilitado ("Primero ingresa tu placa"); Figma no define ese estado.
