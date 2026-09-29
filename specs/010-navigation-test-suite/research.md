# Research: Batería de tests de navegación

## Decision 1: Framework y ubicación

- **Decision**: Playwright Test (framework E2E establecido por `TESTING.md`), como nuevo spec `development/tests/e2e/navigation.spec.ts`, ejecutable vía alias `npm run test:e2e` en `development/` (o filtrando: `npx playwright test navigation`).
- **Rationale**: El usuario pidió inicialmente Puppeteer pero confirmó que prefiere continuar con la herramienta existente; `@playwright/test` ^1.63.0 ya está instalado, `playwright.config.ts` ya configura `testDir`, `baseURL`, reporter y traces, y hay specs E2E previos como referencia de estilo.
- **Alternatives considered**: script standalone con Puppeteer (petición original) — descartada por el propio usuario; ubicar el spec fuera de `tests/e2e/` — rechazada, rompería la convención del `testDir`.

## Decision 2: Inventario de rutas a cubrir

Extraído de `development/src/app/**/page.tsx` y `development/src/middleware.ts`:

- **Públicas (carga directa)**: `/`, `/search`, `/listings/[slug]` (depende de datos del seed), `/users/[id]` (depende de datos), `/auth`, `/register`, `/verify`, `/legal/[documentType]`, `/categories`.
- **Protegidas por middleware** (`/dashboard/:path*`, `/profile/:path*`, `/messages/:path*`): la batería comprueba que un anónimo es redirigido a `/auth?tab=login&callback=...`.
- **Protegidas por layout pero no por middleware** (`/categories/new`, `/moderation/reviews`): la batería comprueba acceso denegado o redirección; el comportamiento exacto se verifica en implementación (posible hallazgo a reportar).
- **Rationale**: cubre las rutas que un visitante real recorre y los límites de seguridad, sin duplicar los flujos autenticados profundos que ya cubren los specs existentes (`bookings-messaging`, `reviews`, `listing-management`).
- **Alternatives considered**: escanear el árbol de `app/` en tiempo de ejecución — rechazada: frágil (route groups, parámetros dinámicos) y poco legible; una lista explícita de tests es más mantenible y su fallo indica exactamente qué ruta se rompió.

## Decision 3: Resolución de rutas dependientes de datos

- **Decision**: Para `/listings/[slug]` y `/users/[id]`, el test descubre el destino en tiempo de ejecución: carga `/` (o `/search`) y extrae el primer `a[href^='/listings/']` / `a[href^='/users/']` del DOM, igual que hace `smoke-login-dialog.mjs`. En Playwright se agrupa en un `test.describe.serial` o un `beforeAll` que navega una vez y comparte los hrefs.
- **Rationale**: evita hardcodear slugs/ids del seed, que pueden cambiar; si no hay datos, el test falla con mensaje claro ("no se encontró enlace a listing") en lugar de un timeout oscuro.
- **Alternatives considered**: consultar la API/BD para obtener un id — rechazada: acoplaría la batería al backend y rompería la regla de solo lectura; un fixture de slug fijo — rechazada: se rompería al cambiar el seed.

## Decision 4: Configuración del destino

- **Decision**: Reusar el mecanismo de `playwright.config.ts`: `use.baseURL` toma `E2E_BASE_URL` si existe; si no, el `webServer` arranca `npm run dev` en `127.0.0.1:3000` automáticamente (reutilizando uno ya levantado fuera de CI).
- **Rationale**: sin configuración extra, `npm run test:e2e` funciona en local de forma autónoma; con `E2E_BASE_URL=http://localhost:3100` apunta al entorno Docker de `deploy-test.mjs` o a un despliegue — cubre US3 sin código adicional.
- **Alternatives considered**: flag propio `--base` — innecesario, la config ya lo resuelve; leer `.env` — no aplica, Playwright lo gestiona.

## Decision 5: Estrategia de verificación de contenido (detectar páginas de error)

- **Decision**: Cada test de ruta verifica: (a) respuesta HTTP < 400 (`page.goto` devuelve `response.status()`), (b) ancla de contenido esperado visible (locator de elemento estructural, p. ej. `.public-header`, `main`), (c) ausencia de señales de error: texto "404"/"This page could not be found"/"Application error" y el overlay de errores de Next.js.
- **Rationale**: FR-002 exige detectar páginas que responden 200 pero muestran una pantalla de error; combinar status + ancla + ausencia de señal lo cubre sin depender de copy exacto que pueda cambiar.
- **Alternatives considered**: snapshot visual completo — frágil ante cambios de contenido y fuera del alcance de una batería de navegación; solo status HTTP — insuficiente ante error boundaries de cliente.

## Decision 6: Selectores y esperas

- **Decision**: Locators sobre selectores estables ya validados en `smoke-login-dialog.mjs` (`.public-header`, `.public-nav-button`, `.user-menu-trigger`, `dialog.login-dialog`, `a[href^='/listings/']`, `a[href^='/users/']`) y auto-waiting de Playwright (`expect(locator).toBeVisible()`, `expect(page).toHaveURL()`), sin `setTimeout` ni `waitForTimeout` fijos.
- **Rationale**: TESTING.md §5.3/§9 piden selectores estables y esperas explícitas; estos selectores ya funcionan contra la UI actual. La introducción de `data-testid` en componentes queda como mejora futura, no como requisito.
- **Alternatives considered**: exigir `data-testid` antes de escribir la batería — rechazada: infla el alcance.

## Decision 7: Evidencia en vídeo

- **Decision**: Cada test de la batería graba vídeo con `test.use({ video: 'on' })` a nivel de archivo en `navigation.spec.ts`; los `.webm` quedan en `development/test-results/<test>/video.webm` tras cada ejecución.
- **Rationale**: FR-010 pide evidencia en vídeo de cada comprobación. `'on'` retiene el vídeo siempre (éxito o fallo), a diferencia del `'retain-on-failure'` que usa la config global para traces/screenshots — el usuario quiere evidencia completa, no solo de fallos. El scope por archivo evita ralentizar los specs E2E existentes.
- **Alternatives considered**: `video: 'on'` global en `playwright.config.ts` — rechazada: grabaría también los specs de reviews/bookings/messaging, duplicando su tiempo y disco sin petición de ello; `retain-on-failure` — rechazada: no genera evidencia de los checks que pasan, que es justo lo que se pide ("ver que todo funciona").

## Decision 8: Destino inalcanzable y aislamiento

- **Decision**: Cuando `E2E_BASE_URL` apunta a un destino caído, el primer `page.goto` falla con timeout de la config (30 s); el test de salud inicial (`NAV-01` sobre `/`) actúa como canario y su fallo identifica el problema. Cada test es autónomo (TESTING.md §5.4): no comparten estado ni dependen de orden.
- **Rationale**: FR-007 y edge case "destino no responde"; Playwright gestiona el ciclo de vida del browser por test, sin procesos huérfanos.
- **Alternatives considered**: un `globalSetup` con health check propio — rechazada: añade un punto único de fallo y config extra; el fallo del primer test ya comunica el problema con claridad.
