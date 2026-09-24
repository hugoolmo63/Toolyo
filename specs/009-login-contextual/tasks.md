# Tasks: Login contextual no intrusivo

**Input**: Design documents from `/specs/009-login-contextual/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md, quickstart.md

**Tests**: Incluidos — la constitución (`TESTING.md`) exige pirámide de testing y `quickstart.md` lista verificaciones automatizadas.

**Organization**: Tareas agrupadas por user story para implementación y testing independientes.

**Paths**: Todo el código vive en `development/` (raíz del proyecto Next.js). Rutas relativas a `development/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estructura de directorios para los nuevos artefactos

- [x] T001 Crear directorios `src/components/auth/` y `src/lib/hooks/` en `development/` (placeholders para los componentes y hooks nuevos)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida por todas las historias — hook de sesión único y provider del diálogo

**⚠️ CRITICAL**: Ninguna user story puede empezar hasta completar esta fase

- [x] T002 [P] Crear hook `useSession()` en `development/src/lib/hooks/use-session.ts`: wrapper de `api.auth.getSession.useQuery(undefined, { staleTime: 60_000, retry: false })` que expone `{ session, isLoading, isAuthenticated }` según contrato en `contracts/ui-contracts.md`
- [x] T003 Crear `AuthDialogProvider` en `development/src/providers/auth-dialog-provider.tsx`: React Context con `{ open(), close(), isOpen }`, hook `useAuthDialog()` que lanza error sin provider; renderiza `{children}` (el diálogo se conecta en T007)
- [x] T004 Montar `AuthDialogProvider` dentro de `AppProviders` en `development/src/providers/app-providers.tsx` (interior del `api.Provider`, envolviendo `{children}`)

**Checkpoint**: `useAuthDialog()` y `useSession()` disponibles en cualquier Client Component

---

## Phase 3: User Story 1 - Identificarse sin abandonar la página (Priority: P1) 🎯 MVP

**Goal**: Un usuario anónimo abre un diálogo de login desde el header, se identifica y permanece en la misma página con sesión activa

**Independent Test**: En una página pública, pulsar "Entrar" → diálogo → credenciales válidas → diálogo se cierra y la sesión queda activa sin cambio de URL ni recarga completa (escenario V1 de quickstart.md)

### Tests for User Story 1

- [x] T005 [P] [US1] Tests del diálogo en `development/tests/unit/auth/login-dialog.test.tsx`: apertura vía `open()`, cierre por Escape/backdrop/`onClose`, render del formulario y enlace a registro
- [x] T006 [P] [US1] Test de `LoginForm` modo diálogo en `development/tests/unit/auth/login-form-dialog.test.tsx`: con `variant="dialog"` llama a `onSuccess` y NO invoca `router.push`; errores se muestran inline

### Implementation for User Story 1

- [x] T007 [US1] Refactorizar `LoginForm` en `development/src/components/forms/login-form.tsx`: añadir props `variant?: "page" | "dialog"` (default `"page"`) y `onSuccess?: () => void`; en modo diálogo tras `loginWithPassword` OK → `utils.auth.getSession.invalidate()` + `router.refresh()` + `onSuccess()` sin `router.push`; modo página conserva comportamiento actual con `data.callback`
- [x] T008 [US1] Crear `LoginDialog` en `development/src/components/auth/login-dialog.tsx`: elemento `<dialog>` nativo controlado por `open` (ref + `showModal()`/`close()`), clases `.dialog-backdrop`/`.dialog` existentes, `aria-labelledby` al título, cierre por Escape (`onCancel`) y click en backdrop, contiene `LoginForm variant="dialog" onSuccess={onClose}` y enlace "Crear cuenta" → `/auth?tab=register`
- [x] T009 [US1] Conectar el diálogo en `development/src/providers/auth-dialog-provider.tsx`: renderizar `<LoginDialog open={isOpen} onClose={close}/>` junto a `{children}`
- [x] T010 [US1] Crear `UserMenu` en `development/src/components/auth/user-menu.tsx` (versión inicial): botón "Entrar" que llama `useAuthDialog().open()` + link "Crear cuenta" → `/auth?tab=register`; sustituir los links estáticos del nav en `development/src/app/(public)/layout.tsx` por `<UserMenu/>`

**Checkpoint**: Login vía diálogo funcional desde cualquier página pública — MVP entregable

---

## Phase 4: User Story 2 - Acceder a la cuenta desde cualquier página pública (Priority: P1)

**Goal**: El header refleja el estado de sesión real; el usuario identificado tiene menú con "Ir a mi panel" y "Cerrar sesión"

**Independent Test**: Identificado → el header muestra el indicador de sesión con menú desplegable funcional; anónimo → muestra "Entrar"/"Crear cuenta"; logout desde página pública mantiene al usuario en la misma página (escenario V2 de quickstart.md)

### Tests for User Story 2

- [x] T011 [P] [US2] Tests de `UserMenu` en `development/tests/unit/auth/user-menu.test.tsx`: renderiza estado anónimo vs identificado (mockeando `useSession`), menú desplegable abre/cierra, opciones "Ir a mi panel" y "Cerrar sesión" presentes
- [x] T012 [P] [US2] Test de comportamiento post-logout en página pública en `development/tests/unit/auth/logout-button.test.tsx`: tras logout se invalida la query de sesión y no se navega a `/auth` si la ruta actual es pública

### Implementation for User Story 2

- [x] T013 [US2] Completar `UserMenu` en `development/src/components/auth/user-menu.tsx`: consumir `useSession()`; estado `isLoading` → placeholder discreto; identificado → botón de identidad (nombre/iniciales) con menú desplegable (`aria-haspopup="menu"`, `aria-expanded`, cierre por Escape y click-outside) con "Ir a mi panel" → `/dashboard` y `LogoutButton`
- [x] T014 [US2] Ajustar `LogoutButton` en `development/src/components/forms/logout-button.tsx`: tras `logout` OK → `utils.auth.getSession.invalidate()` + `router.refresh()`; permanecer en la página si es pública, redirigir fuera solo si la ruta actual es privada (`/dashboard`, `/profile`) — usar `usePathname()`
- [x] T015 [P] [US2] Añadir estilos del menú desplegable en `development/src/styles/globals.css` usando tokens `--ps-*` existentes (sin colores hardcodeados, consistente con `.public-nav-*`)

**Checkpoint**: Header session-aware completo en todas las páginas públicas

---

## Phase 5: User Story 3 - Completar una acción protegida tras identificarse (Priority: P2)

**Goal**: Contactar/Reservar abren el diálogo para anónimos sin redirección; tras login el usuario conserva listing y fechas

**Independent Test**: Anónimo en `/listings/<slug>` con fechas seleccionadas → "Reservar" → diálogo → login → mismo listing con fechas intactas (escenario V3 de quickstart.md)

### Tests for User Story 3

- [x] T016 [P] [US3] Test de `ActionButtons` en `development/tests/unit/listing-detail/action-buttons.test.tsx`: sin sesión `handleContact`/`handleBook` llaman `open()` y NO navegan; con sesión navegan a `/messages`/`/checkout` como antes

### Implementation for User Story 3

- [x] T017 [US3] Refactorizar `ActionButtons` en `development/src/features/listing-detail/presentation/action-buttons.tsx`: sustituir `api.auth.getSession.useQuery` por `useSession()` y los `router.push("/auth?tab=login&callbackUrl=…")` por `useAuthDialog().open()`; eliminar `buildCallbackUrl` (obsoleto — el usuario no abandona la página); conservar la validación de rango de fechas previa al login gate
- [x] T018 [US3] Verificar que otros puntos de entrada de acciones protegidas usan el diálogo: auditar `development/src` buscando redirects a `/auth?tab=login` en Client Components y migrarlos a `useAuthDialog().open()` donde aplique

**Checkpoint**: Todas las acciones protegidas en contexto usan el diálogo y conservan estado

---

## Phase 6: User Story 4 - Acceso directo a rutas protegidas (Priority: P3)

**Goal**: Accesos directos a zona privada redirigen a `/auth` con retorno al destino; usuario ya identificado en `/auth` es redirigido

**Independent Test**: Sin sesión → `/dashboard/products` → `/auth?tab=login&callback=…` → login → llega a `/dashboard/products`; con sesión → `/auth` → redirect automático (escenario V4 de quickstart.md)

### Tests for User Story 4

- [x] T019 [P] [US4] Test de unificación del parámetro `callback` en `development/tests/unit/auth/callback-param.test.ts`: `validateCallbackPath` acepta rutas internas y rechaza `//evil.com`, backslashes y strings >512; confirmar que ningún componente emite `callbackUrl` (grep o test de `ActionButtons` ya cubierto en T016)
- [x] T020 [P] [US4] Test de redirect de `/auth` autenticado en `development/tests/unit/auth/auth-page-redirect.test.ts`: con sesión activa la página redirige a `callback` validado o `/dashboard`

### Implementation for User Story 4

- [x] T021 [US4] Añadir guard de sesión en `development/src/app/(auth)/auth/page.tsx`: si `api.auth.getSession` devuelve sesión → `redirect(validateCallbackPath(searchParams.callback) ?? "/dashboard")`; pasar `searchParams` a la página
- [x] T022 [US4] Verificar coherencia del param `callback` de extremo a extremo: middleware (`development/src/middleware.ts`, ya emite `callback`), `LoginSchema.callback` (ya existe), `login-form.tsx` modo página (lee `callback`); corregir cualquier emisor restante de `callbackUrl`

**Checkpoint**: Retorno a destino consistente en todos los puntos de entrada

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Calidad transversal y validación final

- [x] T023 [P] Ejecutar `npm run lint` y `npx tsc --noEmit` en `development/` y corregir errores
- [x] T024 [P] Ejecutar `npm run test` y `npm run test:integration` en `development/` — la suite de auth existente debe seguir verde (sin cambios de backend)
- [x] T025 Revisión de accesibilidad del diálogo y menú (focus trap, Escape, roles ARIA) contra FRONTEND.md §8 y escenario V5 de quickstart.md
- [x] T026 Ejecutar validación completa de `quickstart.md` (escenarios V1–V5) en entorno local

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de T001 — BLOQUEA todas las historias
- **US1 (Phase 3)**: depende de Phase 2
- **US2 (Phase 4)**: depende de Phase 2; evoluciona `user-menu.tsx` creado en US1 — ejecutar después de US1 o reordenar creación del componente si se paraleliza
- **US3 (Phase 5)**: depende de Phase 2 (consume `useSession` + `useAuthDialog`); funcionalmente asume el diálogo de US1 — recomendado tras US1
- **US4 (Phase 6)**: solo depende de Phase 2 en parte (redirect de `/auth` es independiente del diálogo); puede paralelizarse con US1–US3
- **Polish (Phase 7)**: tras las historias deseadas

### User Story Dependencies

- **US1 (P1)**: Phase 2 → MVP
- **US2 (P1)**: Phase 2; toca el mismo archivo `user-menu.tsx` que US1 → ejecutar tras US1
- **US3 (P2)**: Phase 2 + diálogo de US1 (las acciones abren ese diálogo)
- **US4 (P3)**: Phase 2; independiente del diálogo salvo coherencia del param `callback`

### Parallel Opportunities

- Phase 2: T002 ∥ T003 (archivos distintos); T004 tras T003
- US1: T005 ∥ T006 (tests); T007 → T008 → T009 → T010 secuencial
- US2: T011 ∥ T012 ∥ T015 (tests y estilos en archivos distintos)
- US3: T016 paralelo a nada interno (única implementación T017–T018)
- US4: T019 ∥ T020 (tests); T021 ∥ T022
- Cross-story: US4 puede correr en paralelo con US1/US2/US3 completas

## Parallel Example: User Story 1

```bash
# Tests en paralelo (archivos distintos):
Task: "Tests del diálogo en development/tests/unit/auth/login-dialog.test.tsx"
Task: "Test de LoginForm modo diálogo en development/tests/unit/auth/login-form-dialog.test.tsx"

# Implementación (secuencial — el provider renderiza el diálogo):
Task: "Refactorizar LoginForm con variant/onSuccess"
Task: "Crear LoginDialog con <dialog> nativo"
Task: "Conectar LoginDialog en AuthDialogProvider"
Task: "Crear UserMenu inicial + wiring en layout público"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (T001–T004) — fundación
2. Phase 3 US1 (T005–T010) — diálogo de login funcional
3. **STOP y VALIDAR**: escenario V1 de quickstart.md
4. Demo entregable: login sin salir de la página

### Incremental Delivery

1. Setup + Foundational → fundación lista
2. US1 → login contextual (MVP)
3. US2 → header session-aware completo (menú + logout contextual)
4. US3 → acciones protegidas sin redirección
5. US4 → hardening de deep links + fix `callback`
6. Polish → validación E2E completa

---

## Summary

- **Total**: 26 tasks
- **Por historia**: US1 → 6 (T005–T010), US2 → 5 (T011–T015), US3 → 3 (T016–T018), US4 → 4 (T019–T022)
- **Setup/Foundational/Polish**: 1 + 3 + 4
- **MVP sugerido**: T001–T010 (Phase 1–3, User Story 1)
- **Nota**: T018/T022 incluyen la corrección del bug `callbackUrl`/`callback` detectado en análisis previo

## Implementation Notes (2026-09-22)

- **Tests de componentes adaptados a lógica pura** (T005, T006, T011, T012, T016): `TESTING.md` limita unitarios a funciones puras ("no testear que React renderiza") y vitest corre en entorno `node` sin DOM. La cobertura quedó en: `tests/unit/auth/callback-param.test.ts` (LoginSchema.callback, validateCallbackPath, isPrivatePathname) y `tests/unit/auth/auth-page-redirect.test.ts` (guard de `/auth`). El comportamiento de UI se validó E2E con el smoke test real.
- **`isPrivatePathname` en `src/lib/private-paths.ts`** (no en `lib/auth.ts`): `lib/auth.ts` importa `env.mjs`, que exige `DATABASE_URL` y llama `process.exit` — importarlo desde un Client Component rompía la hidratación de toda la app (detectado en smoke test).
- **`PublicHeader` extraído** a `src/components/public-header.tsx` y añadido a la landing `/` (`SearchPage`), que no pasaba por `(public)/layout` ni tenía acceso a login — gap preexistente cubierto por FR-006.
- **Smoke E2E añadido**: `development/scripts/smoke-login-dialog.mjs` — 13/13 checks contra dev server real (V1–V4 + Escape del diálogo). Requiere `npm run dev` + DB seeded.
- **Contenido del diálogo renderizado solo cuando `open`** para que `useSearchParams` de `LoginForm` no fuerce bailout de Suspense en páginas estáticas.
- **`vitest.config.ts`**: añadido `esbuild.jsx: "automatic"` para permitir imports de módulos con JSX en tests unitarios.
- **Pendiente manual**: verificación visual de estilos del diálogo/menú y test con lector de pantalla (V5 parcialmente cubierto por smoke: Escape + foco nativo de `<dialog>`).
- **Test de integración preexistente fallido** (ajeno a la feature): `auth.router.test.ts > crea una cuenta` falla por `Resend respondió con estado 403` — problema del provider de email del entorno, no del código.
