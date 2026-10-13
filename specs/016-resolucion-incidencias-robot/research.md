# Research: Resolución automática de incidencias por robot

Fase 0 del plan. Todas las decisiones del Technical Context quedan resueltas aquí.

## D1. Runtime del agente

- **Decision**: Devin CLI en modo no interactivo (`devin -p "<prompt>"` con `--prompt-file` para el runbook) ejecutándose en el runner `ubuntu-latest` de GitHub Actions.
- **Rationale**: elegido por el mantenedor tras análisis de coste. Reutiliza su suscripción Cognition/Windsurf (facturación por inferencia contra la cuota del plan), soporta `--model`/`DEVIN_MODEL` para usar modelos baratos (p. ej. DeepSeek) y carga las skills del repo en `.github/skills/`, donde ya viven todas las `speckit-*`.
- **Alternatives considered**:
  - *Devin Cloud API* (`POST /v3/organizations/{org}/sessions`): patrón oficial documentado para CI con VM completa; ~$4.50–9/incidencia — más caro.
  - *Claude Code headless* (`claude -p` / `anthropics/claude-code-action`): ~$0.30–3/incidencia, integración nativa de spec-kit; requiere API key Anthropic adicional.
  - *opencode + speckit*: ~$0–0.20/incidencia con DeepSeek/free tiers; bug conocido de spec-kit despachando `/speckit.*` a opencode (#2409, usa `-p` no soportado) y calidad de modelos baratos inferior.
  - *GitHub Copilot coding agent*: no ejecuta comandos/skills speckit; solo custom instructions.

## D2. Autenticación de Devin CLI en CI

- **Decision**: `devin auth login` produce un token persistente (según docs: "API tokens do not expire by default"). Se autentica una vez en local, se copia la credencial a un secret del repo (`DEVIN_CLI_TOKEN`) y el workflow restaura el estado de auth antes de invocar `devin -p`.
- **Rationale**: mecanismo más simple disponible para la suscripción existente; no requiere crear service user de organización.
- **Alternatives considered**: service user + API v3 de Devin Cloud (más limpio pero es otra opción de runtime — descartada en D1); reinstalar+login interactivo por run (inviable, `auth login` usa flujo de navegador; existe `--force-manual-token-flow` que sigue siendo manual).
- **Resuelto en implementación**: `devin auth status` reporta la ruta de credenciales: `~/.config/devin/credentials.toml` en Linux/macOS y `%APPDATA%\devin\credentials.toml` en Windows. El workflow restaura el contenido del secret `DEVIN_CLI_TOKEN` en `~/.config/devin/credentials.toml` del runner antes de invocar `devin -p`. Instalación del CLI en el runner: `curl -fsSL https://cli.devin.ai/install.sh | bash` (binario en `~/.local/bin/devin`).

## D3. Disparador: etiqueta `TO_LOCO`

- **Decision** (actualizada por decisión del mantenedor): workflow `on: issues: types: [labeled, unlabeled]` con guardia `github.event.label.name == 'TO_LOCO'`. La etiqueta `TO_LOCO` es el disparador; no se requiere cuenta robot dedicada — la autoría de commits usa una identidad de bot genérica (`toolyo-bot`).
- **Rationale**: más simple que la asignación (no requiere crear ni mantener un machine user colaborador); retirar la etiqueta sirve además como señal de cancelación; las etiquetas `robot:*` quedan reservadas como canal de estado.
- **Alternatives considered**: asignación a cuenta robot dedicada — diseño original, descartado por el mantenedor por exigir un machine user; comentario con comando (`/robot`) — requiere permiso de comentarista y parsing de `issue_comment`.

## D4. Idempotencia y cancelación/reintento

- **Decision**:
  - `concurrency: robot-issue-${{ github.event.issue.number }}` con `cancel-in-progress: false` → una sola ejecución a la vez por issue (FR-010).
  - Etiqueta de estado `robot:in-progress` aplicada al inicio; el guard del job aborta temprano si la issue ya la tiene (evita trabajo duplicado al reaplicar `TO_LOCO` mientras corre).
  - Reintento: retirar y reaplicar la etiqueta `TO_LOCO` (relanza el workflow), o `workflow_dispatch` con `issue_number` como entrada manual.
  - Cancelación: retirar la etiqueta `TO_LOCO` o cerrar la issue → el job lo detecta al evaluar el resultado y termina sin crear PR.
- **Rationale**: todo el mecanismo usa primitivas de Actions sin estado externo (no hay storage — FR coherente).
- **Alternatives considered**: estado en un branch/archivo de tracking — complejidad innecesaria; `cancel-in-progress: true` — peligroso (podría dejar una rama a medias).

## D5. Separación agente ↔ workflow (quién crea la PR)

- **Decision**: responsabilidades divididas:
  - **Workflow (determinista)**: guardias, comentario de "trabajo iniciado", checkout, setup Node 20 + `npm ci` + `prisma generate` en `development/`, instalación de Devin CLI, creación de la rama `robot/issue-<N>`, creación de la PR con `gh pr create` (cuerpo desde plantilla + `ROBOT_SUMMARY.md`), comentarios/etiquetas finales, limpieza de estado.
  - **Agente (`devin -p` con runbook)**: leer la issue, consultar `constitution/` aplicable, usar skills speckit apropiadas, implementar, ejecutar verificaciones (`lint`, `tsc --noEmit`, `npm test` en `development/`), commitear en la rama, y escribir `ROBOT_SUMMARY.md` (análisis + supuestos) o `ROBOT_ABORT.md` (motivo de abandono).
- **Rationale**: el agente es probabilístico; conviene que las operaciones con efectos externos (comentarios, labels, PR) sean deterministas. La trazabilidad (US2) queda garantizada porque el archivo de resumen es contractual — si el agente no lo produce, el workflow lo trata como fallo.
- **Alternatives considered**: que el agente haga también el push/PR/comentarios — menos control sobre formato y sobre los casos de fallo; usar `aaronsteers/devin-action` — orientado a Devin Cloud API, no a CLI local.

## D6. Convenciones de archivos de salida del agente (contrato)

- **Decision**: dos archivos sentinel en la raíz del checkout:
  - `ROBOT_SUMMARY.md` — obligatorio en éxito: resumen de la incidencia interpretada, cambios, verificaciones ejecutadas y supuestos. Se incrusta en el cuerpo de la PR.
  - `ROBOT_ABORT.md` — presente si el agente abandona: motivo (información insuficiente / fuera de alcance / bloqueado).
  - Regla del workflow: `ROBOT_ABORT.md` presente → comentario + label `robot:needs-human`, sin PR. Ausencia de ambos o fallo del job → comentario + label `robot:failed`.
- **Rationale**: contrato mínimo, fácil de instruir en el runbook y de validar en el workflow con `test -f`.

## D7. Puerta de calidad de la PR

- **Decision**: el agente ejecuta localmente `npm run lint`, `npx tsc --noEmit` y `npm test` (vitest unit) en `development/` antes de commitear; la PR resultante pasa además por `ci.yml` existente como cualquier contribución. El robot nunca auto-fusiona; branch protection / revisión humana decide.
- **Rationale**: FR-008 + Constitution gate V. Reutiliza la infraestructura de verificación ya existente — cero duplicación.
- **Alternatives considered**: que el workflow ejecute los tests tras el agente antes de abrir la PR — viable como mejora futura; de momento el doble chequeo (agente + CI sobre la PR) cubre el requisito.

## D8. Modelo y control de coste

- **Decision**: modelo configurable vía variable de repo `ROBOT_MODEL` (pasada a `devin --model`); `timeout-minutes` en el job como techo de ejecución; concurrencia por issue limitada a 1 (D4).
- **Rationale**: cumple el constraint de coste del Technical Context sin hardcodear el modelo; el mantenedor puede empezar con un modelo barato (p. ej. DeepSeek) y subir a frontier si la tasa de éxito lo requiere.

## D9. Permisos del workflow

- **Decision**: `permissions: issues: write, pull-requests: write, contents: write` en el job. El secret `DEVIN_CLI_TOKEN` solo se materializa en el paso de auth; `GITHUB_TOKEN` con esos tres scopes es suficiente (FR-011, alcance mínimo). `actions: write` NO es necesario.
- **Rationale**: principio de mínimo privilegio; `contents: write` es necesario para push de la rama `robot/issue-<N>`.

## Cuestiones resueltas sin investigación adicional

- El repo ya dispone de `ci.yml` (lint+typecheck+tests) que actúa como puerta — no hay que crear verificación nueva.
- Las skills speckit ya están en `.github/skills/` y Devin CLI las carga automáticamente al abrir el workspace — el runbook solo tiene que referenciarlas por nombre (`/speckit-*`).

## Riesgos abiertos (documentados, no bloquean el diseño)

- Extracción del token de Devin CLI para secrets (D2) — riesgo principal; validar primero en implementación.
- `devin -p` non-interactive puede requerir `--permission-mode`/`--sandbox` adecuados para no quedarse bloqueado en prompts de aprobación — ajustar flags en implementación (`--permission-mode` admite `dangerous`/`autonomous` según docs).
- Si el agente modifica archivos fuera de `development/` (p. ej. `specs/`), el runbook debe acotar el alcance del cambio.
