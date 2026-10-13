# Data Model: Resolución automática de incidencias por robot

Fase 1 del plan. La feature no introduce persistencia nueva: el estado vive en GitHub (issues, labels, comentarios, ramas, PRs) y en archivos efímeros del job. Este documento modela esas entidades y sus transiciones.

## Entidades

### Incidencia (GitHub Issue)

Unidad de entrada del proceso. Propiedad del rastreador del repo.

| Campo | Uso en el flujo |
|-------|-----------------|
| `number` | Identificador; clave de concurrencia (`robot-issue-<N>`) y nombre de rama (`robot/issue-<N>`) |
| `title`, `body` | Entrada del análisis del agente; contenido no confiable (texto libre de usuario) |
| `labels` | Disparador (`TO_LOCO`) y canal de estado del proceso (ver tabla de labels) |
| `comments` | Canal de notificación (inicio, éxito, aborto, fallo) |

**Etiqueta disparadora**:

| Label | Significado | Se aplica | Se retira |
|-------|-------------|-----------|-----------|
| `TO_LOCO` | Disparador del proceso | Por el mantenedor, manualmente | Por el mantenedor (cancelación) |

**Labels de proceso** (namespace `robot:*`, creadas por el workflow si no existen):

| Label | Significado | Se aplica | Se retira |
|-------|-------------|-----------|-----------|
| `robot:in-progress` | Trabajo en curso | Al iniciar el job | Al finalizar (éxito, aborto o fallo) |
| `robot:done` | PR generada | Al crear la PR | — |
| `robot:needs-human` | El agente abandonó (info insuficiente / fuera de alcance) | Al detectar `ROBOT_ABORT.md` | — |
| `robot:failed` | Error interno del proceso | En step `if: failure()` | — |

### Identidad robot

| Elemento | Valor |
|----------|-------|
| Disparador | Etiqueta `TO_LOCO` aplicada a la issue (no requiere cuenta dedicada) |
| Autoría de commits | `toolyo-bot <toolyo-bot@users.noreply.github.com>` (identidad genérica de bot) |
| Credencial agente | Token de Devin CLI en secret `DEVIN_CLI_TOKEN` |
| Credencial GitHub | `GITHUB_TOKEN` del job con `issues:write`, `pull-requests:write`, `contents:write` |

### Trabajo de resolución (Robot Run)

Ejecución aislada por incidencia. No persiste fuera del job + artifacts de Actions.

| Campo | Origen |
|-------|--------|
| Estado | `queued → running → succeeded / aborted / failed` (derivado del resultado del job y sentinels) |
| Rama | `robot/issue-<N>`, creada por el workflow desde la rama por defecto |
| Commit(s) | Autoría del agente; mensaje referenciando `#<N>` |
| `ROBOT_SUMMARY.md` | Efímero; escrito por el agente, leído por el workflow, **no se commitea** |
| `ROBOT_ABORT.md` | Efímero; mismo contrato |
| Log | Output del run de Actions (tra auditable del agente) |

**Transiciones de estado**:

```text
labeled(TO_LOCO) ──► running ──► succeeded   [ROBOT_SUMMARY.md + cambios committeados → PR creada, label robot:done]
                     │
                     ├──► aborted    [ROBOT_ABORT.md presente → comentario + label robot:needs-human, sin PR]
                     │
                     ├──► failed     [job failure o sin sentinels → comentario + label robot:failed]
                     │
                     └──► cancelled  [TO_LOCO retirada o issue cerrada en curso → comentario, sin PR]
```

Reintento válido desde `aborted`/`failed`/`done`: retirar y reaplicar `TO_LOCO` o `workflow_dispatch` (nuevo run; la etiqueta `robot:in-progress` impide solapamiento).

### Solicitud de cambios (Pull Request)

Salida revisable. Creada por el workflow (determinista), nunca por el agente.

| Campo | Contenido |
|-------|-----------|
| `head` | `robot/issue-<N>` |
| `base` | rama por defecto del repo |
| `title` | `robot: <título de la issue> (#<N>)` |
| `body` | plantilla `pr-body-template.md` + contenido íntegro de `ROBOT_SUMMARY.md` + `Closes #<N>` |
| Revisión | requiere aprobación humana; el robot no puede aprobar/fusionar (protección de rama existente) |

## Reglas de validación derivadas de los FRs

- **FR-002/FR-004**: solo dispara `issues.labeled` con `label.name == "TO_LOCO"`; cualquier otra etiqueta/edición ignora.
- **FR-010**: `concurrency` por issue + guardia `robot:in-progress` ⇒ máximo 1 run activo por issue.
- **FR-007**: el agente no recibe instrucción ni necesidad de tocar GitHub; la PR la crea el workflow y la fusión sigue protegida por revisión humana.
- **FR-011**: el agente nunca ve `GITHUB_TOKEN` con permisos elevados ni `DEVIN_CLI_TOKEN` en su prompt; los sentinels van a `.gitignore` del job (se borran del índice si el agente los añade por error).
- **US2/trazabilidad**: PR inválida si falta `ROBOT_SUMMARY.md` ⇒ el workflow lo trata como `failed`, no crea PR vacía.
