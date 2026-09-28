# DESIGN — Camila Seguros

Lineamientos de diseño del cotizador SOAT de seguroscamila.pe. Aplican a cualquier pantalla o componente nuevo, lo haga una persona o un agente.

**Objetivo:** que alguien sin conocimientos de seguros entienda qué cubre el SOAT, cuánto cuesta y lo compre sin fricción. Interfaz limpia, sobria y confiable.

**Fuentes**
- Figma: [Camila Seguros](https://www.figma.com/design/W6qepstKDMOGnvOxh51wRq/Camila-Seguros). No tiene variables ni estilos publicados: los valores se leyeron de las capas.
- Capturas de referencia (1x): [docs/figma/](docs/figma) — `home`, `titular`, `vehiculo`, `cotizacion`, en `-desktop` y `-mobile`.
- Pantallas que no están en Figma: la referencia es la captura de la spec en [docs/spec/](docs/spec) (`antes-de-pagar-desktop`, frame de ~1440px con contenido de 1120px; solo desktop).
- Funcionalidad y reglas de negocio: [docs/flujo.md](docs/flujo.md).

**En el código**
- Tokens: [app/globals.css](app/globals.css) (`@theme` de Tailwind 4).
- Componentes: [components/ui/](components/ui) y [components/layout/](components/layout).
- Vista previa de todo (solo desarrollo): `/design-system`.

---

## 1. Principios

- **Claridad antes que decoración.** Una acción principal por pantalla. Primero precio y cobertura; la letra chica después (acordeón o "Ver detalle").
- **Lenguaje simple**, español de Perú, tuteo. Evitar jerga ("prima", "deducible") o explicarla en contexto.
- **Confianza.** Precios siempre con moneda y periodicidad ("S/ 210.00 · Pago anual"), sin costos ocultos, resumen antes de pagar. La moneda nunca se separa del monto al hacer salto de línea: espacio no separable entre "S/" y el número (`S/\u00a022,000`).
- **Mobile-first.** Diseñar a 360–430 px primero; nunca scroll horizontal; áreas táctiles de 44×44 px mínimo.
- **Fidelidad a Figma.** Ante una duda visual, manda la captura de `docs/figma/`. Las desviaciones se anotan en la sección 7.

## 2. Tokens

**Regla:** en componentes solo se usan tokens. Prohibido hex, `rgb()` o valores arbitrarios (`text-[#4740de]`, `p-[13px]`). Si falta un valor, se agrega como token en `app/globals.css` y aquí.

### Color
| Token | Valor | Uso |
|---|---|---|
| `brand-50` | `#eff3fe` | Superficies suaves, FAQ abierta, inicio del fondo |
| `brand-100` | `#e1e8fe` | Panel de FAQ, íconos sobre fondo oscuro, botón secundario |
| `brand-200` | `#c9d4fc` | Fin del botón secundario, texto sobre `brand-900` ("Pago Anual") |
| `brand-400` | `#686cec` | Etiqueta de campo prellenado, decorativo |
| `brand-500` | `#4740de` | **Primario**: CTAs, links, etiquetas de campo, cards de marca |
| `brand-700` | `#39349f` | Fin del degradado primario |
| `brand-900` | `#33317e` | Footer, pills, tag "Pago Anual" |
| `ink` | `#2f2f2f` | Texto base, labels |
| `ink-strong` | `#000000` | Títulos, valores destacados |
| `ink-soft` | `#404040` | Navegación |
| `ink-muted` | `#535353` | Valores de campos, texto secundario |
| `placeholder` | `#b4b4b4` | Placeholders |
| `line` | `#cacaca` | Bordes de controles y FAQ cerrada |
| `line-soft` | `#d7d7d7` | Bordes de cards |
| `field-disabled` | `#e9e9e9` | Campos prellenados de solo lectura |
| `sand` | `#f4f1ea` | Base de la página bajo el degradado |
| `on-brand` | `#f1f1f1` | Texto sobre `brand-900` |
| `success` | `#46cc15` | Checks de coberturas |
| `info` | `#0052a1` | Azul complementario (reservado) |
| `danger` | `#d92d20` | Errores de formulario. **No está en Figma** |

Degradados: `bg-gradient-primary` (botón principal), `bg-gradient-secondary` ("LO QUIERO"), `bg-gradient-plan` (brillo `brand-400` arriba al centro de la tarjeta de plan), `bg-gradient-page` (fondo de página: `brand-50` → `sand`, un solo degradado para toda la página; va en `<body>` con `<html>` en `bg-sand`; ponerlo en `<html>` o quitarle el fondo a `<html>` hace que se repita cada alto de ventana).

Contraste mínimo WCAG AA (4.5:1) en texto. `placeholder` no se usa para información necesaria.

### Tipografía
Una sola familia: **Red Hat Display** (`next/font/google`).

| Token | Tamaño | Peso habitual | Uso |
|---|---|---|---|
| `text-display` | 42px, lh 1, -0.02em | medium + bold en la palabra clave | Hero. En mobile: `text-title md:text-display` |
| `text-title` | 32px, -0.02em | medium (+ bold) | Títulos de pantalla y sección, precio |
| `text-subtitle` | 20px | bold / medium | Títulos de card, "PLACA: …", subtítulos de bloque |
| `text-body` | 16px | regular / medium | Texto |
| `text-label` | 16px | bold | Labels sobre el campo |
| `text-small` | 14px | bold | Labels inset, legales |
| `text-caption` | 12px | semibold, mayúsculas | Pills |
| `text-nav` | 13px, +0.02em | bold, mayúsculas | Navegación, botón mediano |
| `text-watermark` | 152px, lh 1 | bold + `text-outline` | Marca de agua "SOAT" de la tarjeta de plan (solo decorativa, `aria-hidden`) |

Énfasis en títulos: la frase va en medium y la palabra clave en bold ("Conoce las **coberturas de tu SOAT**").

### Forma, espacio y layout
- Radios: `rounded-check` 5 · `rounded-control` 10 (inputs) · `rounded-tile` 12 (ícono de vehículo) · `rounded-card` 20 (cards, FAQ, panel del formulario) · `rounded-panel` 30 (hero, secciones, footer, coberturas) · `rounded-full` (botones, pills).
- Sombra: solo `shadow-cta` (botones primarios y menú mobile).
- Espaciado: escala de Tailwind (múltiplos de 4), espacio en blanco generoso.
- Anchos: `max-w-content` 1120px (texto y formularios) · `max-w-wide` 1420px + márgenes de 20px (hero, secciones, footer). Usar `<Container width="content" | "wide">`. Un `Container` de contenido dentro de uno ancho lleva `px-0` (el ancho ya aporta el margen).
- Márgenes laterales: 20px en mobile.
- Alturas: campos `h-14` (55–56px), botón principal `h-15` (60px), botón mediano `h-13` (52px), header 72px mobile / 110px desktop.

## 3. Componentes

Toda pieza visual reutilizable vive en `components/ui/`. **Antes de crear algo, reutiliza o extiende** un componente existente. Variantes con `cva`; clases combinadas con `cn()` (`lib/cn.ts`).

| Componente | Cuándo usarlo | Figma |
|---|---|---|
| `Button` · `buttonVariants` | `primary` para la acción principal (una por pantalla); `secondary` sobre fondos `brand-500`. `pending` mientras se envía (bloquea doble clic). Para links usar `buttonVariants` sobre `<Link>` | "COMPRAR SOAT VIRTUAL", "GUARDAR Y CONTINUAR", "IR A PAGAR", "LO QUIERO" |
| `Input`, `Select` | `stacked` (label arriba) en el formulario del home y datos sueltos; `inset` (label dentro) en formularios de pasos. `disabled` para datos prellenados que no se editan | Home; titular; vehículo; fecha |
| `Combobox` | Búsqueda remota en catálogos grandes (marcas: 2.684). Patrón WAI-ARIA: flechas, Enter, Escape; el valor solo cambia al elegir una opción | Marca (datos del vehículo) |
| `Checkbox` | Consentimientos | Home |
| `Radio` | Opciones excluyentes cortas, dentro de `<fieldset>` con `<legend>` | "¿Comprobante de pago…?" |
| `Pill` | `brand`: eyebrow de sección · `light`: breadcrumb sobre imagen · `step`: indicador de paso | "Coberturas", "SEGUROS \ SOAT", "PASO 1/3" |
| `Card` | `surface`: panel del formulario · `outlined`: resumen del vehículo · `brand`: plan · `brand-panel`: cobertura | Cotización, home |
| `Accordion`, `AccordionItem` | Preguntas frecuentes y letra chica. Mismo `name` = solo uno abierto | "¿Quieres saber más?" |
| `SectionHeading` | Encabezado de sección: pill + título con `<strong>` en la palabra clave | "Coberturas", "Preguntas frecuentes" |
| `Logo` | `dark` en fondos claros, `light` sobre `brand-900` | Header, footer |
| `SiteHeader`, `SiteFooter`, `Container` | Ya están en el layout raíz; no repetirlos en páginas | Todas |

Nunca usar `<input>`, `<select>` o `<button>` sueltos con estilos propios en pantallas.

**Ojo con `cn()`:** `tailwind-merge` elimina un `leading-*` que venga *antes* de un `text-*` (los toma como conflicto). Escribe el `leading-*` después del tamaño de texto.

## 4. Patrones de pantalla

- **Encabezado de paso** (titular, vehículo, cotización): `Pill tone="step"` con flecha de volver ("PASO n/3") → título `text-title` → dato de contexto `text-subtitle` ("PLACA: AEF-710").
- **Formulario de paso:** grilla de campos `inset` (3 columnas en titular, 2 en vehículo; 1 en mobile), separación 32px horizontal y 20px vertical. Campos anchos (domicilio, VIN) ocupan 2 columnas. El CTA primario va debajo, alineado al borde derecho del formulario en desktop y a ancho completo en mobile.
- **Ayuda lateral:** en desktop, texto a la derecha del formulario alineado con la primera fila de campos ("Información adicional de tu vehículo"); en mobile no se muestra (como en Figma).
- **Listas dependientes** (tipo → modelos, marca → modelos → versiones): al cambiar el padre se vacían los hijos; mientras cargan dicen "Cargando…" y quedan deshabilitadas; si fallan, "No pudimos cargar la lista".
- **Botón de formulario de paso:** deshabilitado hasta que todos los campos obligatorios tengan valor (spec); los errores de formato se muestran al salir del campo o al enviar.
- **Sección de contenido:** `Pill` (eyebrow) → título con palabra clave en bold → contenido.
- **Hero:** panel `rounded-panel` con foto y velo violeta, breadcrumb `Pill tone="light"`, título `display`, beneficios con ícono, y el panel del formulario blanco superpuesto a la derecha (debajo en mobile). Desktop: grilla de 12 columnas sobre 1120px; formulario en 5 columnas (448px). Mobile: texto del hero con margen de 40px, formulario y coberturas de borde a borde con 20px.
- **Footer:** desktop con 4 columnas; mobile solo logo centrado, datos de la empresa, teléfono y copyright (Figma "Group 86").
- **Tarjeta de plan** (`features/plans/components/plan-card.tsx`): `Card tone="brand"` con `bg-gradient-plan`, 352px de ancho (`md:w-88`), marca de agua "SOAT" (`text-watermark text-outline`), producto y aseguradora en `subtitle`, precio en `title`, tag "Pago Anual" (`bg-brand-900 text-brand-200`), botón `secondary` a ancho completo ("LO QUIERO" → "Elegido" con `aria-pressed` y anillo `brand-200`) y lista de coberturas con check `success`. Varios planes se centran en una fila que se envuelve; el destacado va primero.
- **Resumen del vehículo** (`features/quote/components/vehicle-summary.tsx`): `Card tone="outlined"` con tile `brand-500` e ícono de auto, título en `brand-500`, datos "Etiqueta: valor" (`<dl>`; etiqueta `brand-500`, valor `ink-strong`) separados por líneas verticales en desktop y uno por línea en mobile, y link "Editar".
- **Antes de pagar:** pill de paso arriba a la izquierda y, más abajo, un bloque de 5 columnas desde la columna 5 (448px): título `title` (máx. 400px para que corte en "obtener / tu SOAT!"), subtítulo `subtitle`, lista con check `success` alineado a la primera línea y botón primario (ancho completo en mobile).
- **Cotización:** encabezado de paso en 5 columnas y resumen del vehículo a la derecha (mín. 544px, crece hacia la izquierda para que "Placa | Tipo | Uso" quepa en una línea); tarjeta(s) de plan centradas; formulario de fecha y celular en 4 columnas (352px) alineado a la izquierda, con cada bloque titulado en `subtitle`.
- **Coberturas:** grilla de `Card tone="brand-panel"` con ícono lineal blanco, título bold y monto.

## 5. Estados

Todo lo que muestra datos remotos contempla:
- **Cargando:** skeleton con la forma del contenido, sin spinners de pantalla completa. Botones con `pending`.
- **Vacío:** mensaje útil y una acción ("No hay planes para esta selección. Revisa los datos").
- **Error:** mensaje humano con acción de reintento, junto al campo si es de formulario. Nunca mensajes técnicos del backend.
- **Éxito:** confirmación explícita (qué pasó, qué sigue, a dónde llega la póliza).
- **Prellenado:** datos traídos de RENIEC/SUNAT/placa en campo `disabled` solo si no se deben editar. La spec pide que los datos del vehículo sean **editables**.

## 6. Formularios y accesibilidad

- Pedir solo lo necesario, en el orden esperado. `autocomplete` y `inputMode` correctos (`numeric` para DNI y celular).
- Validar al salir del campo o al enviar, no mientras se escribe. Error junto al campo (`error` en el componente) y el valor ingresado se conserva.
- HTML semántico; un solo `h1` por página; headings en orden.
- Todo control con label visible (los componentes lo exigen). Foco visible siempre.
- 100% navegable con teclado; modales atrapan el foco y cierran con `Esc`.
- Íconos decorativos con `alt=""`; íconos solos con `aria-label`.
- Movimiento: 150–250 ms, solo con propósito; se respeta `prefers-reduced-motion`.
- Rendimiento: contenido principal renderizado en servidor; reservar espacio de imágenes y skeletons para evitar saltos (CLS).

## Revisión visual

Las pruebas automáticas no detectan problemas de apariencia (un anillo de foco mal ubicado, un espaciado roto). Al crear o cambiar una pantalla o un componente, antes del commit:

1. Compararla con su captura de `docs/figma/` en **430 px** (mobile), **1100 px** (intermedio) y **1640 px** (el ancho de los frames de Figma). Medir posiciones clave; diferencias de más de ~8 px se corrigen o se anotan en la sección 7.
2. Revisar **todos los estados**, no solo el inicial: vacío, foco (con teclado), error, deshabilitado, seleccionado, cargando (`pending`) y éxito.
3. Confirmar que no hay scroll horizontal y que el menú mobile funciona.
4. Ver la consola del navegador sin errores.

## 7. Diferencias con Figma (decisiones)

- Se agregó `danger` para errores; Figma no define estados de error ni de foco.
- Etiquetas de campos inset unificadas en `brand-500`; en Figma el campo de fecha las tiene en `info` (azul).
- FAQ: el chevron no rota al abrir, igual que en Figma.
- Datos del vehículo: se agregó **Versión** y se separaron **Nro. de serie** y **VIN** (el backend exige los tres); título con "tu" (tuteo) en vez de "su".
- Un campo con `disabled` se pinta gris solo si el control está deshabilitado: `has-disabled` también detectaría la `<option>` placeholder deshabilitada de un select.
- Tarjetas de categoría (auto/moto): la spec las fija según la placa, pero en Figma parecen seleccionables. Se agregó la ayuda "Se marca sola al ingresar tu placa." bajo las tarjetas (no está en Figma), el clic en una tarjeta lleva el foco al campo de placa y un aviso oculto anuncia la categoría detectada a lectores de pantalla.
- Erratas corregidas en textos: "Contácnenos" → "Contáctanos", "Seguro Vehícular" → "Vehicular", "Compralo" → "Cómpralo", "vene" → "vence".
- El año del copyright se calcula.
- Menú mobile con ícono CSS provisional: el ícono de Figma no se pudo exportar.
- Cotización:
  - El título ocupa 5 columnas para que corte como en Figma ("…SOAT en / pocos minutos..."), y el resumen del vehículo crece hacia la izquierda cuando los datos no caben en una línea (Figma usa "VAN"; el catálogo real trae nombres más largos como "Automóvil").
  - "Editar" también se muestra en mobile (Figma mobile no lo tiene, pero es la única forma de corregir el vehículo desde esta pantalla).
  - Fecha con el selector nativo del navegador (Figma dibuja un ícono de calendario propio) y una ayuda que no está en Figma: "Si cambias la fecha, confirmamos el precio de nuevo." El formulario queda unos 25px más abajo por esa línea.
  - El celular lleva etiqueta inset "Número de celular"; en Figma es solo un placeholder.
  - Figma no define el estado elegido de "LO QUIERO": se usa "Elegido", `aria-pressed` y un anillo `brand-200` en la tarjeta. "Ir a pagar" queda deshabilitado hasta elegir el plan y escribir el celular, con la ayuda "Elige tu plan con «Lo quiero» para continuar.".
  - Estado vacío (sin plan a la venta) no está en Figma: mensaje y acciones "Revisar mis datos" y "Volver al inicio".
- Antes de pagar (no está en Figma; referencia: captura de la spec): el indicador dice "PASO 3/3" para seguir la numeración de Figma (la cotización es 3/3), aunque la spec muestra "PASO 2/2". "Continuar con el pago" muestra un aviso provisional mientras no exista el checkout.
- Hero: el velo violeta se reproduce con degradados medidos sobre las capturas (desktop desde la izquierda, mobile desde abajo-izquierda); en mobile los beneficios se ocultan, como en Figma.

## 8. Recursos

- `public/brand/`: símbolo, wordmark (oscuro y blanco), patrón del footer.
- `public/icons/`: chevrons, check, calendario, editar, auto (tarjeta de resumen), paso atrás, teléfono, Facebook, categorías (`category-auto`, `moto-part-a/b`), beneficios (`benefit-*`) y coberturas (`coverage-*`). Se usan con `next/image` en su tamaño natural, sin alterar el SVG. El ancho y alto del `<Image>` deben ser enteros o coincidir con el tamaño renderizado (si no, Next avisa en consola).
- `public/images/hero-banner.jpg`: foto del hero a 2x (2840×1200). Se sirve optimizada con `next/image` y `preload`; el velo violeta se aplica con CSS (no está en la foto).
- `preload` solo en imágenes visibles al cargar (logo del header, foto del hero). En Next 16 `priority` está deprecado.
- Pendientes de exportar: ícono de menú mobile y manchas decorativas del fondo. Ver [PENDIENTES.md](PENDIENTES.md).

### Pantallas en Figma
| Pantalla | Nodo desktop | Nodo mobile |
|---|---|---|
| Home | `197:293` | `559:46` |
| Completa los datos del titular | `433:174` | `563:546` |
| Ingresa los datos de su vehículo | `267:24` | `564:818` |
| Cotización | `240:117` | `565:921` |
