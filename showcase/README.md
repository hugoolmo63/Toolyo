# Toolyo UI Kit Showcase

Showcase estático para comparar las cuatro direcciones visuales del catálogo MVP:

- Clean / Minimal
- Cálido / Sostenible
- Profesional / Seguro
- Vibrante / Comunitario

## Ejecutar localmente

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173 --directory showcase
```

Abre `http://127.0.0.1:4173` en un navegador moderno. También puedes abrir `index.html` directamente, aunque la carga de Tailwind y las fuentes puede depender de las políticas del navegador.

## Decisiones del spike

- `index.html` contiene los mismos fixtures para las cuatro propuestas.
- `styles.css` define tokens semánticos y temas mediante variables CSS.
- `app.js` controla tabs, teclado, favoritos, modal y estados demostrativos en memoria.
- Tailwind CSS se carga desde CDN como dependencia temporal del spike. Para una versión mantenida debe sustituirse por una instalación local con build reproducible.
- Las fuentes de cada dirección se cargan desde Google Fonts con fallbacks: Manrope/Source Sans 3, DM Sans/Nunito Sans, IBM Plex Sans y Space Grotesk/Atkinson Hyperlegible. Deben confirmarse disponibilidad y licencias antes de incorporarlas al producto.
- La pestaña activa (`previewedOption`) no modifica la decisión formal: `status` permanece `pending_approval` y `selected_option` permanece `null`.

## Validación

Revisa la guía completa en [../specs/00-visual-components-ui-kit/quickstart.md](../specs/00-visual-components-ui-kit/quickstart.md). La revisión mínima cubre teclado, foco, cuatro temas, estados de componentes, contraste y viewports de 320, 375, 768 y 1280 px.
