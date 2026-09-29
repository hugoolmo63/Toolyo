# Contrato CLI: batería de navegación

La batería es un spec de Playwright dentro de la suite E2E existente. Su contrato externo es la invocación, la configuración, la salida del reporter y los exit codes.

## Invocación

```bash
# Solo la batería de navegación
npm --prefix development run test:e2e -- navigation
# o desde development/
npx playwright test navigation

# Suite E2E completa (incluye la batería)
npm --prefix development run test:e2e
```

## Configuración

| Parámetro | Vía | Default | Descripción |
|---|---|---|---|
| URL base | env `E2E_BASE_URL` | `http://127.0.0.1:3000` (dev server auto-arrancado por `webServer`) | Instancia destino: dev server, Docker `deploy-test.mjs` (:3100), staging |
| Headless | flag `--headed` | headless | Modo con navegador visible para depuración |
| Reporter | flag `--reporter` | `list` | Salida por consola; `--reporter=html` para informe navegable |
| Reintentos | env `CI` | 0 local / 2 en CI | Ya definido en `playwright.config.ts` |

## Salida (reporter `list`)

```text
Running 18 tests using 1 worker

  ✓  navigation.spec.ts:12  › rutas públicas › GET / responde y renderiza header público (1.2s)
  ✘  navigation.spec.ts:34  › rutas públicas › GET /search renderiza resultados
       Error: expect(received).toBeLessThan(expected) — status 500
  ✓  navigation.spec.ts:58  › rutas protegidas › /dashboard redirige a /auth (0.8s)
  ...

  17 passed, 1 failed (45s)
```

- Un resultado por test, con diagnóstico de Playwright (esperado vs recibido, URL, locator) cuando falla.
- **Vídeo de evidencia por test**: `development/test-results/<test-name>/video.webm`, conservado siempre (éxito o fallo).
- En fallo se conservan además screenshot y trace en `development/test-results/` (config existente).

## Exit codes

| Código | Significado |
|---|---|
| `0` | Todos los tests pasaron |
| `1` | Algún test falló o el destino no responde |

## Grupos de tests (referencia)

| `describe` | Cobertura |
|---|---|
| `rutas públicas` | Carga directa: `/`, `/search`, `/listings/<slug>` (dinámico), `/users/<id>` (dinámico), `/auth`, `/register`, `/verify`, `/legal/<documentType>`, `/categories` |
| `navegación` | Logo → `/`, enlaces de cabecera (buscar, entrar, registro), enlaces del pie de página |
| `rutas protegidas` | `/dashboard`, `/profile`, `/messages` (y subrutas) redirigen a `/auth?tab=login&callback=...` para visitante anónimo |

La lista exacta de tests y selectores se define en la implementación; este contrato fija el formato observable, no el inventario interno.
