---

description: "Task list for feature implementation"
---

# Tasks: Batería de tests de navegación

**Input**: Design documents from `/specs/010-navigation-test-suite/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/cli.md

**Tests**: Esta feature ES una suite de tests; las tareas de implementación escriben directamente los casos de Playwright. No hay tareas de "tests del test" adicionales.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Spec E2E: `development/tests/e2e/navigation.spec.ts` (único archivo nuevo)
- Config existente: `development/playwright.config.ts` (no requiere cambios)
- Alias de ejecución: `development/package.json` → scripts

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dejar listo el runner y el archivo de spec donde vivirán todas las comprobaciones

- [X] T001 [P] Añadir script `"test:e2e": "playwright test"` a `development/package.json` (sección `scripts`, junto a `test`/`test:integration`)
- [X] T002 [P] Verificar que los browsers de Playwright están instalados ejecutando `npx playwright install chromium` desde `development/` (no-op si ya lo están)
- [X] T003 Crear el esqueleto de `development/tests/e2e/navigation.spec.ts`: imports de `@playwright/test`, `test.use({ video: "on" })` a nivel de archivo (evidencia en vídeo siempre, FR-010) y los tres `test.describe` vacíos: `rutas públicas`, `navegación`, `rutas protegidas`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Helpers compartidos que MUST existir antes de escribir cualquier check (Decision 5 y 3 de research.md)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implementar helper `expectNoErrorSignals(page)` en `development/tests/e2e/navigation.spec.ts`: assertion de ausencia de "404", "This page could not be found", "Application error" y del overlay de errores de Next.js en el DOM (FR-002)
- [X] T005 Implementar helper `checkPublicRoute(page, path, anchor)` en `development/tests/e2e/navigation.spec.ts`: `page.goto` capturando `response.status()` < 400, locator del ancla visible y `expectNoErrorSignals` (FR-001, FR-002)
- [X] T006 Implementar helper `discoverHref(page, linkPrefix)` en `development/tests/e2e/navigation.spec.ts`: navega a `/` (o `/search`) y devuelve el `href` del primer `a[href^='<prefix>']` del DOM, o `null` para reportar fallo claro cuando falten datos del seed (research.md Decision 3)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Verificar que todas las páginas cargan (Priority: P1) 🎯 MVP

**Goal**: La batería visita todas las rutas públicas y verifica que responden y renderizan el contenido esperado

**Independent Test**: `npm --prefix development run test:e2e -- navigation -g "rutas públicas"` con la app levantada (o sin ella, el `webServer` la arranca): todos los tests del describe `rutas públicas` pasan y hay `video.webm` por test en `development/test-results/`

### Implementation for User Story 1

- [X] T007 [US1] Añadir tests de carga directa para rutas estáticas públicas en `development/tests/e2e/navigation.spec.ts` (describe `rutas públicas`, usando `checkPublicRoute` de T005): `/` (ancla `.public-header`), `/search` (ancla contenedor principal de resultados), `/auth` (ancla formulario de acceso), `/register` (ancla formulario de registro), `/verify` (ancla página de verificación), `/categories` (ancla listado de categorías)
- [X] T008 [US1] Añadir tests de documentos legales en `development/tests/e2e/navigation.spec.ts`: `/legal/terms` y `/legal/privacy` renderizan `main.legal-page` con su título; `/legal/inexistente` muestra la página de "no encontrado" (comportamiento esperado de `notFound()`)
- [X] T009 [US1] Añadir test de detalle de anuncio en `development/tests/e2e/navigation.spec.ts`: resolver slug con `discoverHref(page, "/listings/")` (T006), navegar a la URL resultante y verificar status < 400 + contenido del detalle + `expectNoErrorSignals`; si `discoverHref` devuelve `null`, el test falla con mensaje "no se encontró enlace a listing — ¿falta seed?"
- [X] T010 [US1] Añadir test de perfil público de usuario en `development/tests/e2e/navigation.spec.ts`: resolver id con `discoverHref(page, "/users/")` (T006) y verificar igualmente status < 400 + contenido + sin señales de error
- [X] T011 [US1] Ejecutar `npm --prefix development run test:e2e -- navigation -g "rutas públicas"` y confirmar: todos los tests pasan, la salida identifica cada test por nombre y existe un `video.webm` por test en `development/test-results/` (FR-001, FR-002, FR-005, FR-010, SC-001, SC-006)

**Checkpoint**: US1 completa — la batería ya verifica que todas las páginas públicas cargan

---

## Phase 4: User Story 2 - Verificar la navegación entre páginas (Priority: P2)

**Goal**: Los elementos de navegación principales llevan a su destino y las rutas protegidas redirigen a `/auth` a visitantes anónimos

**Independent Test**: `npm --prefix development run test:e2e -- navigation -g "navegación|rutas protegidas"`: los tests de enlaces y redirecciones pasan

### Implementation for User Story 2

- [X] T012 [US2] Añadir test de logo en `development/tests/e2e/navigation.spec.ts` (describe `navegación`): desde `/search` (u otra página pública), clic en `a.public-logo` → `expect(page).toHaveURL("/")` (FR-003)
- [X] T013 [US2] Añadir test de acceso desde la cabecera en `development/tests/e2e/navigation.spec.ts`: en `/` como anónimo, clic en `.public-nav-button` ("Entrar") abre `dialog.login-dialog[open]` sin cambiar de URL (comportamiento actual de login contextual — spec 009); si en el futuro el header enlaza a `/auth`, actualizar la expectativa
- [X] T014 [US2] Añadir test de enlace a registro en `development/tests/e2e/navigation.spec.ts`: desde el diálogo de login o `/auth`, el enlace de registro navega a `/register`; y desde `/legal/terms` el enlace "← Volver al registro" (`a[href='/register']`) vuelve a `/register`
- [X] T015 [US2] Añadir test de navegación búsqueda → detalle en `development/tests/e2e/navigation.spec.ts`: desde `/` o `/search`, clic en el primer `a[href^='/listings/']` → URL bajo `/listings/` + detalle renderizado sin señales de error (FR-003)
- [X] T016 [US2] Añadir tests de rutas protegidas en `development/tests/e2e/navigation.spec.ts` (describe `rutas protegidas`, contexto anónimo sin cookies): `page.goto` a `/dashboard`, `/dashboard/products`, `/profile`, `/messages` → `expect(page).toHaveURL(/\/auth\?.*tab=login/)` y `callback` apuntando al destino original, según el matcher de `development/src/middleware.ts` (FR-004)
- [X] T017 [US2] Añadir tests de rutas protegidas solo por layout en `development/tests/e2e/navigation.spec.ts`: `/categories/new` y `/moderation/reviews` como anónimo — verificar que redirigen o deniegan acceso; si resultan accesibles, reportarlo como hallazgo (no silenciarlo — research.md Decision 2)

**Checkpoint**: US2 completa — navegación y límites de sesión verificados

---

## Phase 5: User Story 3 - Ejecutar la batería contra distintos entornos (Priority: P3)

**Goal**: La misma batería funciona contra dev server auto-arrancado, entorno Docker o despliegue, sin cambios de código

**Independent Test**: `E2E_BASE_URL=http://localhost:3100 npm --prefix development run test:e2e -- navigation` contra el entorno de `scripts/deploy-test.mjs` produce el mismo resultado que en local

### Implementation for User Story 3

- [X] T018 [US3] Verificar que `playwright.config.ts` ya resuelve `baseURL` desde `E2E_BASE_URL` y que el spec no hardcodea URLs absolutas — todos los `page.goto` usan rutas relativas (`/`, `/search`, …) o URLs derivadas de la página (FR-006)
- [X] T019 [US3] Validar el escenario contra el entorno Docker: levantar `node scripts/deploy-test.mjs` y ejecutar `E2E_BASE_URL=http://localhost:3100 npm --prefix development run test:e2e -- navigation` — todos los tests pasan igual que en local (FR-006)
- [X] T020 [US3] Validar destino inalcanzable: `E2E_BASE_URL=http://localhost:9999 npm --prefix development run test:e2e -- navigation` falla rápido con error de navegación claro y sin procesos residuales (FR-007); si el primer test tarda demasiado, añadir un test canario de salud sobre `/` al inicio del describe `rutas públicas`

**Checkpoint**: Las tres user stories son funcionalmente independientes y la batería es portable entre entornos

---

## Phase 5b: User Story 4 - Journeys completos de usuario (Priority: P2)

**Goal**: La batería recorre flujos reales autenticados de punta a punta: identificarse, publicar, buscar, contactar, reservar y consultar reservas/mensajes

**Independent Test**: `npm --prefix development run test:e2e -- navigation -g "flujos de usuario"` con la app levantada y seed aplicado: cada journey termina en su estado final esperado y hay vídeo por test

### Implementation for User Story 4

- [X] T026 [US4] Añadir helper `loginViaDialog(page)` en `development/tests/e2e/navigation.spec.ts`: desde `/` anónimo, `.public-nav-button` → `dialog.login-dialog[open]` → rellenar `#login-email`/`#login-password` con `test@test.com`/`passwordpassword123` → `.auth-submit` → esperar `.user-menu-trigger`
- [X] T027 [US4] Añadir journey login → panel → logout en `development/tests/e2e/navigation.spec.ts` (describe `flujos de usuario`): tras login, abrir `.user-menu-trigger` → "Ir a mi panel" → `/dashboard` con `.client-dashboard-shell` → volver y cerrar sesión → header anónimo
- [X] T028 [US4] Añadir journey publicar → verificar → retirar en `development/tests/e2e/navigation.spec.ts`: login → `/dashboard/products/new` → rellenar `input[name=title]` (prefijo `E2E`), `textarea[name=description]`, `select[name=categoryId]`, `input[name=pricePerDay]`, `input[name=city]`, `input[name=addressText]`, foto URL → "Publicar al crear" → aterriza en `/dashboard/products/<id>` con `.listing-detail-private` → "Retirar producto" → "Confirmar retirada" → vuelve a `/dashboard/products`
- [X] T029 [US4] Añadir journey buscar → contactar → mensaje en `development/tests/e2e/navigation.spec.ts`: login → `/` → clic en `a[href^='/listings/']` → `.action-btn-contact` → redirige a `/messages?listing=<slug>` → aterriza en `/messages/<conversationId>` → escribir en `.chat-input` → `.chat-send` → el mensaje aparece en `.chat-bubble.is-mine`
- [X] T030 [US4] Añadir journey reservar → solicitud → chat contextual en `development/tests/e2e/navigation.spec.ts`: login → anuncio ajeno con `?start=2031-07-01&end=2031-07-04` → `.action-btn-book` → diálogo `.booking-dialog-listing` visible → `[data-testid=booking-request-submit]` → URL `/messages/<id>?booking=<id>` con `.chat-thread` y `.booking-context-banner`
- [X] T031 [US4] Añadir journey arrendador consulta reserva pendiente en `development/tests/e2e/navigation.spec.ts`: login como `test@test.com` (owner de `seed-booking-1`) → `/dashboard/bookings` → `.booking-status-badge` pending visible → seguir enlace a `/messages/<conv>?booking=<id>` → `.booking-context-banner` visible. Nota: no existe UI de aceptar/rechazar (solo mutación `booking.accept`) — documentado como hallazgo en la spec

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación integral y documentación

- [X] T021 Ejecutar la batería completa `npm --prefix development run test:e2e -- navigation` midiendo duración total < 3 min (SC-001); si se excede, revisar esperas y paralelizar describes compatibles
- [X] T022 [P] Ejecutar el Escenario 3 de quickstart.md (rotura temporal en una página) y confirmar que el test correspondiente falla identificando la página y conserva vídeo + trace (SC-002)
- [X] T023 [P] Documentar la batería en `development/README.md` o `docs/`: comando de ejecución, `E2E_BASE_URL`, ubicación de vídeos en `test-results/` (SC-005)
- [X] T024 Ejecutar la suite E2E completa `npm --prefix development run test:e2e` para confirmar que el nuevo spec no interfiere con los existentes (`reviews*`, `bookings-messaging`, `listing-management`) (FR-009)
- [X] T025 Validar determinismo: dos ejecuciones consecutivas contra el mismo entorno producen el mismo resultado (SC-004) — revisar que no haya `waitForTimeout` fijos ni dependencias de orden entre tests (TESTING.md §9, §5.4)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — T001, T002 y T003 pueden empezar ya
- **Foundational (Phase 2)**: Depende de T003 (los helpers viven en el spec) — BLOQUEA todas las stories
- **User Stories (Phase 3+)**: Todas dependen de Phase 2
  - US1 (P1) → US2 (P2) → US3 (P3) en orden de prioridad; US2 y US3 podrían solaparse pero conviene el orden por simplicidad del archivo único
- **Polish (Phase 6)**: Depende de todas las stories

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2 — sin dependencias de otras stories
- **US2 (P2)**: Tras Phase 2 — reutiliza `expectNoErrorSignals`/`discoverHref`; independiente de US1 conceptualmente pero comparte el mismo archivo
- **US3 (P3)**: Tras Phase 2 — config/validación, no añade checks nuevos

### Parallel Opportunities

- T001, T002 y T003 son paralelizables (archivos distintos)
- T022 y T023 son paralelizables entre sí
- Dentro de cada story las tareas son secuenciales: todas escriben en `development/tests/e2e/navigation.spec.ts` (el [P] queda intencionadamente ausente para evitar conflictos de edición)

---

## Parallel Example: Setup

```bash
# Estas tres tareas tocan archivos/recursos distintos:
Task: "Añadir script test:e2e a development/package.json"
Task: "npx playwright install chromium en development/"
Task: "Crear esqueleto de development/tests/e2e/navigation.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001-T003)
2. Phase 2: Helpers (T004-T006)
3. Phase 3: US1 — rutas públicas (T007-T011)
4. **STOP y VALIDAR**: la batería ya detecta páginas rotas con evidencia en vídeo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → batería de carga de páginas funcional (MVP)
3. US2 → navegación y protección de rutas verificadas
4. US3 → portabilidad entre entornos validada
5. Polish → suite completa integrada y documentada

---

## Notes

- Todas las tareas de stories escriben en `development/tests/e2e/navigation.spec.ts` — secuenciales a propósito
- Selectores de referencia ya validados en `development/scripts/smoke-login-dialog.mjs`: `.public-header`, `.public-logo`, `.public-nav-button`, `dialog.login-dialog`, `a[href^='/listings/']`
- No existe footer público en la app actual — los checks de enlaces cubren cabecera, enlaces in-content y el enlace "Volver al registro" de páginas legales
- Cada test deja `video.webm` en `development/test-results/` (evidencia siempre, FR-010)
