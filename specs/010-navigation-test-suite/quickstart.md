# Quickstart: validar la batería de navegación

Guía de validación end-to-end de la feature. Ver [contracts/cli.md](contracts/cli.md) para el contrato del comando y [data-model.md](data-model.md) para las entidades.

## Prerrequisitos

- Node.js 20+ y dependencias de `development/` instaladas (`npm --prefix development install`, incluye `@playwright/test`; `npx playwright install` si los browsers no están descargados).
- Una instancia de la aplicación, en una de estas opciones:
  - **Ninguna**: sin `E2E_BASE_URL`, el `webServer` de `playwright.config.ts` arranca `npm run dev` automáticamente (reutiliza uno ya levantado fuera de CI).
  - **Dev server propio**: `npm run dev` en `http://localhost:3000`.
  - **Entorno Docker de pruebas**: `node scripts/deploy-test.mjs` (expone en `http://localhost:3100`, incluye seed por defecto).
- El entorno debe tener datos del seed por defecto para los tests de `/listings/<slug>` y `/users/<id>`.

## Escenario 1 — Todo funciona (camino feliz)

```bash
npm --prefix development run test:e2e -- navigation
```

**Resultado esperado**: todos los tests `passed`; resumen `N passed`; exit code 0. Duración < 3 min.

**Evidencia en vídeo**: cada test deja su grabación en `development/test-results/<nombre-del-test>/video.webm`, tanto si pasa como si falla. Reproducir cualquiera para ver la navegación real ejecutada.

## Escenario 2 — Contra el entorno Docker de pruebas

```bash
node scripts/deploy-test.mjs          # espera a "Aplicación lista"
E2E_BASE_URL=http://localhost:3100 npm --prefix development run test:e2e -- navigation
```

**Resultado esperado**: idéntico al Escenario 1, ejecutado contra el puerto 3100 (el `webServer` interno no arranca al definir `E2E_BASE_URL`).

## Escenario 3 — Detecta una página rota

1. Introducir una rotura temporal (p. ej. provocar un error en `development/src/app/search/page.tsx`).
2. Ejecutar la batería.

**Resultado esperado**: el test de `/search` falla con diagnóstico claro (status/locator esperado); el resto de tests continúa; resumen con `1 failed`; exit code 1; screenshot y trace disponibles en `development/test-results/`. Revertir la rotura después.

## Escenario 4 — Rutas protegidas sin sesión

Cubierto por los tests del grupo `rutas protegidas`: visitar `/dashboard`, `/profile` o `/messages` sin cookie de sesión debe terminar en `/auth?tab=login&callback=...`.

**Resultado esperado**: tests pasando. Si una ruta protegida se volviera accesible en anónimo, su test falla.

## Escenario 5 — Destino inalcanzable

```bash
E2E_BASE_URL=http://localhost:9999 npm --prefix development run test:e2e -- navigation
```

**Resultado esperado**: los tests fallan rápido (timeout de navegación acotado) indicando que el destino no responde; exit code 1; sin procesos de navegador residual.

## Criterio de aceptación global

Los cinco escenarios reproducen los criterios SC-001..SC-006 de la spec: ejecución en < 3 min, detección de roturas identificando la página, un único comando con veredicto inequívoco, resultados repetibles, ejecución sin conocer el stack de tests y vídeo de evidencia del 100 % de las comprobaciones.
