# Pendientes

Registro de todo lo que falta decidir, recibir o corregir. Marca `[x]` al cerrar y anota la decisión debajo del ítem.
Detalle técnico de cada brecha: [docs/flujo.md](docs/flujo.md#brechas-spec-vs-backend-decidir-antes-de-implementar) · Contrato de la API: [docs/api.md](docs/api.md).

## Estado actual y siguiente paso

_Actualizado: 2026-10-05. Actualiza esta sección al cerrar cada tarea._

**Hecho (en `main`):**
- Reglas del proyecto, sistema de diseño desde Figma ([DESIGN.md](DESIGN.md)) y pruebas (Vitest + Playwright con servidor falso de la API).
- Flujo (orden de Figma, 2026-10-05): inicio → `POST /query-info` → titular (1/3) → vehículo (2/3, siempre; bloquea lo que trajo la consulta de placa) → cotización (3/3) → antes de pagar. El estado viaja en una cookie cifrada.
- Pantalla de cotización (`/cotizar/cotizacion`): saludo, resumen del vehículo con "Editar", tarjeta del plan sin AFOCAT, fecha de inicio e "Ir a pagar". Si la fecha cambió, vuelve a cotizar una sola vez; si el precio cambió, lo muestra y pide confirmar de nuevo.
- Pantallas "Completa los datos del titular" (`/cotizar/titular`, paso 1/3: nombres de `/query-info`, dirección de Lima o Callao con referencia y provincia, correo y celular) y "Antes de pagar" (`/cotizar/antes-de-pagar`, spec sección 8). "Continuar con el pago" abre el checkout.
- Reglas de la spec secciones 2, 4.1 y 4.2: tabla tipo → usos propia (`features/quote/lib/use-matrix.ts`), uso único sin selector, categoría fija por la placa, aviso si el registro vehicular la contradice y RUC + moto lineal sin Particular.
- Tipo real del vehículo: el inicio consulta `POST /query-plate` (sin cotizar) y cotiza una sola vez con el tipo del registro.
- Límites de uso: `/api/vehicles/*` con sesión y límite por persona; el inicio por IP; recotizar y pagar por persona (`lib/rate-limit.ts`, `features/quote/lib/limits.ts`).
- Checkout con Culqi: "Continuar con el pago" crea la orden (`POST /data`, reutilizada mientras los datos no cambien) y abre Culqi Checkout; el `token` se cobra con `POST /charge` desde una Server Action; el pago diferido (código de pago) y el pago aprobado terminan en `/cotizar/confirmacion`. Probado con el servidor falso y un Culqi falso (`e2e/fake-culqi.ts`), y a mano con el Culqi real en modo de pruebas.
- "Antes de pagar" y pago rechazado según Figma ("SOAT al instante 5" y "6"). El rechazo es un estado de "Antes de pagar" con consejos e "Intentar nuevamente"; las demás fallas del pago muestran un aviso con enlace a donde se corrigen (sesión vencida, fecha de inicio pasada, correo rechazado).
- Límites de los campos: documento por tipo (DNI 8, CE 12, RUC 11; solo caracteres válidos), celular de 9 dígitos, correo, datos del titular y buscador de marcas.

**Siguiente: probar la emisión tras el pago** con La Positiva QA encendida (de día) y el cambio temporal de `app-soat-taxi` ya restaurado: pagar y simular el webhook con el `curl` de [docs/prueba-checkout.md](docs/prueba-checkout.md). El checkout ya pasó la prueba manual (2026-10-03): casos 1, 2, 3, 4, 6, 7 y 8 correctos contra la API local con Culqi real en modo de pruebas y La Positiva simulada; el caso 5 (pago diferido) solo se puede probar en producción. También queda configurar las reglas del WAF de Vercel cuando exista el proyecto.

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
- [ ] **Vigencia del token de cotización.** ¿Cuánto dura el `Token` que devuelve la cotización? La emisión ocurre después del pago (webhook) con ese token: si venció, se cobra pero no se emite. El backend nunca le asigna `expires_at`. Con la respuesta, el front volverá a cotizar al pagar si la cotización es más vieja que ese límite (avisando si cambió el precio).
- [ ] **Mecanismo de invalidación del token** de cotización al usar "Editar" (en coordinación con la solución del bug de tokens duplicados). Hoy "Editar" → "Guardar y continuar" crea una cotización nueva que reemplaza a la anterior en la sesión (y borra el plan elegido); la anterior sigue válida en el backend.

## Decisiones de producto

- [x] **Datos personales para la orden.** `POST /data` exige nombres, apellidos, dirección, departamento y distrito. Con **DNI o CE**, `/query-info` trae nombres y apellidos (juntos); con **RUC**, razón social, dirección, departamento y distrito, pero no nombres ni apellidos. **Decidido (2026-10-05):** pantalla "Completa los datos del titular" como paso 1/3 (Figma): nombres y apellidos tal como los manda el backend, bloqueados si llegaron; departamento solo Lima o Callao, provincia según el departamento y distrito de una lista (como soatparataxi.pe); referencia y provincia se agregan al texto de la dirección (`/data` no tiene campos para ellas); correo y celular se piden aquí; sin "¿Comprobante a nombre del contratante?".
- [x] **Orden de pasos.** Figma usa "PASO x/3" (titular → vehículo → cotización); la spec usa "PASO 1" en vehículo y "PASO 2/2" en "Antes de pagar". **Decidido (2026-10-05, reemplaza la decisión del 2026-09-29):** titular (1/3) → vehículo (2/3, siempre, con lo que trajo la placa bloqueado) → cotización (3/3) → antes de pagar (3/3). Se quitó la pantalla "Datos incompletos".
- [ ] **Entrega por WhatsApp.** El hero y la FAQ de Figma dicen que el SOAT llega por WhatsApp; el backend solo envía correo.
- [ ] **"Desde S/33 al año"** en el hero: confirmar el precio mínimo real.
- [ ] **Zona de circulación (`ubigeo_id`).** El backend la exige; la spec no tiene el campo. **Hoy se envía Lima (150101) de forma provisional** (`DEFAULT_UBIGEO_ID`). ¿Se pregunta (Lima/Callao) o se asume? **Importa más de lo que parece:** al emitir, el backend manda a La Positiva el departamento, la provincia y el distrito del titular a partir de esta zona, no de lo que escribe la persona.
- [ ] **Tipo de vehículo inicial.** `/query-info` exige `type_id` y el inicio solo sabe auto/moto + uso. **Provisional:** auto → Automóvil; moto → Motocicleta (particular), Mototaxi (taxi), Motocarga (carga). En "Datos del vehículo" se puede corregir. Auto + Carga y Comercial muestran "no podemos cotizar en línea" hasta tener Camión/Furgón e IdUso Comercial. **Actualizado:** el tipo por defecto solo se usa si la consulta de placa no trae la clase del vehículo; si la trae, se cotiza con el tipo real.
- [ ] **Placa `LN-NNNN` (ej. A1-1234).** Sin guion es ambigua con la placa de auto `A11-234`. ¿Se exige escribir el guion?
- [ ] **Pasaporte.** El backend lo acepta, la spec solo pide DNI, CE y RUC. Por defecto: no se ofrece.
- [ ] **Fecha de inicio.** Cambiarla obliga a volver a cotizar (nuevo precio y token). ¿Se mueve antes del precio o se bloquea tras "LO QUIERO" como en soatparataxi.pe? **Provisional:** la fecha queda debajo del precio y es editable. "Ir a pagar" vuelve a cotizar una sola vez si la fecha cambió y, si el precio cambió, lo muestra y pide confirmar. Rango permitido: de hoy (Lima) a 12 meses (`MAX_START_DAYS`), a confirmar con La Positiva.
- [ ] **Catálogo de vehículos.** Falta Camión/Furgón. ¿Trimoto equivale a "Motocarga" (id 16)? **Provisional:** sí, en la tabla de `use-matrix.ts`.
- [ ] **Confirmación de compra.** Sin endpoint de estado ni descarga, solo puede decir "te llegará por correo". ¿Es suficiente para la v1? **Provisional:** `/cotizar/confirmacion` con placa, inicio de vigencia, total y "te enviaremos tu SOAT a {correo}". No está en Figma ni en la spec.
- [ ] **Pagos diferidos** (banca móvil, agentes, billeteras). **Provisional:** Culqi muestra el código en su ventana y detrás se abre la confirmación en modo "Tu código de pago está listo" (24 horas para pagar, el código llega al correo) con la opción "Prefiero pagar con tarjeta o Yape". Validar el texto y si Culqi envía el código por correo. **No se puede probar en desarrollo** (en el entorno de pruebas Culqi muestra un QR genérico): revisarlo con el primer pago diferido en producción, incluido que la confirmación aparezca detrás del modal.
- [ ] **Mensajes de pago rechazado.** La pantalla de pago rechazado usa textos propios y genéricos ("El pago fue rechazado.") y no el `user_message` de Culqi, porque el backend a veces pone ahí mensajes de excepción crudos. Si el backend separa el `user_message` de Culqi de sus propios errores, se puede mostrar el motivo real (fondos insuficientes, tarjeta vencida…).

## Backend (`~/sites/app-soat-taxi`)

- [ ] **🔴 Pago rechazado reportado como éxito.** `PaymentService::createCharge` captura la excepción de Culqi y `/charge` responde `success`. Confirmado en el código; reproducir con tarjeta de prueba rechazada. Afecta también a soatparataxi.pe. **Probado (2026-10-03):** con fondos insuficientes el SDK devuelve el rechazo como respuesta, `/charge` responde `error` y el front lo muestra bien. El riesgo queda para los errores que el SDK lanza como excepción (red, timeout, respuestas inesperadas): ahí `/charge` respondería `success` y el front mostraría "¡Listo! Recibimos tu pago".
- [ ] **3DS (`REVIEW`) no soportado.** Si Culqi pide autenticación 3DS, `createCharge` lo convierte en error y no hay forma de completar la verificación (haría falta Culqi 3DS y reintentar el cargo con `authentication_3DS`). El front muestra el mensaje genérico de pago no procesado. **Probado (2026-10-03):** con la tarjeta de prueba 3DS (4456 5300 0000 1096) no hubo verificación: Culqi denegó el cargo (`DNGE0116`). En producción, las tarjetas cuyo banco exija 3DS no podrán pagar; lo que les queda es Yape o el pago diferido.
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
- [x] Envío del formulario de inicio conectado a `POST /query-info`; resultado en sesión cifrada; siempre sigue al titular (1/3).
- [x] Pantalla "Completa los datos del titular" (`/cotizar/titular`, paso 1/3), con dirección de Lima o Callao, correo y celular. Revisada contra Figma en 1640 px y en mobile (2026-10-05).
- [x] Pantalla "Ingresa los datos de tu vehículo" (paso 2/3, siempre): lo que trajo la consulta de placa queda bloqueado (también en el servidor); marca con autocompletado remoto, modelo y versión del catálogo, serie y VIN por separado. Solo vuelve a cotizar si se completaron datos o cambió el tipo o el uso. Revisada contra Figma en desktop y mobile.
- [x] Pantalla de cotización (paso 3/3): saludo, resumen del vehículo con "Editar", tarjeta de plan y fecha de inicio. Revisada contra Figma en 430, 1100 y 1640 px.
- [x] Pantalla "Antes de pagar" (informativa, spec sección 8), rediseñada según Figma "SOAT al instante 5" (2026-10-05). Revisada en 1640 px y en mobile.
- [x] Pantalla de pago rechazado (Figma "SOAT al instante 6"), como estado de "Antes de pagar". Revisada en 1640 px y en mobile.
- [x] **Tabla tipo → usos (spec sección 2) y categoría fija (spec 4.1).** Tabla propia en `features/quote/lib/use-matrix.ts`, validada en cliente y servidor. Uso único sin selector. "Datos del vehículo" solo ofrece tipos de la categoría de la placa. Si el registro vehicular contradice la categoría de la placa, el inicio avisa y no sigue.
- [x] **RUC + moto lineal ⇒ solo "Comercial" (spec 4.2)** en "Datos del vehículo". Como "Comercial" aún no tiene IdUso, esa combinación queda sin uso cotizable y el formulario lo explica.
- [x] **Tipo real del vehículo en el camino directo.** El inicio consulta `POST /query-plate` (sin cotizar), traduce la clase de La Positiva al tipo del catálogo y cotiza una vez con él. Si el uso no aplica al tipo real (o es RUC + moto lineal), lo marca en el campo "Uso".
- [x] Los errores por campo que devuelve una Server Action (p. ej. 422 de la API en placa o documento) quedaban ocultos al enviar un formulario válido. Corregido en los tres formularios.
- [x] Checkout con **Culqi Checkout** (`https://js.culqi.com/checkout-js`, `features/checkout/`): `POST /data` → modal con `settings` y `client.email` → `token` a `POST /charge` (Server Action) → confirmación; `order` → confirmación en modo "código de pago". La orden se reutiliza mientras los datos no cambien (huella en la sesión) y un pedido ya pagado no vuelve a cobrarse. Errores con textos propios (ver "Mensajes de pago rechazado"). Probado a mano con el Culqi real en modo de pruebas (2026-10-03, [docs/prueba-checkout.md](docs/prueba-checkout.md)), salvo el pago diferido.
- [x] Pantalla de confirmación de compra y de orden generada (`/cotizar/confirmacion`). Revisada en 1440 px y en mobile.
- [ ] **Llave pública de producción** (`pk_live_…`) en el entorno de despliegue. Sin `NEXT_PUBLIC_CULQI_PUBLIC_KEY` la app no arranca.
- [x] Services de catálogo (`/data`, `/brands`, `/models`, `/versions`) y cotización (`/query-info`) con Zod y precio en céntimos.
- [x] Estado del flujo en cookie httpOnly cifrada (sobrevive recargas). Guarda la fecha cotizada, los datos manuales del vehículo (para volver a cotizar) los datos del titular, si el paso del vehículo se confirmó, el plan elegido y la orden (`order_id`, huella de los datos y estado: creada, código de pago o pagada).
- [x] **Rate limiting.** `/api/vehicles/*` exigen sesión de cotización (401) y tienen 60 consultas por minuto por persona (429 con `Retry-After`). El inicio: 20 envíos cada 10 min por IP (margen amplio por CGNAT de los operadores móviles). Guardar vehículo y recotizar por fecha: 10 cada 10 min por persona. Valores configurables (`RATE_LIMIT_*`, ver `.env.example`).
- [x] **Despliegue: Vercel, plan Hobby** (decisión del cliente, 2026-09-29). Riesgo conocido y aceptado: las reglas de uso justo de Vercel limitan Hobby a uso personal no comercial y consideran comercial procesar pagos; Vercel puede suspender el proyecto. Pasar a Pro lo resuelve.
- [ ] **Reglas del WAF de Vercel** (Hobby: hasta 3 reglas, límites por IP, 1.000.000 de peticiones permitidas incluidas): 1) `/api/vehicles/*` por IP; 2) POST a `/` (envío del inicio) por IP; 3) libre. Configurar cuando exista el proyecto en Vercel (panel o `vercel firewall rules add … --rate-limit-keys ip`). El límite en memoria por persona queda como segunda capa; Redis/Upstash no hace falta.
- [ ] **Límites en producción.** Hoy las cuentas viven en la memoria del proceso (`lib/rate-limit.ts`): en Vercel cada instancia cuenta por separado, por eso la primera barrera son las reglas del WAF. El límite por IP en el código es confiable en Vercel, que reescribe `x-forwarded-for`.
- [x] **Filtrar planes AFOCAT** en la cotización: el mapper de `/query-info` descarta los planes cuyo nombre empieza con "AFOCAT" (el backend no expone la aseguradora). Si no queda ninguno, la pantalla muestra un estado vacío.
- [x] `lang="es"` y metadata de Camila Seguros en `app/layout.tsx`.
- [x] Pruebas: Vitest (reglas de placa, usos y documento) y Playwright (home en desktop y mobile).
- [x] Servidor falso de la API para las e2e (`e2e/mock-api/server.mjs`).
- [x] **Pagar con la página abierta mucho tiempo.** Si la fecha de inicio ya pasó (por ejemplo, después de medianoche), "Continuar con el pago" no crea la orden ni cobra: avisa y enlaza a la cotización, que propone hoy y vuelve a cotizar. Si la sesión (2 horas desde el último paso) venció, el aviso enlaza al inicio. Falta revisar la antigüedad de la cotización (ver "Vigencia del token de cotización").
- [x] **"Datos del vehículo" cuando La Positiva no responde.** Las listas de modelos y versiones consultan a La Positiva. Ahora solo se piden si el modelo o la versión no vinieron de la consulta de placa, y si fallan el paso abre igual: el selector dice "No pudimos cargar la lista" con la ayuda "El catálogo no respondió. Inténtalo de nuevo en unos minutos." (antes la página caía en el error genérico, visto el 2026-10-02 y el 2026-10-05).
- [ ] Correr `npm test` y `npm run test:e2e` en CI cuando haya remoto.

### Diseño

- [ ] Verificar contra Figma el estado marcado del checkbox de consentimiento (no aparece en las capturas).
- [ ] Confirmar si la etiqueta azul (`info`) del campo de fecha es intencional; hoy se unificó en `brand-500` (ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones)).
- [ ] Footer mobile: Figma oculta el mapa de sitio, seguros y redes sociales (incluido "Términos y Condiciones"). Confirmar que es intencional.
- [ ] Selector de uso del home: antes de ingresar la placa queda deshabilitado ("Primero ingresa tu placa"); Figma no define ese estado.
- [ ] Datos del vehículo, diferencias con Figma a confirmar: campo **Versión** agregado (el backend lo exige), **serie y VIN separados** (el backend exige ambos), la ayuda lateral no se muestra en mobile (como en Figma) y el título usa "tu" en vez de "su".
- [ ] Cotización, diferencias con Figma a confirmar: "Editar" visible en mobile, ayuda bajo la fecha, estado "Elegido" de "LO QUIERO", sin campo de celular (se pide en el titular) y estado vacío sin plan (ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones)).
- [ ] **Pago rechazado, diferencias con Figma a confirmar:** un solo botón ("Intentar nuevamente"; "Cambiar método de pago" abriría el mismo modal de Culqi), aviso "El pago fue rechazado." (Figma: "…por tu entiedad financiera") y texto del aviso en `danger-strong` para cumplir AA. Ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones).
- [ ] **Versiones mobile** de "Antes de pagar" y pago rechazado: solo hay capturas desktop; hoy se apilan centradas con el botón a todo el ancho.
- [ ] **Titular, diferencias con Figma a confirmar:** apellidos en un solo campo (el backend los devuelve juntos), referencia opcional, provincia que sigue al departamento (solo Lima y Callao) y sin la pregunta del comprobante. Ver [DESIGN.md](DESIGN.md#7-diferencias-con-figma-decisiones).
- [ ] Nombre del producto en la tarjeta: se muestra tal como viene del backend ("SOAT" o "SOAT DIGITAL", según el plan). Figma solo muestra "SOAT".
