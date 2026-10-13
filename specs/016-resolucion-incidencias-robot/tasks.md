# Tasks: Resolución automática de incidencias por robot

**Input**: Design documents from `/specs/016-resolucion-incidencias-robot/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-contract.md, quickstart.md

**Tests**: No se generan tareas de test — el spec no los solicita; la validación es operativa vía `quickstart.md`.

**Organization**: Tareas agrupadas por user story (US1 P1 → US2 P2 → US3 P3). El archivo `.github/workflows/robot-resolve.yml` es compartido y se construye incrementalmente — las tareas sobre el mismo archivo son secuenciales.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar identidad robot, credenciales y estructura de archivos del feature

- [x] T001 Crear la etiqueta `TO_LOCO` en el repo (disparador del proceso; ya no se requiere cuenta machine user) — ejecutado: `gh label create TO_LOCO`
- [ ] T002 Crear secret `DEVIN_CLI_TOKEN`: ejecutar `devin auth login` en local, localizar el archivo/valor de credencial persistido por Devin CLI en el directorio de datos del CLI, copiarlo al secret del repo y documentar en `specs/016-resolucion-incidencias-robot/research.md` D2 la ubicación exacta y el procedimiento de restauración — si el token no es extraíble de forma estable, documentar el blocker y evaluar fallback a Devin Cloud API
- [ ] T003 Crear variable opcional de repo `ROBOT_MODEL` con el modelo inicial para `devin --model` (p. ej. `deepseek`); dejar vacía para usar el default
- [x] T004 [P] Crear directorio `.github/robot/` y archivo `.github/robot/pr-body-template.md` con la plantilla de cuerpo de PR: cabecera con referencia a la issue, secciones "Análisis", "Cambios", "Verificaciones ejecutadas", "Supuestos" (rellenadas desde `ROBOT_SUMMARY.md`), pie `Closes #<N>` y aviso "Generado por robot — requiere revisión humana"
- [x] T005 [P] Crear directorio `scripts/robot/` y script `scripts/robot/post-comment.sh` (helper reutilizable que recibe número de issue y cuerpo, y comenta vía `gh issue comment`; también crea las labels `robot:*` si no existen vía `gh label create`)

**Checkpoint**: identidad robot, credenciales y helpers listos — se puede construir el workflow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esqueleto del workflow con disparador, guardias, concurrencia y entorno de ejecución funcionando (sin lógica de resolución aún)

**⚠️ CRITICAL**: Ninguna user story puede empezar hasta completar esta fase

- [x] T006 Crear `.github/workflows/robot-resolve.yml` con `name: robot-resolve`, `on: issues: types: [labeled, unlabeled]` + `workflow_dispatch` con input `issue_number` (type number, required), `permissions: issues: write, pull-requests: write, contents: write`, y `concurrency: group: robot-issue-${{ github.event.issue.number || inputs.issue_number }}` con `cancel-in-progress: false` (contrato en `contracts/workflow-contract.md`)
- [x] T007 Añadir en `.github/workflows/robot-resolve.yml` el job `resolve` con `runs-on: ubuntu-latest`, `timeout-minutes: 60`, y condición `if:` que solo ejecuta cuando `issues.labeled` con `github.event.label.name == 'TO_LOCO'`, o `workflow_dispatch`
- [x] T008 Añadir en `.github/workflows/robot-resolve.yml` los steps de entorno: `actions/checkout@v4`, `actions/setup-node@v4` (node 20, cache npm con `development/package-lock.json`), `npm ci && npx prisma generate` con `working-directory: development` — replicando el setup de `ci.yml`
- [x] T009 Añadir en `.github/workflows/robot-resolve.yml` el step de instalación de Devin CLI en el runner (script de instalación oficial) y el step de restauración de auth desde `DEVIN_CLI_TOKEN`, seguido de `devin auth status` como verificación — valida el mecanismo definido en T002 (riesgo principal del diseño)
- [x] T010 Añadir en `.github/workflows/robot-resolve.yml` la guardia anti-duplicación temprana: step que con `gh issue view` comprueba que la issue sigue abierta con la etiqueta `TO_LOCO` y que NO tiene la label `robot:in-progress`; si ya la tiene, `exit 0` con mensaje de skip (FR-010)
- [x] T011 Añadir en `.github/workflows/robot-resolve.yml` el step que aplica la label `robot:in-progress` a la issue y publica el comentario "trabajo iniciado" con enlace al run (usa `scripts/robot/post-comment.sh`)
- [ ] T012 Validar el esqueleto con `workflow_dispatch` sobre una issue de prueba: el run debe llegar hasta el step de "trabajo iniciado" sin ejecutar agente (T009 verde = auth restaurada correctamente)

**Checkpoint**: workflow dispara correctamente, autentica Devin CLI y marca la issue — implementación de stories puede empezar

---

## Phase 3: User Story 1 — Resolver una incidencia asignándola al robot (Priority: P1) 🎯 MVP

**Goal**: Asignar una issue a la cuenta robot produce una PR lista para revisión humana, con constancia visible del inicio y del resultado

**Independent Test**: Crear una issue sencilla y bien descrita, aplicarle `TO_LOCO` y comprobar que aparece una PR que enlaza a la issue con los cambios propuestos (escenario 1 de `quickstart.md`)

### Implementation for User Story 1

- [x] T013 [US1] Crear `.github/robot/runbook.md` — runbook que recibe el agente con placeholders `{{ISSUE_NUMBER}}`, `{{ISSUE_TITLE}}`, `{{ISSUE_BODY}}`, `{{BRANCH}}`: instruye a leer la issue, consultar los documentos `constitution/` aplicables al dominio del cambio, usar las skills speckit apropiadas de `.github/skills/`, implementar la solución en el código (principalmente bajo `development/`), ejecutar `npm run lint`, `npx tsc --noEmit` y `npm test` en `development/` antes de commitear, commitear en la rama indicada con mensaje que referencie `#{{ISSUE_NUMBER}}`, y escribir `ROBOT_SUMMARY.md` en la raíz (o `ROBOT_ABORT.md` si no puede resolverla — ver contrato en `contracts/workflow-contract.md`)
- [x] T014 [US1] Añadir en `.github/workflows/robot-resolve.yml` el step que renderiza el runbook: sustituye los placeholders con los datos de la issue (`github.event.issue` o, en `workflow_dispatch`, datos obtenidos con `gh issue view`), crea la rama `robot/issue-<N>` desde la rama por defecto (`git checkout -b` + `git push -u origin`) y deja `ROBOT_SUMMARY.md`/`ROBOT_ABORT.md` listados en un `.gitignore` temporal del job
- [x] T015 [US1] Añadir en `.github/workflows/robot-resolve.yml` el step de invocación del agente: `devin -p --prompt-file <runbook-renderizado>` con `--model ${{ vars.ROBOT_MODEL }}` (omitir flag si la variable está vacía) y el `--permission-mode` adecuado para ejecución no interactiva sin aprobaciones (validar flag mínimo necesario — documentado en research.md, riesgos abiertos)
- [x] T016 [US1] Añadir en `.github/workflows/robot-resolve.yml` el step de éxito: si existe `ROBOT_SUMMARY.md` y hay commits nuevos en la rama, pushea la rama y crea la PR con `gh pr create` usando `.github/robot/pr-body-template.md` + contenido íntegro de `ROBOT_SUMMARY.md` y la línea `Closes #<N>`; luego label `robot:done`, retira `robot:in-progress` y comenta el enlace de la PR en la issue
- [x] T017 [US1] Añadir en `.github/workflows/robot-resolve.yml` el step de finalización `if: always()` que retira `robot:in-progress` en cualquier resultado y nunca deja la issue sin estado
- [ ] T018 [US1] Validar escenario 1 de `quickstart.md` end-to-end: etiquetar issue de prueba con `TO_LOCO` → comentario de inicio → rama → PR con `Closes #<N>` → labels correctas (parcialmente ensayado en simulación local: issue #27 → PR #28, con disparador por asignación; repetir con etiqueta tras merge del workflow)

**Checkpoint**: flujo completo issue→PR funciona (MVP entregable)

---

## Phase 4: User Story 2 — Comprender el razonamiento y decisiones del robot (Priority: P2)

**Goal**: La PR y la issue incluyen trazabilidad del análisis del agente (interpretación, skills usadas, supuestos) para revisión con contexto

**Independent Test**: Tras una resolución automática, la PR contiene el resumen del análisis, las decisiones y los supuestos del agente (escenario de verificación de `quickstart.md`)

### Implementation for User Story 2

- [x] T019 [US2] Reforzar `.github/robot/runbook.md`: exigir que `ROBOT_SUMMARY.md` incluya obligatoriamente (a) interpretación de la incidencia en una frase, (b) lista de skills/comandos speckit usados, (c) cambios principales por archivo, (d) verificaciones ejecutadas con resultado, (e) supuestos y puntos ambiguos interpretados por cuenta propia
- [x] T020 [US2] Añadir en `.github/workflows/robot-resolve.yml` validación del contrato: el step de éxito (T016) comprueba que `ROBOT_SUMMARY.md` existe y no está vacío antes de crear la PR; si falta, tratar como fallo (label `robot:failed`, comentario explicando ausencia de trazabilidad) — regla de `data-model.md`
- [x] T021 [US2] Añadir en el step de éxito de `.github/workflows/robot-resolve.yml` un comentario en la issue con un extracto del análisis (primeras líneas de `ROBOT_SUMMARY.md`) además del enlace a la PR, para que el mantenedor no tenga que abrir la PR para entender el planteamiento

**Checkpoint**: cualquier PR del robot es autoexplicativa para el revisor

---

## Phase 5: User Story 3 — Gestionar incidencias que el robot no puede resolver (Priority: P3)

**Goal**: Incidencias irresolubles o fallos del proceso quedan en estado visible y no ambiguo, con motivo y vía de reintento

**Independent Test**: Asignar al robot una issue deliberadamente irresoluble (p. ej. "Arreglar el fallo" sin contexto) y verificar label `robot:needs-human` + comentario con el motivo (escenarios 2 y 4 de `quickstart.md`)

### Implementation for User Story 3

- [x] T022 [US3] Añadir en `.github/workflows/robot-resolve.yml` el step de aborto controlado: si existe `ROBOT_ABORT.md`, comentar en la issue su contenido (motivo) + instrucciones para enriquecer la issue y reintentar, aplicar label `robot:needs-human`, retirar `robot:in-progress`, y terminar el job con éxito sin crear PR
- [x] T023 [US3] Añadir en `.github/workflows/robot-resolve.yml` el step `if: failure()` que cubre errores internos (agente crash, timeout, auth): comentario con motivo general y enlace al log del run + label `robot:failed` + retirada de `robot:in-progress`
- [x] T024 [US3] Añadir en `.github/workflows/robot-resolve.yml` la detección de cancelación: step que aborta limpiamente si se retiró la etiqueta `TO_LOCO` o la issue se cerró mientras corre (caso `issues.unlabeled` / issue closed), retirando `robot:in-progress` y comentando la cancelación
- [x] T025 [US3] Documentar en `.github/robot/runbook.md` las condiciones de abandono: cuándo el agente MUST escribir `ROBOT_ABORT.md` en vez de intentar cambios parciales (descripción insuficiente, fuera de alcance, recursos externos no disponibles, verificaciones que no pasan tras N intentos)
- [ ] T026 [US3] Validar escenarios 2 y 4 de `quickstart.md`: issue irresoluble → `robot:needs-human` sin PR; reintento vía `workflow_dispatch`; anti-duplicación bajo reasignación rápida

**Checkpoint**: ninguna issue queda en estado ambiguo; todos los resultados son visibles

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Endurecimiento transversal y documentación

- [x] T027 [P] Revisión de seguridad del workflow: verificar que `DEVIN_CLI_TOKEN` no se imprime en logs (enmascarar si hace falta), que el contenido de la issue se trata como texto no confiable (sin interpolación directa en comandos de shell — usar archivos intermedios/env), y que los permisos son los mínimos declarados en `contracts/workflow-contract.md`
- [x] T028 [P] Añadir `.gitignore` raíz o regla en `.gitignore` del job para `ROBOT_SUMMARY.md` y `ROBOT_ABORT.md` y step que los elimina del índice si el agente los commitea por error
- [x] T029 Documentar la operativa del robot en `docs/10-automatizacion-incidencias-robot.md`: cómo aplicar `TO_LOCO`, labels `robot:*`, cómo reintentar/cancelar, y configuración (`ROBOT_MODEL`, `DEVIN_CLI_TOKEN`)
- [ ] T030 Ejecutar la validación completa de `quickstart.md` (escenarios 1–5) y registrar resultados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — T002 (token) es el riesgo principal y debe hacerse primero en la práctica
- **Foundational (Phase 2)**: depende de T001–T003 (identidad + secret necesarios para T009); T004/T005 solo bloquean T016/T011 respectivamente
- **US1 (Phase 3)**: depende de Foundational completo
- **US2 (Phase 4)**: depende de US1 (modifica runbook y step de éxito creados en T013–T016)
- **US3 (Phase 5)**: depende de US1 (añade ramas alternativas al mismo workflow)
- **Polish (Phase 6)**: depende de todas las stories

### User Story Dependencies

- **US1 (P1)**: independiente tras Foundational — flujo feliz completo
- **US2 (P2)**: extiende el contrato de salida de US1 — secuencial en la práctica (mismo archivo)
- **US3 (P3)**: extiende el manejo de resultados de US1 — secuencial en la práctica (mismo archivo)

### Parallel Opportunities

- T004 y T005 son paralelos (archivos distintos)
- T027, T028, T029 son paralelos (archivos distintos)
- Dentro de una fase, las tareas sobre `.github/workflows/robot-resolve.yml` son siempre secuenciales (mismo archivo)

## Parallel Example

```bash
# Setup paralelo:
Task: "Crear .github/robot/pr-body-template.md"
Task: "Crear scripts/robot/post-comment.sh"

# Polish paralelo:
Task: "Revisión de seguridad del workflow"
Task: "Añadir .gitignore para sentinels"
Task: "Documentar operativa en docs/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) — con foco en desbloquear T002 (token Devin CLI) cuanto antes
2. Phase 2 (Foundational) — esqueleto del workflow validado con dispatch manual
3. Phase 3 (US1) — flujo feliz completo issue→PR
4. **STOP y VALIDAR** con escenario 1 de `quickstart.md`

### Incremental Delivery

1. Setup + Foundational → infraestructura lista
2. US1 → MVP: etiquetar issue con `TO_LOCO` genera PR revisable
3. US2 → trazabilidad para el revisor
4. US3 → robustez operativa (fallos visibles, reintentos, anti-duplicación)
5. Polish → seguridad, docs, validación final

---

## Notes

- [P] = archivos distintos sin dependencias; todo lo que toca `robot-resolve.yml` es secuencial
- T002 es la tarea de mayor riesgo: si el token de `devin auth` no puede extraerse/restaurarse en CI de forma estable, el diseño contempla fallback a Devin Cloud API (research.md D2)
- Los commits del robot deben respetar `constitution/` — lo exige el runbook (T013) y lo verifican CI + revisión humana (T027/T030)
