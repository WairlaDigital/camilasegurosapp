# UI/UX

Los lineamientos de diseño están en [DESIGN.md](../../DESIGN.md) (raíz del repo). Léelo antes de crear o modificar cualquier pantalla o componente.

Mínimos que no se negocian:
- Solo tokens de `app/globals.css`; nada de hex ni valores arbitrarios en componentes.
- Reutilizar `components/ui/` antes de crear algo nuevo.
- Estados de carga, vacío, error y éxito en todo lo que muestre datos remotos.
- Mobile-first, sin scroll horizontal, accesible con teclado y lectores de pantalla.
- Ante una duda visual, manda la captura de `docs/figma/`.
