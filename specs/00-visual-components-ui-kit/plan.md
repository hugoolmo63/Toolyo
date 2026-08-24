# Implementation Plan: Showcase Interactivo de UI Kits

**Branch**: `00-visual-components-ui-kit` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/00-visual-components-ui-kit/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Construir un Showcase HTML/Tailwind interactivo que permita comparar en el navegador las cuatro propuestas visuales de la spec mediante tabs o selector de tema. La página renderizará fixtures comunes de botones, inputs, badges, tarjetas de listing, estados, modal informativo y caja de chat usando tokens visuales por propuesta, de modo que cambiar de tema modifique la dirección estética sin duplicar el catálogo.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: HTML5, CSS3 y JavaScript ES2022; sin runtime de aplicación existente

**Primary Dependencies**: Tailwind CSS por CDN para el spike; variables CSS semánticas para tokens; fuentes con fallback local y origen/licencia documentados

**Storage**: N/A; el estado de comparación vive en memoria y la decisión inicial permanece `pending_approval`

**Testing**: Validación HTML, pruebas manuales de teclado/responsive y smoke tests de interacción con Playwright cuando esté disponible

**Target Platform**: Navegadores evergreen en desktop y móvil; apertura directa del HTML o servidor estático local

**Project Type**: Showcase web estático de documentación visual

**Performance Goals**: Primera renderización visual sin esperas perceptibles en conexión normal; cambio de tema inmediato y sin recrear el layout

**Constraints**: Sin backend ni datos reales; no depender del color como único indicador; foco visible; sin overflow horizontal en 320 px; CDN aceptado solo como spike y debe quedar señalado como dependencia temporal

**Scale/Scope**: Una página, cuatro temas, muestra representativa de componentes MVP y dos breakpoints de comparación: móvil y desktop

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

La constitución del repositorio contiene únicamente placeholders y no establece gates efectivos. Se aplican los gates de la spec: alcance MVP acotado, accesibilidad, responsive, estados no cromáticos y separación entre previsualización y aprobación. **Resultado: PASS**, sin violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
showcase/
├── index.html             # Página única del catálogo interactivo
├── styles.css             # Tokens, temas, layout y estados accesibles
├── app.js                 # Selector de temas y comportamiento demostrativo
└── README.md              # Uso local, dependencia CDN y límites del spike

tests/
└── showcase.spec.js       # Smoke tests Playwright, si se incorpora runner
```

**Structure Decision**: Showcase autónomo en `showcase/`, separado de la futura aplicación Next.js. Se reutilizan fixtures y tokens en todos los temas; no se crean cuatro árboles de markup. Los artefactos de diseño de esta feature permanecen en `specs/00-visual-components-ui-kit/`.

## Phase 0: Research Summary

La investigación está consolidada en [research.md](research.md). Se decide usar HTML/CSS/JS estático y Tailwind por CDN únicamente para acelerar la comparación inicial; los tokens semánticos viven en CSS para que la migración posterior a Tailwind local o Next.js no cambie el contrato visual.

## Phase 1: Design Summary

- [data-model.md](data-model.md) define temas, tokens, componentes, fixtures y estado de decisión.
- [contracts/showcase-ui.md](contracts/showcase-ui.md) define el contrato observable de la página, selector, accesibilidad e interacción.
- [quickstart.md](quickstart.md) define cómo abrir, validar y probar el showcase en móvil y desktop.

## Implementation Outline

1. Crear la estructura `showcase/` y una página semántica con encabezado, selector de propuestas, panel de comparación y secciones de componentes.
2. Modelar las cuatro propuestas en un registro de datos con sus tokens de color, tipografía, forma y elevación tomados de la spec.
3. Implementar tokens como variables CSS y componentes demostrativos reutilizables: botones, inputs, badges, listing card, feedback, modal y chat.
4. Implementar tabs o radio selector accesible; distinguir `previewed_option` de la decisión YAML, manteniendo aprobación en `pending_approval`.
5. Añadir estados demostrativos, contenido largo, vacío, error, loading y foco para validar los requisitos de la spec.
6. Documentar ejecución y dependencia temporal de CDN; validar HTML, responsive, teclado, contraste y ausencia de overflow.
7. Ejecutar smoke tests del selector y del renderizado de los cuatro temas; registrar riesgos o gaps antes de pasar a tareas.

## Constitution Check (Post-Design)

**Resultado: PASS.** El diseño mantiene una sola página y un único sistema de fixtures, no introduce backend ni almacenamiento, documenta la dependencia temporal del CDN y conserva los gates de accesibilidad, responsive y aprobación explícita definidos por la spec.

## Complexity Tracking

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Tailwind por CDN durante el spike | Permite abrir y comparar una página sin crear todavía un proyecto frontend | Vite/Next.js añadiría toolchain y configuración antes de validar la dirección visual |
| Registro de tokens por tema en CSS/JS | Evita duplicar markup y hace visible el contrato de diseño | Cuatro páginas independientes dificultarían la comparación y el mantenimiento |
