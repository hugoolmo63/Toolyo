# Research: Showcase HTML/Tailwind Interactivo

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-08-24

## Contexto del repositorio

**Decisión**: Crear un showcase estático y autónomo en `showcase/`, sin integrarlo todavía con una aplicación frontend.

**Rationale**: El repositorio actual es documental y no contiene `package.json`, código web, runner de tests ni toolchain instalada. La documentación de arquitectura apunta a Next.js, Tailwind y shadcn/ui como stack futuro, pero el catálogo necesita validarse antes de crear esa aplicación.

**Alternativas consideradas**:

- Empezar directamente con Next.js: descartado por añadir routing, build y estructura que el showcase no necesita.
- Crear cuatro páginas separadas: descartado porque dificulta comparar los mismos componentes.
- No crear demo: descartado porque la elección de estilo requiere inspección directa en navegador.

## Tecnología de prototipo

**Decisión**: HTML5, CSS3 y JavaScript ES2022, con Tailwind CSS por CDN como dependencia temporal del spike. Los tokens semánticos y las diferencias entre temas se expresan en variables CSS y un registro de configuración.

**Rationale**: Permite abrir la página directamente o servirla con un servidor estático, mantiene bajo el coste de arranque y deja los tokens independientes del framework. El CDN no se considera solución definitiva por dependencia de red, reproducibilidad, CSP y rendimiento.

**Alternativas consideradas**:

- Tailwind local con Vite: preferible para una versión mantenida; se difiere hasta validar la dirección visual.
- CSS propio sin Tailwind: viable y muy simple, pero se aleja del stack frontend documentado.
- Next.js + Tailwind desde el inicio: alineado con el futuro, pero sobredimensionado para una sola página de fixtures.

## Interacción de comparación

**Decisión**: Usar un `tablist` con cuatro tabs y un único panel de preview, más una indicación separada de que la decisión de estilo sigue `pending_approval`.

**Rationale**: Las tabs permiten comparar un mismo catálogo sin duplicar markup y funcionan bien con teclado, `aria-selected` y panel asociado. La selección de preview no modifica `selected_option` ni equivale a aprobación.

**Alternativas consideradas**:

- Cuatro columnas simultáneas: útil en desktop, pero ilegible en móvil y costosa para inspección detallada.
- Radio buttons: accesibles y sencillos, pero ofrecen menos semántica para paneles de comparación.
- Dropdown: compacto, pero oculta las cuatro opciones y reduce la comparación directa.

## Tipografía y recursos

**Decisión**: Mantener las tipografías de la spec como configuración de cada tema, con fallbacks locales y documentación de origen/licencia. No bloquear el renderizado si una fuente remota no carga.

**Rationale**: Las fuentes son parte de la dirección estética, pero todavía deben confirmarse. El showcase debe seguir siendo usable durante una caída de red.

**Alternativas consideradas**:

- Descargar y versionar fuentes: mejora reproducibilidad, pero requiere confirmar licencias antes de incorporar archivos.
- Usar una sola fuente del sistema: reduce riesgos, pero no representa fielmente las cuatro propuestas.

## Validación

**Decisión**: Combinar validación HTML, revisión manual de teclado y responsive, comprobación de contraste y smoke tests de navegador cuando Playwright esté disponible.

**Rationale**: La feature tiene comportamiento interactivo y requisitos visuales que no se cubren con una inspección textual. Los anchos mínimos serán 320/375 px y los de escritorio 768/1280 px.

**Alternativas consideradas**: Solo revisión visual manual, descartada por no detectar regresiones de selección, atributos ARIA, overflow o foco.
