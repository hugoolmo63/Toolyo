# Data Model: Batería de tests de navegación

No hay persistencia: la batería es de solo lectura y no toca base de datos. Las entidades son conceptuales — se materializan como tests y resultados del runner de Playwright.

## NavigationCheck (Comprobación de navegación)

Una comprobación individual; se implementa como un `test()` de Playwright.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Título del test (p. ej. "GET / responde y renderiza header público") |
| `group` | enum | `rutas públicas` (carga directa), `navegación` (clic en elemento), `rutas protegidas` (redirección) |
| `target` | string | Ruta o locator objetivo de la comprobación |
| `expectation` | string | Qué se espera observar (status <400, ancla DOM visible, URL destino, ausencia de señal de error) |
| `status` | enum | `passed` / `failed` / `skipped` — gestionado por el runner |
| `video` | string | Ruta al `.webm` de evidencia en `test-results/` — siempre presente tras la ejecución (FR-010) |
| `diagnostic` | string | Error de Playwright cuando falla (URL real, status, locator no encontrado, screenshot/trace en `test-results/`) |

## RunReport (Informe de ejecución)

Resultado agregado de una pasada completa; lo produce el reporter de Playwright.

| Campo | Tipo | Descripción |
|---|---|---|
| `baseUrl` | string | URL base resuelta (`E2E_BASE_URL` o dev server auto-arrancado) |
| `checks` | NavigationCheck[] | Resultados por test, en orden de ejecución |
| `passed` / `failed` | number | Resumen `N passed, M failed` del reporter |
| `verdict` | enum | `ok` si `failed === 0`; determina el exit code (0/1) |

## Reglas de validación (de los FRs)

- Todo test de `rutas públicas` DEBE verificar: status < 400 **y** ancla de contenido visible **y** ausencia de señales de error ("404", "This page could not be found", error boundary) (FR-002).
- Todo test de `rutas protegidas` DEBE observar URL final bajo `/auth` con `callback` apuntando al destino original (FR-004).
- Cada test DEBE ser autónomo: sin estado compartido ni dependencias de orden, salvo el descubrimiento de hrefs dinámicos, que se resuelve una vez en setup del describe (TESTING.md §5.4).
- La batería MUST no crear ni mutar datos: ningún test envía formularios ni ejecuta acciones de escritura (FR-008).
- Esperas explícitas únicamente: auto-waiting de locators y assertions de Playwright; prohibidos `waitForTimeout` fijos (TESTING.md §9).

## Relaciones

- `RunReport` 1—N `NavigationCheck`.
- Las comprobaciones dependientes de datos (`/listings/[slug]`, `/users/[id]`) resuelven su `target` dinámicamente a partir del DOM de `/` o `/search` (ver research.md, Decision 3).
