---

description: "Task list for the interactive HTML/Tailwind UI Kit showcase"
---

# Tasks: Showcase Interactivo de UI Kits

**Input**: Design documents from `specs/00-visual-components-ui-kit/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/showcase-ui.md](contracts/showcase-ui.md), [quickstart.md](quickstart.md)

**Organization**: Las tareas están agrupadas por historia de usuario para permitir entregas independientes y verificables.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear la estructura mínima del showcase estático según el plan.

- [X] T001 Crear `showcase/index.html` como documento HTML5 con metadata responsive, título del catálogo y referencias a `styles.css` y `app.js`.
- [X] T002 [P] Crear `showcase/styles.css` con reset mínimo, variables de layout, breakpoints y soporte de `prefers-reduced-motion`.
- [X] T003 [P] Crear `showcase/app.js` con módulo inicial vacío para estado de preview, registro de temas y montaje del catálogo.
- [X] T004 [P] Crear `showcase/README.md` con comando de servidor estático, dependencia temporal de Tailwind CDN y límites del spike.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar los datos y contratos compartidos que bloquean todas las historias.

**Critical**: Completar esta fase antes de implementar las historias de usuario.

- [X] T005 Definir en `showcase/app.js` el registro de las cuatro `ThemeOption` con IDs, nombres, descripciones y tokens derivados de `spec.md` y `data-model.md`.
- [X] T006 [P] Definir en `showcase/styles.css` las variables semánticas para color, tipografía, forma, foco y elevación, incluyendo valores base y atributos por tema.
- [X] T007 [P] Crear en `showcase/index.html` la estructura semántica común con encabezado, estado `pending_approval`, `tablist`, `tabpanel` y regiones para componentes.
- [X] T008 Definir en `showcase/app.js` el `PreviewState` inicial con `previewed_option`, `status: pending_approval` y `selected_option: null`, sin persistencia ni mutación accidental de aprobación.
- [X] T009 Definir en `showcase/index.html` fixtures de contenido estable para nombres largos, listing sin imagen, rating ausente, usuario no verificado, mensajes largos y chat vacío.

**Checkpoint**: El HTML carga una estructura vacía pero semántica, los cuatro temas están definidos y el estado de aprobación sigue pendiente.

---

## Phase 3: User Story 1 - Revisar catálogo común de componentes MVP (Priority: P1) 🎯 MVP

**Goal**: Entregar un catálogo visual único con los componentes y estados necesarios para los flujos MVP.

**Independent Test**: Abrir `showcase/index.html` servido localmente y localizar botones, inputs, badges, tarjeta, feedback, modal y chat; cada componente debe exponer sus estados y mantener foco, legibilidad y layout estable.

### Implementation for User Story 1

- [X] T010 [US1] Implementar en `showcase/index.html` la sección de botones con variantes primaria, secundaria, terciaria, destructiva, icon-only y estados disabled/loading.
- [X] T011 [US1] Implementar en `showcase/index.html` la sección de formularios con inputs de texto, email, contraseña, búsqueda, ubicación, precio y textarea, incluyendo ayuda, error, éxito y contador.
- [X] T012 [US1] Implementar en `showcase/index.html` la sección de badges de usuario/producto para Verificado, Superarrendador, Popular, Fast responder y estados de listing.
- [X] T013 [US1] Implementar en `showcase/index.html` la tarjeta de listing con imagen/placeholder, título largo, precio diario, ubicación, rating, arrendador, avatar, badge y favorito.
- [X] T014 [US1] Implementar en `showcase/index.html` ejemplos de feedback, banner contextual, estado vacío, skeleton/loading, error y éxito con indicadores textuales o iconográficos además del color.
- [X] T015 [US1] Implementar en `showcase/index.html` un modal demostrativo de confirmación y aviso de usuario no verificado con título, descripción, cierre, foco y acciones.
- [X] T016 [US1] Implementar en `showcase/index.html` la caja de chat con conversación vacía, mensajes propios/ajenos, timestamp, avatar verificado, adjunto, composer y fallo de envío.
- [X] T017 [P] [US1] Añadir en `showcase/styles.css` estilos responsive y de estados para botones, inputs, badges y tarjetas sin overflow a 320 px ni solapamiento de texto.
- [X] T018 [P] [US1] Añadir en `showcase/styles.css` estilos responsive y de estados para feedback, modal y chat, incluyendo foco visible y `prefers-reduced-motion`.
- [X] T019 [US1] Añadir en `showcase/app.js` comportamiento demostrativo de favorito, apertura/cierre de modal, envío fallido de chat y toggles de estados sin persistir datos reales.

**Checkpoint**: US1 es demostrable de forma independiente y cubre el catálogo mínimo de componentes con estados accesibles.

---

## Phase 4: User Story 2 - Comparar cuatro direcciones visuales (Priority: P1)

**Goal**: Permitir que el equipo cambie entre las cuatro propuestas y compare los mismos componentes bajo cada sistema de tokens.

**Independent Test**: Activar cada tab con ratón y teclado y comprobar que el panel actualiza nombre, descripción, tokens, tipografía, forma y componentes sin duplicar el markup ni marcar una propuesta como aprobada.

### Implementation for User Story 2

- [X] T020 [US2] Renderizar en `showcase/index.html` el panel de tokens de la propuesta activa con swatches para primario, secundario, error y éxito, muestras tipográficas y valores de radios/sombras.
- [X] T021 [US2] Implementar en `showcase/app.js` la selección de preview de temas aplicando `data-theme` al contenedor y actualizando título, descripción y tokens desde el registro.
- [X] T022 [US2] Implementar en `showcase/app.js` navegación accesible de tabs con `aria-selected`, `aria-controls`, flechas, `Home`, `End`, `Enter` y `Space`.
- [X] T023 [US2] Añadir en `showcase/index.html` una indicación persistente que diferencie “tema previsualizado” de “decisión de estilo” y muestre `pending_approval`/`selected_option: null`.
- [X] T024 [P] [US2] Ajustar en `showcase/styles.css` las cuatro direcciones visuales con diferencias perceptibles de paleta, tipografía, radios, bordes, sombras y tratamiento de componentes.
- [X] T025 [US2] Verificar en `showcase/README.md` que los nombres de fuentes, fallbacks y origen/licencia pendiente de confirmación están documentados sin bloquear el renderizado.

**Checkpoint**: Las cuatro propuestas pueden compararse en el navegador sobre los mismos fixtures y ninguna interacción de preview aprueba una opción.

---

## Phase 5: User Story 3 - Preparar decisión y handoff (Priority: P2)

**Goal**: Dejar la demo preparada para que una revisión humana identifique una opción y registre una decisión formal posteriormente.

**Independent Test**: Revisar el estado inicial, consultar la opción activa y comprobar que el contrato de decisión mantiene todos los campos requeridos y que la previsualización no los altera.

### Implementation for User Story 3

- [X] T026 [US3] Añadir en `showcase/index.html` la sección de decisión con los cuatro IDs válidos, estado actual, opción seleccionada, aprobador, fecha y notas.
- [X] T027 [US3] Implementar en `showcase/app.js` validación de que `selected_option` solo puede ser nulo o uno de los cuatro IDs y que la demo no cambia `approved_by`, `approved_at` ni `decision_notes`.
- [X] T028 [US3] Documentar en `showcase/README.md` el procedimiento de revisión, la diferencia entre preview y aprobación y el handoff al futuro PR de prototipos.

**Checkpoint**: El equipo tiene una superficie clara para tomar la decisión, aunque el showcase permanezca en `pending_approval` hasta aprobación humana.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar la experiencia completa y dejar el spike reproducible.

- [X] T029 [P] Ejecutar validación HTML sobre `showcase/index.html` y corregir landmarks, labels, IDs, roles y atributos ARIA inválidos.
- [X] T030 [P] Ejecutar revisión de contraste y foco sobre `showcase/styles.css` para estados normales, error, éxito, tabs, inputs, botones y modal.
- [X] T031 [P] Revisar manualmente `showcase/index.html` y `showcase/styles.css` en 320, 375, 768 y 1280 px y corregir overflow, truncado o solapamiento.
- [X] T032 Ejecutar el quickstart desde `specs/00-visual-components-ui-kit/quickstart.md` y registrar cualquier dependencia de red o diferencia entre apertura directa y servidor estático en `showcase/README.md`.
- [X] T033 [P] Crear `tests/showcase.spec.js` con smoke tests Playwright para carga, cuatro tabs, `aria-selected`, estado pendiente, cambio de panel y ausencia de overflow móvil, si el proyecto incorpora runner de pruebas.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; crea los archivos del showcase.
- **Foundational (Phase 2)**: Depende de Setup y bloquea las historias.
- **User Story 1 (Phase 3)**: Depende de Foundation; es el MVP recomendado.
- **User Story 2 (Phase 4)**: Depende de los fixtures y tokens de Foundation; completa la comparación interactiva sobre US1.
- **User Story 3 (Phase 5)**: Depende del estado y selector de US2; prepara el handoff de aprobación.
- **Polish (Phase 6)**: Depende de las historias que se quieran entregar.

### User Story Dependencies

- **US1 (P1)**: Puede comenzar tras Foundation y es el incremento MVP independiente.
- **US2 (P1)**: Depende técnicamente de los fixtures y tokens de Foundation; puede implementarse en paralelo con componentes de US1 si se conservan las interfaces definidas.
- **US3 (P2)**: Depende del selector de temas de US2, pero solo añade la superficie de decisión y su validación.

### Parallel Opportunities

- T002, T003 y T004 pueden ejecutarse en paralelo tras T001.
- T006, T007 y T009 pueden ejecutarse en paralelo tras T005.
- T017 y T018 pueden ejecutarse en paralelo porque afectan regiones distintas de `styles.css`.
- T020, T024 y T025 pueden ejecutarse en paralelo tras la base de selección de US2.
- T029, T030, T031 y T033 pueden ejecutarse en paralelo en Polish.

## Parallel Example: User Story 1

```text
Task: "Implementar la sección de formularios en showcase/index.html"
Task: "Implementar la tarjeta de listing en showcase/index.html"
Task: "Añadir estilos responsive de botones, inputs, badges y tarjetas en showcase/styles.css"
Task: "Añadir estilos responsive de feedback, modal y chat en showcase/styles.css"
```

## Parallel Example: User Story 2

```text
Task: "Renderizar el panel de tokens en showcase/index.html"
Task: "Ajustar las cuatro direcciones visuales en showcase/styles.css"
Task: "Documentar fuentes y fallbacks en showcase/README.md"
```

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3, User Story 1.
3. Ejecutar la validación independiente de US1 y mostrar el catálogo a revisión.
4. Detenerse aquí si se necesita únicamente una primera versión navegable del catálogo.

### Incremental Delivery

1. Añadir US2 para comparar las cuatro propuestas en el navegador.
2. Validar teclado, tokens y separación entre preview y aprobación.
3. Añadir US3 para dejar documentado el handoff de decisión.
4. Completar Polish y, si se incorpora un runner, automatizar los smoke tests.

## Notes

- Cada tarea tiene checkbox, ID secuencial, etiquetas de paralelismo/historia cuando aplican y una ruta de archivo concreta.
- Las tareas no crean backend, datos reales ni persistencia de aprobación.
- Tailwind por CDN es una dependencia temporal del spike; su migración a build local queda fuera de este desglose salvo que el equipo decida conservar el showcase como herramienta mantenida.
