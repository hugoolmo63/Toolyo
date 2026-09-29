# Implementation Plan: Batería de tests de navegación

**Branch**: `010-navigation-test-suite` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-navigation-test-suite/spec.md`

## Summary

Batería completa de pruebas de navegación que usa el framework E2E ya establecido (Playwright) para visitar todas las rutas públicas de la aplicación, verificar que renderizan el contenido esperado, comprobar los elementos de navegación principales (logo, cabecera, pie de página) y confirmar que las rutas protegidas redirigen al login a usuarios anónimos. Se implementa como un nuevo spec `navigation.spec.ts` dentro de `development/tests/e2e/`, ejecutable con un único comando contra el dev server (auto-arrancado por Playwright) o contra cualquier URL vía `E2E_BASE_URL`.

## Technical Context

**Language/Version**: TypeScript, Node.js 20+ (mismo stack que los specs E2E existentes)

**Primary Dependencies**: `@playwright/test` ^1.63.0 (ya instalada en `development/package.json`)

**Storage**: N/A — la batería es de solo lectura; no toca base de datos ni crea datos

**Testing**: Playwright Test runner (`development/playwright.config.ts` ya existente: `testDir: ./tests/e2e`, `baseURL` por `E2E_BASE_URL`, reporter `list`, trace/screenshot en fallo); el spec activa `video: 'on'` a nivel de archivo para grabar evidencia de cada comprobación

**Target Platform**: CLI multiplataforma (Windows/macOS/Linux) ejecutado contra una instancia Next.js — dev server auto-arrancado por `webServer` de la config, o instancia externa (Docker `deploy-test.mjs`, staging) vía `E2E_BASE_URL`

**Project Type**: suite de tests E2E para aplicación web existente (Next.js App Router en `development/`)

**Performance Goals**: batería completa < 3 min contra instancia local (SC-001); < 60 s por spec según `TESTING.md` §2

**Constraints**: solo lectura, determinista, esperas explícitas (no `setTimeout` arbitrarios — `TESTING.md` §9), timeouts acotados, fallo rápido y claro si el destino no responde; vídeo de evidencia por test (`video: 'on'`) conservado siempre en `test-results/`

**Scale/Scope**: ~15-25 comprobaciones de navegación sobre las ~10 rutas públicas y 3 grupos de rutas protegidas de la aplicación

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / documento | Evaluación | Resultado |
|---|---|---|
| `TESTING.md` §2 pirámide: E2E con Playwright | La batería se implementa con Playwright dentro de la suite E2E existente (`development/tests/e2e/`). Alineado tras el refinamiento del usuario. | PASS |
| `TESTING.md` §1.3 determinismo | Esperas explícitas (`expect(page).toHaveURL`, `waitForSelector`, auto-waiting de locators), timeouts acotados, sin `setTimeout` arbitrarios. | PASS |
| `TESTING.md` §5.1 alcance E2E | Navegación pública + protección de rutas es un flujo crítico mínimo ("si se rompe, impide operar"). No duplica flujos autenticados ya cubiertos por specs existentes. | PASS |
| `TESTING.md` §5.2 datos de test | La batería es de solo lectura; usa datos del seed existente y resolución dinámica de rutas dependientes de datos. | PASS |
| `TESTING.md` §5.3 selectores | Se priorizan selectores estables (los mismos ya validados en `smoke-login-dialog.mjs`: `.public-header`, `.public-nav-button`, etc.). | PASS |
| `TESTING.md` §5.4 autonomía | Cada test es autónomo y no depende del estado de otro. | PASS |
| `SECURITY.md` | La batería no autentica usuarios ni maneja credenciales; verifica únicamente redirecciones de rutas protegidas. | PASS |

**Veredicto**: PASS — sin desviaciones; alineado con la constitución.

## Project Structure

### Documentation (this feature)

```text
specs/010-navigation-test-suite/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── cli.md           # Contrato del comando: args, env, salida, exit codes
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
development/
├── playwright.config.ts                    # existente — testDir: ./tests/e2e, E2E_BASE_URL, webServer
├── tests/e2e/
│   ├── bookings-messaging.spec.ts          # existente
│   ├── listing-management/                 # existente
│   ├── reviews*.spec.ts                    # existente
│   └── navigation.spec.ts                  # NUEVO — batería de navegación
└── package.json
    └── scripts: + "test:e2e"               # NUEVO — alias de `playwright test`
```

**Structure Decision**: La batería es un spec más de la suite E2E en `development/tests/e2e/navigation.spec.ts`, aprovechando `playwright.config.ts` existente (baseURL configurable, webServer que auto-arranca el dev server, trace/screenshot en fallo). Se añade un alias `test:e2e` en `development/package.json` para ejecutarla con un único comando, consistente con `test`/`test:integration` ya existentes.

## Complexity Tracking

Sin desviaciones de la constitución.
