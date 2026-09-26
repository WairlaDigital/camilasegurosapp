# UI/UX

Objetivo: que una persona sin conocimientos de seguros entienda qué cubre un plan, cuánto cuesta y lo compre sin fricción. Interfaz limpia, sobria y confiable.

## Principios

- **Claridad antes que decoración.** Una acción principal por pantalla. Jerarquía clara: precio y cobertura clave primero, letra chica después (en acordeón o "Ver detalle").
- **Lenguaje simple** en español de Perú, tuteo consistente. Evitar jerga ("prima", "deducible") o explicarla con un tooltip/ayuda en contexto.
- **Confianza**: precios siempre con moneda y periodicidad ("S/ 45.90 al mes"), sin costos ocultos, resumen antes de pagar, señales claras de seguridad en el checkout.
- **Mobile-first.** Diseñar primero a 360 px; nada de scroll horizontal. Áreas táctiles de al menos 44×44 px.

## Design system

- Tokens en `app/globals.css` (`@theme` de Tailwind 4): colores, radios, sombras, tipografía. **Prohibido** usar colores hex o valores arbitrarios (`text-[#123456]`, `p-[13px]`) en componentes.
- Paleta reducida: 1 color de marca, neutros, y colores semánticos (éxito, error, advertencia, info). Contraste mínimo WCAG AA (4.5:1 en texto).
- Escala de espaciado de Tailwind (múltiplos de 4). Espacio en blanco generoso.
- Máximo 2 familias tipográficas (definidas con `next/font`). Escala tipográfica consistente.
- Toda primitiva visual vive en `components/ui/`. Antes de crear un componente nuevo, reutiliza o extiende uno existente. Variantes con una utilidad tipo `cva` en lugar de condicionales de clases dispersas.

## Estados obligatorios

Todo componente que muestre datos remotos contempla:

- **Cargando**: skeleton con la forma del contenido (no spinners de pantalla completa).
- **Vacío**: mensaje útil y una acción ("No hay planes para este filtro. Limpiar filtros").
- **Error**: mensaje humano + acción de reintento. Nunca mostrar mensajes técnicos del backend.
- **Éxito**: confirmación explícita (número de póliza, qué sigue, a dónde llega el correo).

## Flujo de compra

- Pasos visibles (ej. Plan → Datos → Pago → Confirmación) con indicador de progreso.
- Pedir solo los datos necesarios, en el orden en que la persona los espera. Autocompletar (`autocomplete`), tipos de input correctos (`inputMode="numeric"` para DNI y teléfono).
- Validar al salir del campo, no mientras se escribe. Errores junto al campo, no solo arriba.
- Conservar lo ingresado si hay un error o se vuelve atrás.
- Comparación de planes lado a lado (tabla en desktop, tarjetas apiladas en mobile), destacando diferencias.

## Accesibilidad

- HTML semántico (`button`, `nav`, `main`, headings en orden). Un solo `h1` por página.
- Todo input con `label` visible. Foco visible siempre (no quitar `outline` sin reemplazo).
- Navegable 100% con teclado; modales atrapan el foco y cierran con `Esc`.
- Íconos solos con `aria-label`; imágenes con `alt` descriptivo (o `alt=""` si son decorativas).
- Respetar `prefers-reduced-motion`. Animaciones cortas (150–250 ms) y solo con propósito (feedback, transición entre pasos).
- `lang="es"` en `<html>`.

## Rendimiento percibido

- Contenido principal renderizado en servidor; interacciones con feedback inmediato (< 100 ms).
- Sin saltos de layout (CLS): reservar espacio para imágenes y skeletons del mismo tamaño que el contenido.
