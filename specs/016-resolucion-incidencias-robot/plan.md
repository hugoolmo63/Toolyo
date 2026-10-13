# Implementation Plan: Resolución automática de incidencias por robot

**Branch**: `016-resolucion-incidencias-robot` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-resolucion-incidencias-robot/spec.md`

## Summary

Automatizar la resolución de incidencias del repositorio: al aplicar la etiqueta `TO_LOCO` a una issue, un workflow de GitHub Actions descarga el proyecto en un runner, ejecuta **Devin CLI en modo no interactivo** (`devin -p`, autenticado con la suscripción Cognition/Windsurf del mantenedor) con un runbook que le instruye a usar las skills speckit del repo, implementar la solución y dejar la rama lista. El propio workflow crea la pull request con trazabilidad del análisis, y notifica en la issue el resultado (éxito, información insuficiente o fallo). Revisión humana obligatoria antes de fusionar.

## Technical Context

**Language/Version**: YAML (GitHub Actions) + prompt/runbook en Markdown. El proyecto sobre el que opera el robot es TypeScript/Node 20 (Next.js 14, `development/`)

**Primary Dependencies**: GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/github-script`, `gh` CLI), Devin CLI (`devin -p`, `--model`, `devin auth`), skills speckit existentes en `.github/skills/speckit-*`

**Storage**: N/A — el estado vive en GitHub (issues, labels, comentarios, ramas, PRs) y en archivos efímeros del job (`ROBOT_SUMMARY.md`, `ROBOT_ABORT.md`)

**Testing**: las verificaciones existentes del repo actúan como puerta (`npm run lint`, `npx tsc --noEmit`, `npm test` en `development/`); el workflow añade validación operativa (dry-run sobre issue de prueba, escenarios de quickstart)

**Target Platform**: GitHub Actions `ubuntu-latest`

**Project Type**: automatización de repositorio (CI/CD + agente IA)

**Performance Goals**: issue → PR en < 60 min para incidencias baja-media (SC-002)

**Constraints**: credenciales de alcance mínimo (FR-011); sin auto-fusión (FR-007); sin ejecuciones duplicadas por issue (FR-010); coste acotado mediante modelo configurable y `timeout-minutes` del job

**Scale/Scope**: un repositorio, una identidad robot, una ejecución concurrente por issue

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|-----------|------------|
| I. `constitution/` como fuente de verdad | ✅ El robot genera código sobre el mismo repo; su PR pasa por las mismas puertas (CI + revisión humana). El runbook le ordena consultar `constitution/` antes de implementar |
| II. Gobernanza por capas | ✅ La feature es automatización de repo (`.github/`); no toca BACKEND/DATABASE/FRONTEND/DESIGN directamente. Las PRs que genere el robot sí deberán cumplirlos — lo exige el runbook y lo valida CI |
| III. Normas declarativas y verificables | ✅ Los FRs del spec usan MUST y son verificables; el contrato del workflow se documenta en `contracts/` |
| IV. Responsabilidad por dominio | ✅ Dominio afectado: `SECURITY.md` (credenciales, token, PR review) y `TESTING.md` (puertas de calidad). Ambos contemplados en el diseño |
| V. Revisión de cumplimiento | ✅ FR-007: el robot nunca auto-fusiona; toda PR pasa revisión humana + CI existente (`ci.yml`) |

**Resultado**: PASS — sin violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/016-resolucion-incidencias-robot/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/
    └── requirements.md  # spec quality checklist (already exists)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   └── robot-resolve.yml        # Workflow principal (trigger: issues.assigned)
├── robot/
│   ├── runbook.md               # Prompt/runbook que recibe el agente (instrucciones speckit)
│   └── pr-body-template.md      # Plantilla de cuerpo de PR con trazabilidad
└── skills/                      # Skills speckit existentes (consumidas por el agente)

scripts/
└── robot/
    └── post-comment.sh          # Helper para comentar/etiquetar en la issue (opcional, puede ir inline)
```

**Structure Decision**: todo el añadido vive en `.github/` (workflow + artefactos de prompt) más un helper opcional en `scripts/robot/`. No se crean nuevos proyectos ni paquetes: el robot trabaja sobre el código existente en `development/`. Las skills speckit ya presentes en `.github/skills/` son las que el agente usará — la integración speckit del repo apunta a `cline`, pero las skills en `.github/skills/` también son cargadas por Devin CLI, que es el agente elegido.

## Complexity Tracking

> Sin violaciones del Constitution Check — sección no aplicable.
