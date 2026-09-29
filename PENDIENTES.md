# Pendientes

Registro de todo lo que falta decidir, recibir o corregir. Marca `[x]` al cerrar y anota la decisión debajo del ítem.
Detalle técnico de cada brecha: [docs/flujo.md](docs/flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar) · Contrato de la API: [docs/api.md](docs/api.md).

## Estado actual y siguiente paso

_Actualizado: 2026-09-29. Actualiza esta sección al cerrar cada tarea._

**Hecho (en `main`):**
- Reglas del proyecto, sistema de diseño desde Figma ([DESIGN.md](DESIGN.md)) y pruebas (Vitest + Playwright con servidor falso de la API).
- Flujo: inicio → `POST /query-info` → "Datos incompletos" → "Datos del vehículo" → nueva cotización con datos manuales. El estado viaja en una cookie cifrada.
- Pantalla de cotización (`/cotizar/cotizacion`): saludo, resumen del vehículo con "Editar", tarjeta del plan sin AFOCAT, fecha de inicio, celular e "Ir a pagar". Si la fecha cambió, vuelve a cotizar una sola vez; si el precio cambió, lo muestra y pide confirmar de nuevo.
- Pantalla "Antes de pagar" (`/cotizar/antes-de-pagar`, spec sección 8). "Ir a pagar" guarda plan y celular y lleva a ella. "Continuar con el pago" muestra un aviso provisional (buscar `TODO(checkout)`).
- Reglas de la spec secciones 2, 4.1 y 4.2: tabla tipo → usos propia (`features/quote/lib/use-matrix.ts`), uso único sin selector, categoría fija por la placa, aviso si el registro vehicular la contradice y RUC + moto lineal sin Particular.
- Tipo real del vehículo: el inicio consulta `POST /query-plate` (sin cotizar) y cotiza una sola vez con el tipo del registro.
- Límites de uso: `/api/vehicles/*` con sesión y límite por persona; el inicio por IP; recotizar por persona (`lib/rate-limit.ts`, `features/quote/lib/limits.ts`).

**Siguiente: checkout con Culqi.** La API ya integra Culqi; al front le toca: crear la orden (`POST /data`, devuelve `order_id` y los `settings` de Culqi), abrir Culqi Checkout en el navegador, enviar el `token` a `POST /charge` y, si la persona elige un pago diferido (PagoEfectivo con la `order`), mostrar "orden generada". Falta la **llave pública de Culqi** y pedir al titular los datos que la API no trae (con DNI: dirección, departamento y distrito; ver "Datos personales para la orden"). Mientras tanto: configurar las reglas del WAF de Vercel cuando exista el proyecto. La pantalla "Completa los datos del titular" espera la decisión sobre datos personales y orden de pasos.

**Para arrancar:** ver [README.md](README.md) (instalación, `.env.local`, `npm run dev:mock`, pruebas) y [AGENTS.md](AGENTS.md) (reglas). El `.env.local` real está en la carpeta principal del repo; un worktree nuevo no lo trae: cópialo o, para revisar a mano, usa `npm run dev:mock` con un `SESSION_SECRET` de prueba.

## Insumos por recibir

- [x] **Token de la API** (Sanctum) en `.env.local`. Probado con los catálogos (2026-09-27).
- [x] **`SESSION_SECRET`** en el `.env.local` local (carpeta principal y worktree). Falta definirlo en cada entorno de despliegue (ver `.env.example`); sin él la app no arranca.
- [x] **Figma**. Recibido 2026-09-26. Lineamientos en [DESIGN.md](DESIGN.md); capturas en [docs/figma/](docs/figma).
- [x] **Recursos del home** exportados de Figma (2026-09-27): foto del hero, ícono de categoría auto, 4 íconos de beneficios y 5 de coberturas. Integrados y revisados contra Figma.
- [ ] **Recursos que aún faltan:** ícono de menú mobile ([559:71](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=559-71), hoy es un ícono CSS provisional) y manchas decorativas del fondo ([197:296](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-296), [197:297](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-297)).
- [ ] **Respuestas de la FAQ.** Figma solo trae la primera; las otras 5 son textos provisionales en `features/home/content.ts`. Validarlas.
- [ ] **Llave pública de Culqi** (`pk_test_…` para desarrollo y `pk_live_…` para producción). Es pública por diseño (va al navegador como `NEXT_PUBLIC_CULQI_PUBLIC_KEY`); la llave secreta vive solo en la API.
- [x] **Logo, tipografía y colores**. Tomados de Figma (Red Hat Display, violeta `#4740de`).
- [ ] **URLs del sitio**: menú (Seguros, Beneficios, Testimonios, Blog), Contáctanos, Términos y Condiciones, Facebook. Hoy son `#` en `lib/site.ts`.
- [ ] **Textos legales**: URL de la Política de Privacidad y del Consentimiento de datos para usos adicionales.

## Pendiente con La Positiva (Fidel)

- [x] **Proveedor de checkout.** Decidido (2026-09-27): Culqi, a través de la API. La sección 9 de la spec ("pendiente con La Positiva") era un error del cliente: el front nunca se conecta a La Positiva, solo a la API, que ya integra Culqi (`token` para tarjeta/Yape y `order` para PagoEfectivo). Falta la integración front con Culqi Checkout.
- [ ] **IdUso de "Comercial"** para moto lineal.
- [ ] **Mecanismo de invalidación del token** de cotización al usar "Editar" (en coordinación con la solución del bug de tokens duplicados). Hoy "Editar" → "Guardar y continuar" crea una cotización nueva que reemplaza a la anterior en la sesión (y borra el plan elegido); la anterior sigue válida en el backend.

## Decisiones de producto

- [ ] **Datos personales para la orden.** `POST /data` exige nombres, apellidos, dirección, departamento y distrito. Lo que devuelve `/query-info` depende del documento (`CreateDriverFromDocument` en el backend): con **DNI o CE** solo nombres y apellidos (el backend no guarda la dirección de personas); con **RUC**, razón social, dirección, departamento y distrito, pero no nombres ni apellidos. Por eso hay que pedir los datos que falten, como hace soat-para-taxi (`components/forms/police.vue`: campos prellenados y bloqueados si la API los trajo). Falta decidir en qué paso va. Figma agrega la pantalla "Completa los datos del titular" (tipo de persona, documento, apellidos, nombres, domicilio, referencia, departamento/provincia/distrito, correo, celular, comprobante a nombre del contratante), que la spec no tiene. Falta definir en qué paso va y qué campos llegan prellenados de RENIEC/SUNAT. El backend no recibe provincia, referencia ni la opción de comprobante.
- [ ] **Orden de pasos.** Figma usa "PASO x/3" (titular → vehículo → cotización); la spec usa "PASO 1" en vehículo y "PASO 2/2" en "Antes de pagar". **Provisional:** "Antes de pagar" también dice "PASO 3/3" para no retroceder en la numeración.
- [ ] **Entrega por WhatsApp.** El hero y la FAQ de Figma dicen que el SOAT llega por WhatsApp; el backend solo envía correo.
- [ ] **"Desde S/33 al año"** en el hero: confirmar el precio mínimo real.
- [ ] **Zona de circulación (`ubigeo_id`).** El backend la exige; la spec no tiene el campo. **Hoy se envía Lima (150101) de forma provisional** (`DEFAULT_UBIGEO_ID`). ¿Se pregunta (Lima/Callao) o se asume?
- [ ] **Tipo de vehículo inicial.** `/query-info` exige `type_id` y el inicio solo sabe auto/moto + uso. **Provisional:** auto → Automóvil; moto → Motocicleta (particular), Mototaxi (taxi), Motocarga (carga). En "Datos del vehículo" se puede corregir. Auto + Carga y Comercial muestran "no podemos cotizar en línea" hasta tener Camión/Furgón e IdUso Comercial. **Actualizado:** el tipo por defecto solo se usa si la consulta de placa no trae la clase del vehículo; si la trae, se cotiza con el tipo real.
- [ ] **Placa `LN-NNNN` (ej. A1-1234).** Sin guion es ambigua con la placa de auto `A11-234`. ¿Se exige escribir el guion?
- [ ] **Pasaporte.** El backend lo acepta, la spec solo pide DNI, CE y RUC. Por defecto: no se ofrece.
- [ ] **Fecha de inicio.** Cambiarla obliga a volver a cotizar (nuevo precio y token). ¿Se mueve antes del precio o se bloquea tras "LO QUIERO" como en soatparataxi.pe? **Provisional:** la fecha queda debajo del precio y es editable. "Ir a pagar" vuelve a cotizar una sola vez si la fecha cambió y, si el precio cambió, lo muestra y pide confirmar. Rango permitido: de hoy (Lima) a 12 meses (`MAX_START_DAYS`), a confirmar con La Positiva.
- [ ] **Catálogo de vehículos.** Falta Camión/Furgón. ¿Trimoto equivale a "Motocarga" (id 16)? **Provisional:** sí, en la tabla de `use-matrix.ts`.
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
- [ ] **Exponer la clase de La Positiva (`positiva_id`) en `GET /data`.** Hoy el front traduce clase → tipo con una tabla fija (`catalogTypeForClass`) copiada de la base del backend; si cambian los tipos, hay que actualizarla a mano.
- [ ] **Caché de la consulta de placa.** `getPlate` no guarda caché: al iniciar, la placa se consulta dos veces (`/query-plate` y dentro de `/query-info`).

## Front (este repo)

- [x] Design system desde Figma: tokens en `app/globals.css`, primitivas en `components/ui/`, header y footer en `components/layout/`.
- [x] Pantalla de inicio: hero, formulario con detección de categoría por placa, filtro de usos por categoría, validación de documento (cliente y servidor); coberturas y FAQ. Verificada contra Figma en 430, 1100 y 1640 px.
- [x] Envío del formulario de inicio conectado a `POST /query-info`; resultado en sesión cifrada; vehículo incompleto → "Datos incompletos". Si el vehículo está completo, falta redirigir a la cotización (pantalla pendiente).
- [x] Pantalla "Datos incompletos" (falta la ilustración del auto con alerta).
- [ ] Pantalla "Completa los datos del titular" (depende de la decisión sobre datos personales y orden de pasos).
- [x] Pantalla "Ingresa los datos de tu vehículo": prellenada y editable, marca con autocompletado remoto, modelo y versión del catálogo, serie y VIN por separado. Revisada contra Figma en desktop y mobile. Al guardar vuelve a cotizar con los datos manuales; falta redirigir a la cotización.
- [x] Pantalla de cotización: saludo, resumen del vehículo con "Editar", tarjeta de plan, fecha de inicio, celular. Revisada contra Figma en 430, 1100 y 1640 px. Falta redirigir "Ir a pagar" a "Antes de pagar".
- [x] Pantalla "Antes de pagar" (informativa, spec sección 8). Revisada contra la captura de la spec en 1440 px y en mobile. "Continuar con el pago" espera el checkout.
- [x] **Tabla tipo → usos (spec sección 2) y categoría fija (spec 4.1).** Tabla propia en `features/quote/lib/use-matrix.ts`, validada en cliente y servidor. Uso único sin selector. "Datos del vehículo" solo ofrece tipos de la categoría de la placa. Si el registro vehicular contradice la categoría de la placa, el inicio avisa y no sigue.
- [x] **RUC + moto lineal ⇒ solo "Comercial" (spec 4.2)** en "Datos del vehículo". Como "Comercial" aún no tiene IdUso, esa combinación queda sin uso cotizable y el formulario lo explica.
- [x] **Tipo real del vehículo en el camino directo.** El inicio consulta `POST /query-plate` (sin cotizar), traduce la clase de La Positiva al tipo del catálogo y cotiza una vez con él. Si el uso no aplica al tipo real (o es RUC + moto lineal), lo marca en el campo "Uso".
- [x] Los errores por campo que devuelve una Server Action (p. ej. 422 de la API en placa o documento) quedaban ocultos al enviar un formulario válido. Corregido en los tres formularios.
- [ ] Checkout con **Culqi Checkout** (`https://js.culqi.com/checkout-js`): `POST /data` → abrir el modal con `settings` y `client.email` → `token` a `POST /charge` (Server Action) → confirmación; `order` → pantalla de orden generada. Manejar `REVIEW` (3DS) y errores con `user_message`. Hoy "Continuar con el pago" muestra un aviso provisional (`TODO(checkout)`).
- [ ] Pantalla de confirmación de compra (y de orden generada para pagos diferidos).
- [x] Services de catálogo (`/data`, `/brands`, `/models`, `/versions`) y cotización (`/query-info`) con Zod y precio en céntimos.
- [x] Estado del flujo en cookie httpOnly cifrada (sobrevive recargas). Guarda la fecha cotizada, los datos manuales del vehículo (para volver a cotizar) y la elección (plan y celular). Falta sumar `order_id` cuando exista el pago.
- [x] **Rate limiting.** `/api/vehicles/*` exigen sesión de cotización (401) y tienen 60 consultas por minuto por persona (429 con `Retry-After`). El inicio: 20 envíos cada 10 min por IP (margen amplio por CGNAT de los operadores móviles). Guardar vehículo y recotizar por fecha: 10 cada 10 min por persona. Valores configurables (`RATE_LIMIT_*`, ver `.env.example`).
- [x] **Despliegue: Vercel, plan Hobby** (decisión del cliente, 2026-09-29). Riesgo conocido y aceptado: las reglas de uso justo de Vercel limitan Hobby a uso personal no comercial y consideran comercial procesar pagos; Vercel puede suspender el proyecto. Pasar a Pro lo resuelve.
- [ ] **Reglas del WAF de Vercel** (Hobby: hasta 3 reglas, límites por IP, 1.000.000 de peticiones permitidas incluidas): 1) `/api/vehicles/*` por IP; 2) POST a `/` (envío del inicio) por IP; 3) libre. Configurar cuando exista el proyecto en Vercel (panel o `vercel firewall rules add … --rate-limit-keys ip`). El límite en memoria por persona queda como segunda capa; Redis/Upstash no hace falta.
- [ ] **Límites en producción.** Hoy las cuentas viven en la memoria del proceso (`lib/rate-limit.ts`): en Vercel cada instancia cuenta por separado, por eso la primera barrera son las reglas del WAF. El límite por IP en el código es confiable en Vercel, que reescribe `x-forwarded-for`.
- [x] **Filtrar planes AFOCAT** en la cotización: el mapper de `/query-info` descarta los planes cuyo nombre empieza con "AFOCAT" (el backend no expone la aseguradora). Si no queda ninguno, la pantalla muestra un estado vacío.
- [x] `lang="es"` y metadata de Camila Seguros en `app/layout.tsx`.
- [x] Pruebas: Vitest (reglas de placa, usos y documento) y Playwright (home en desktop y mobile).
- [x] Servidor falso de la API para las e2e (`e2e/mock-api/server.mjs`).
- [ ] Correr `npm test` y `npm run test:e2e` en CI cuando haya remoto.

### Diseño

- [ ] Verificar contra Figma el estado marcado del checkbox de consentimiento (no aparece en las capturas).
- [ ] Confirmar si la etiqueta azul (`info`) del campo de fecha es intencional; hoy se unificó en `brand-500` (ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones)).
- [ ] Footer mobile: Figma oculta el mapa de sitio, seguros y redes sociales (incluido "Términos y Condiciones"). Confirmar que es intencional.
- [ ] Selector de uso del home: antes de ingresar la placa queda deshabilitado ("Primero ingresa tu placa"); Figma no define ese estado.
- [ ] Datos del vehículo, diferencias con Figma a confirmar: campo **Versión** agregado (el backend lo exige), **serie y VIN separados** (el backend exige ambos), la ayuda lateral no se muestra en mobile (como en Figma) y el título usa "tu" en vez de "su".
- [ ] Ilustración de "Datos incompletos" (auto con alerta) pendiente de exportar. La spec la muestra, pero su imagen es de baja resolución (390px de ancho toda la pantalla) y no sirve como recurso.
- [ ] Cotización, diferencias con Figma a confirmar: "Editar" visible en mobile, ayuda bajo la fecha, estado "Elegido" de "LO QUIERO", etiqueta del celular y estado vacío sin plan (ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones)).
- [ ] Nombre del producto en la tarjeta: se muestra tal como viene del backend ("SOAT" o "SOAT DIGITAL", según el plan). Figma solo muestra "SOAT".
