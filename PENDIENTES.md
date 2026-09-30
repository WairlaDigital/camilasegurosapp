# Pendientes

Registro de todo lo que falta decidir, recibir o corregir. Marca `[x]` al cerrar y anota la decisión debajo del ítem.
Detalle técnico de cada brecha: [docs/flujo.md](docs/flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar) · Contrato de la API: [docs/api.md](docs/api.md).

## Estado actual y siguiente paso

_Actualizado: 2026-09-29. Actualiza esta sección al cerrar cada tarea._

**Hecho (en `main`):**
- Reglas del proyecto, sistema de diseño desde Figma ([DESIGN.md](DESIGN.md)) y pruebas (Vitest + Playwright con servidor falso de la API).
- Flujo: inicio → `POST /query-info` → "Datos incompletos" → "Datos del vehículo" → nueva cotización con datos manuales. El estado viaja en una cookie cifrada.
- Pantalla de cotización (`/cotizar/cotizacion`): saludo, resumen del vehículo con "Editar", tarjeta del plan sin AFOCAT, fecha de inicio, celular e "Ir a pagar". Si la fecha cambió, vuelve a cotizar una sola vez; si el precio cambió, lo muestra y pide confirmar de nuevo.
- Pantallas "Completa los datos del titular" (`/cotizar/titular`) y "Antes de pagar" (`/cotizar/antes-de-pagar`, spec sección 8): "Ir a pagar" guarda plan y celular → datos del titular (solo lo que acepta `POST /data`; lo que trae la API, bloqueado) → antes de pagar. "Continuar con el pago" abre el checkout.
- Reglas de la spec secciones 2, 4.1 y 4.2: tabla tipo → usos propia (`features/quote/lib/use-matrix.ts`), uso único sin selector, categoría fija por la placa, aviso si el registro vehicular la contradice y RUC + moto lineal sin Particular.
- Tipo real del vehículo: el inicio consulta `POST /query-plate` (sin cotizar) y cotiza una sola vez con el tipo del registro.
- Límites de uso: `/api/vehicles/*` con sesión y límite por persona; el inicio por IP; recotizar y pagar por persona (`lib/rate-limit.ts`, `features/quote/lib/limits.ts`).
- Checkout con Culqi (rama `claude/culqi-public-key-b796a9`): "Continuar con el pago" crea la orden (`POST /data`, reutilizada mientras los datos no cambien) y abre Culqi Checkout; el `token` se cobra con `POST /charge` desde una Server Action; el pago diferido (código de pago) y el pago aprobado terminan en `/cotizar/confirmacion`. Probado con el servidor falso y un Culqi falso (`e2e/fake-culqi.ts`).

**Siguiente: probar el checkout de punta a punta** contra la API local con la llave de pruebas de Culqi (tarjetas de prueba aprobada y rechazada, Yape y un código de PagoEfectivo): nunca se probó con el Culqi real. Confirmar ahí el 🔴 del pago rechazado reportado como éxito (sección Backend). También queda configurar las reglas del WAF de Vercel cuando exista el proyecto.

**Para arrancar:** ver [README.md](README.md) (instalación, `.env.local`, `npm run dev:mock`, pruebas) y [AGENTS.md](AGENTS.md) (reglas). El `.env.local` real está en la carpeta principal del repo; un worktree nuevo no lo trae: cópialo o, para revisar a mano, usa `npm run dev:mock` con un `SESSION_SECRET` de prueba.

## Insumos por recibir

- [x] **Token de la API** (Sanctum) en `.env.local`. Probado con los catálogos (2026-09-27).
- [x] **`SESSION_SECRET`** en el `.env.local` local (carpeta principal y worktree). Falta definirlo en cada entorno de despliegue (ver `.env.example`); sin él la app no arranca.
- [x] **Figma**. Recibido 2026-09-26. Lineamientos en [DESIGN.md](DESIGN.md); capturas en [docs/figma/](docs/figma).
- [x] **Recursos del home** exportados de Figma (2026-09-27): foto del hero, ícono de categoría auto, 4 íconos de beneficios y 5 de coberturas. Integrados y revisados contra Figma.
- [ ] **Recursos que aún faltan:** ícono de menú mobile ([559:71](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=559-71), hoy es un ícono CSS provisional) y manchas decorativas del fondo ([197:296](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-296), [197:297](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros?node-id=197-297)).
- [ ] **Respuestas de la FAQ.** Figma solo trae la primera; las otras 5 son textos provisionales en `features/home/content.ts`. Validarlas.
- [x] **Llave pública de Culqi** de pruebas (`pk_test_…`) en el `.env.local` de la carpeta principal como `NEXT_PUBLIC_CULQI_PUBLIC_KEY` (2026-09-29). Es pública por diseño (va al navegador); la llave secreta vive solo en la API. Falta la de producción (`pk_live_…`) al desplegar, y debe corresponder a la misma cuenta de Culqi que la llave secreta de la API.
- [x] **Logo, tipografía y colores**. Tomados de Figma (Red Hat Display, violeta `#4740de`).
- [ ] **URLs del sitio**: menú (Seguros, Beneficios, Testimonios, Blog), Contáctanos, Términos y Condiciones, Facebook. Hoy son `#` en `lib/site.ts`.
- [ ] **Textos legales**: URL de la Política de Privacidad y del Consentimiento de datos para usos adicionales.

## Pendiente con La Positiva (Fidel)

- [x] **Proveedor de checkout.** Decidido (2026-09-27): Culqi, a través de la API. La sección 9 de la spec ("pendiente con La Positiva") era un error del cliente: el front nunca se conecta a La Positiva, solo a la API, que ya integra Culqi (`token` para tarjeta/Yape y `order` para PagoEfectivo). Falta la integración front con Culqi Checkout.
- [ ] **IdUso de "Comercial"** para moto lineal.
- [ ] **Mecanismo de invalidación del token** de cotización al usar "Editar" (en coordinación con la solución del bug de tokens duplicados). Hoy "Editar" → "Guardar y continuar" crea una cotización nueva que reemplaza a la anterior en la sesión (y borra el plan elegido); la anterior sigue válida en el backend.

## Decisiones de producto

- [x] **Datos personales para la orden.** `POST /data` exige nombres, apellidos, dirección, departamento y distrito. Lo que devuelve `/query-info` depende del documento (`CreateDriverFromDocument` en el backend): con **DNI o CE** solo nombres y apellidos (el backend no guarda la dirección de personas); con **RUC**, razón social, dirección, departamento y distrito, pero no nombres ni apellidos. Por eso hay que pedir los datos que falten, como hace soat-para-taxi (`components/forms/police.vue`: campos prellenados y bloqueados si la API los trajo). **Decidido (2026-09-29):** pantalla "Completa los datos del titular" entre la cotización y "Antes de pagar", solo con los campos que acepta la API (sin provincia, referencia ni comprobante). Departamento de una lista de 25; distrito en texto (el backend los guarda como texto: la ubicación de la póliza sale de la zona de circulación). Figma agrega la pantalla "Completa los datos del titular" (tipo de persona, documento, apellidos, nombres, domicilio, referencia, departamento/provincia/distrito, correo, celular, comprobante a nombre del contratante), que la spec no tiene. Falta definir en qué paso va y qué campos llegan prellenados de RENIEC/SUNAT. El backend no recibe provincia, referencia ni la opción de comprobante.
- [x] **Orden de pasos.** Figma usa "PASO x/3" (titular → vehículo → cotización); la spec usa "PASO 1" en vehículo y "PASO 2/2" en "Antes de pagar". **Decidido (2026-09-29):** vehículo (1/3) → cotización (2/3) → datos del titular (3/3) → antes de pagar (3/3).
- [ ] **Entrega por WhatsApp.** El hero y la FAQ de Figma dicen que el SOAT llega por WhatsApp; el backend solo envía correo.
- [ ] **"Desde S/33 al año"** en el hero: confirmar el precio mínimo real.
- [ ] **Zona de circulación (`ubigeo_id`).** El backend la exige; la spec no tiene el campo. **Hoy se envía Lima (150101) de forma provisional** (`DEFAULT_UBIGEO_ID`). ¿Se pregunta (Lima/Callao) o se asume? **Importa más de lo que parece:** al emitir, el backend manda a La Positiva el departamento, la provincia y el distrito del titular a partir de esta zona, no de lo que escribe la persona.
- [ ] **Tipo de vehículo inicial.** `/query-info` exige `type_id` y el inicio solo sabe auto/moto + uso. **Provisional:** auto → Automóvil; moto → Motocicleta (particular), Mototaxi (taxi), Motocarga (carga). En "Datos del vehículo" se puede corregir. Auto + Carga y Comercial muestran "no podemos cotizar en línea" hasta tener Camión/Furgón e IdUso Comercial. **Actualizado:** el tipo por defecto solo se usa si la consulta de placa no trae la clase del vehículo; si la trae, se cotiza con el tipo real.
- [ ] **Placa `LN-NNNN` (ej. A1-1234).** Sin guion es ambigua con la placa de auto `A11-234`. ¿Se exige escribir el guion?
- [ ] **Pasaporte.** El backend lo acepta, la spec solo pide DNI, CE y RUC. Por defecto: no se ofrece.
- [ ] **Fecha de inicio.** Cambiarla obliga a volver a cotizar (nuevo precio y token). ¿Se mueve antes del precio o se bloquea tras "LO QUIERO" como en soatparataxi.pe? **Provisional:** la fecha queda debajo del precio y es editable. "Ir a pagar" vuelve a cotizar una sola vez si la fecha cambió y, si el precio cambió, lo muestra y pide confirmar. Rango permitido: de hoy (Lima) a 12 meses (`MAX_START_DAYS`), a confirmar con La Positiva.
- [ ] **Catálogo de vehículos.** Falta Camión/Furgón. ¿Trimoto equivale a "Motocarga" (id 16)? **Provisional:** sí, en la tabla de `use-matrix.ts`.
- [ ] **Confirmación de compra.** Sin endpoint de estado ni descarga, solo puede decir "te llegará por correo". ¿Es suficiente para la v1? **Provisional:** `/cotizar/confirmacion` con placa, inicio de vigencia, total y "te enviaremos tu SOAT a {correo}". No está en Figma ni en la spec.
- [ ] **Pagos diferidos** (banca móvil, agentes, billeteras). **Provisional:** Culqi muestra el código en su ventana y detrás se abre la confirmación en modo "Tu código de pago está listo" (24 horas para pagar, el código llega al correo) con la opción "Prefiero pagar con tarjeta o Yape". Validar el texto y si Culqi envía el código por correo.
- [ ] **Mensajes de pago rechazado.** Hoy la UI muestra un texto propio ("No pudimos procesar tu pago…") y no el `user_message` de Culqi, porque el backend a veces pone ahí mensajes de excepción crudos. Si el backend separa el `user_message` de Culqi de sus propios errores, se puede mostrar el motivo real (fondos insuficientes, tarjeta vencida…).

## Backend (`~/sites/app-soat-taxi`)

- [ ] **🔴 Pago rechazado reportado como éxito.** `PaymentService::createCharge` captura la excepción de Culqi y `/charge` responde `success`. Confirmado en el código; reproducir con tarjeta de prueba rechazada. Afecta también a soatparataxi.pe. **Con el checkout ya integrado, este front mostraría "¡Listo! Recibimos tu pago" ante un rechazo.**
- [ ] **3DS (`REVIEW`) no soportado.** Si Culqi pide autenticación 3DS, `createCharge` lo convierte en error y no hay forma de completar la verificación (haría falta Culqi 3DS y reintentar el cargo con `authentication_3DS`). El front muestra el mensaje genérico de pago no procesado.
- [ ] **`POST /data` responde 500 si falta una clave** (`driver.id`, `vehicle.color`, `vehicle.vin`, `plan.token`, `reseller`): el controlador las lee sin comprobar. El front las envía siempre (con `null`).
- [ ] **Idempotencia real en `/charge`.** El front reutiliza la orden (`order_id`) y bloquea el segundo cobro con la sesión, pero el backend no rechaza un segundo cargo para una póliza ya pagada.
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
- [x] Pantalla "Completa los datos del titular" (`/cotizar/titular`). Revisada contra Figma en 1640 y 430 px.
- [x] Pantalla "Ingresa los datos de tu vehículo": prellenada y editable, marca con autocompletado remoto, modelo y versión del catálogo, serie y VIN por separado. Revisada contra Figma en desktop y mobile. Al guardar vuelve a cotizar con los datos manuales; falta redirigir a la cotización.
- [x] Pantalla de cotización: saludo, resumen del vehículo con "Editar", tarjeta de plan, fecha de inicio, celular. Revisada contra Figma en 430, 1100 y 1640 px. Falta redirigir "Ir a pagar" a "Antes de pagar".
- [x] Pantalla "Antes de pagar" (informativa, spec sección 8). Revisada contra la captura de la spec en 1440 px y en mobile. "Continuar con el pago" espera el checkout.
- [x] **Tabla tipo → usos (spec sección 2) y categoría fija (spec 4.1).** Tabla propia en `features/quote/lib/use-matrix.ts`, validada en cliente y servidor. Uso único sin selector. "Datos del vehículo" solo ofrece tipos de la categoría de la placa. Si el registro vehicular contradice la categoría de la placa, el inicio avisa y no sigue.
- [x] **RUC + moto lineal ⇒ solo "Comercial" (spec 4.2)** en "Datos del vehículo". Como "Comercial" aún no tiene IdUso, esa combinación queda sin uso cotizable y el formulario lo explica.
- [x] **Tipo real del vehículo en el camino directo.** El inicio consulta `POST /query-plate` (sin cotizar), traduce la clase de La Positiva al tipo del catálogo y cotiza una vez con él. Si el uso no aplica al tipo real (o es RUC + moto lineal), lo marca en el campo "Uso".
- [x] Los errores por campo que devuelve una Server Action (p. ej. 422 de la API en placa o documento) quedaban ocultos al enviar un formulario válido. Corregido en los tres formularios.
- [x] Checkout con **Culqi Checkout** (`https://js.culqi.com/checkout-js`, `features/checkout/`): `POST /data` → modal con `settings` y `client.email` → `token` a `POST /charge` (Server Action) → confirmación; `order` → confirmación en modo "código de pago". La orden se reutiliza mientras los datos no cambien (huella en la sesión) y un pedido ya pagado no vuelve a cobrarse. Errores con textos propios (ver "Mensajes de pago rechazado"). Falta probarlo con el Culqi real.
- [x] Pantalla de confirmación de compra y de orden generada (`/cotizar/confirmacion`). Revisada en 1440 px y en mobile.
- [ ] **Llave pública de producción** (`pk_live_…`) en el entorno de despliegue. Sin `NEXT_PUBLIC_CULQI_PUBLIC_KEY` la app no arranca.
- [x] Services de catálogo (`/data`, `/brands`, `/models`, `/versions`) y cotización (`/query-info`) con Zod y precio en céntimos.
- [x] Estado del flujo en cookie httpOnly cifrada (sobrevive recargas). Guarda la fecha cotizada, los datos manuales del vehículo (para volver a cotizar) la elección (plan y celular) y la orden (`order_id`, huella de los datos y estado: creada, código de pago o pagada).
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
