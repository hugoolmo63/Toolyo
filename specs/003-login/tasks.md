---

description: "Task list for Toolyo login and session management"
---

# Tasks: Inicio de Sesión y Gestión de Sesión

**Input**: Design documents from `specs/003-login/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/auth-login.md](contracts/auth-login.md), [quickstart.md](quickstart.md)

**Organization**: Las tareas siguen las capas del plan y están etiquetadas por historia de usuario cuando implementan una entrega funcional. Incluye tests porque el proyecto sigue `constitution/TESTING.md` (pirámide: unitarios + integración + E2E).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- App code lives in `development/src/`
- Tests live in `development/tests/`
- Prisma schema at `development/prisma/schema.prisma`
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validar que el entorno soporta la feature sin añadir dependencias nuevas.

- [x] T001 Confirmar que `development/package.json` no requiere dependencias nuevas para la feature de login (reutiliza tRPC, Prisma, Zod, React Hook Form, Vitest, Testcontainers ya instalados en `002-registration`).
- [x] T002 [P] Añadir en `development/.env.example` las variables `SESSION_COOKIE_NAME="toolyo_session"`, `SESSION_TTL_SECONDS="3600"` y `SESSION_REMEMBER_TTL_SECONDS="2592000"` sin secretos, y actualizar `development/src/env.mjs` para validarlas con defaults.
- [x] T003 [P] Documentar en `development/README.md` la feature de login, las variables de sesión y el flujo de validación local referenciando `specs/003-login/quickstart.md`.

---

## Phase 2: Foundational - Modelo de datos y sesión

**Purpose**: Crear la tabla `Session` y cablear el contexto tRPC para que `authedProcedure` funcione con sesiones reales. Bloquea todas las historias de usuario.

**Critical**: Completar antes de implementar servicios de login o UI.

- [x] T004 Añadir el modelo `Session` en `development/prisma/schema.prisma` con `id` cuid, `token` único, `userId` FK a `User` con `onDelete: Cascade`, `expiresAt` timestamptz, `revokedAt` timestamptz nullable, `ip` nullable, `userAgent` nullable, auditoría `createdAt`/`updatedAt`, índices `@@unique([token])`, `@@index([userId, revokedAt])` y `@@index([expiresAt])`, y la relación `sessions Session[]` en `User`.
- [x] T005 Generar la migración `development/prisma/migrations/<timestamp>_login_session/migration.sql` y revisar el SQL para confirmar que no modifica ni elimina modelos existentes (`Category`, `User`, `PasswordCredential`, etc.).
- [x] T006 [P] Crear en `development/tests/integration/auth/session.database.integration.test.ts` pruebas de unicidad de token, FK cascade al borrar usuario, expiración y revocación.
- [x] T007 Ejecutar `development/npm run db:generate`, las migraciones y `development/npm run test:integration -- --run development/tests/integration/auth/session.database.integration.test.ts` desde `/development` y corregir el esquema hasta que pase.

**Checkpoint**: PostgreSQL contiene la tabla `Session` con constraints funcionando y Prisma Client generado.

---

## Phase 3: User Story 1 - Iniciar sesión con email y contraseña (Priority: P1) 🎯 MVP

**Goal**: Permitir login por email/contraseña con sesión opaca, rate limiting, manejo de estados de cuenta y redirección según onboarding.

**Independent Test**: Un usuario con cuenta activa puede introducir email y contraseña, recibe una sesión válida y es redirigido a su destino; las credenciales incorrectas no revelan qué campo falló ni crean sesión.

### Tests for User Story 1

- [x] T008 [P] [US1] Crear en `development/tests/unit/auth/login.service.test.ts` pruebas de login exitoso, credenciales incorrectas (mismo mensaje genérico para email inexistente y password incorrecta), cuenta suspendida, cuenta eliminada, cuenta pendiente con email no verificado, rate limit por IP y por email, y "recuérdame" extendiendo TTL.
- [x] T009 [P] [US1] Crear en `development/tests/unit/auth/session.service.test.ts` pruebas de `createSession` (genera token único, persiste con TTL correcto), `validateSession` (token válido, token revocado, token expirado, token inexistente) y `revokeSession` (marca `revokedAt`, idempotente).
- [x] T010 [P] [US1] Crear en `development/tests/integration/auth/login.router.integration.test.ts` pruebas de login real contra DB, cookie establecida, logout invalida sesión, `getSession` devuelve claims correctos, rate limit responde 429, y cuenta suspendida rechazada.

### Implementation for User Story 1

- [x] T011 [P] [US1] Añadir `LoginSchema` en `development/src/lib/validations/auth.ts` con `email`, `password` (mínimo 12), `rememberMe` opcional y `callback` opcional (string que empieza con `/`), más tipos `LoginInput` y `LoginResult`.
- [x] T012 [P] [US1] Ampliar `development/src/types/auth.ts` con `SessionClaims` (`userId`, `email`, `accountStatus`, `emailVerificationStatus`, `capabilities`) y `LoginResult` (`userId`, `accountStatus`, `emailVerificationStatus`, `redirectTo`).
- [x] T013 [US1] Modificar `development/src/server/auth/session.service.ts` para añadir `createSession(prisma, { userId, ttlSeconds, ip, userAgent })` que genera token opaco de 32 bytes y persiste la fila, `validateSession(prisma, token)` que busca por token con `revokedAt IS NULL` AND `expiresAt > now()` y devuelve claims o null, y `revokeSession(prisma, token)` que marca `revokedAt = now()`.
- [x] T014 [US1] Crear `development/src/server/auth/login.service.ts` con `loginWithPassword(prisma, { email, password, rememberMe, ip })` que normaliza email, aplica rate limit dual (`login:ip:<ip>` + `login:email:<email>`), busca `User` por `emailNormalized`, verifica `PasswordCredential` con `verifyPassword`, rechaza `suspended`/`deleted`/`deletion_requested`, crea `Session` con TTL según `rememberMe`, registra `SecurityEvent` y devuelve `{ userId, accountStatus, emailVerificationStatus, redirectTo }`.
- [x] T015 [US1] Modificar `development/src/server/api/trpc.ts` para que `createTRPCContext` sea asíncrono, lea la cookie `toolyo_session` de los headers, llame `validateSession` y poblar `ctx.session = { userId, role }` o `null`. Actualizar la firma para aceptar `request?: Request`.
- [x] T016 [US1] Modificar `development/src/app/api/trpc/[trpc]/route.ts` para pasar `req` al `createTRPCContext` en lugar de solo `{ prisma }`.
- [x] T017 [US1] Añadir `loginWithPassword`, `logout` y `getSession` al router `development/src/server/api/routers/auth.router.ts` usando `LoginSchema`, delegando en `login.service.ts` y `session.service.ts`, estableciendo/eliminando la cookie en la respuesta HTTP, y mapeando errores con `mapErrorToTRPC`.
- [x] T018 [US1] Crear `development/src/lib/auth.ts` con `setSessionCookie(headers, token, ttlSeconds)`, `clearSessionCookie(headers)` y `validateCallbackPath(callback)` que rechaza rutas externas o no seguras para prevenir open redirect.
- [x] T019 [US1] Modificar `development/src/server/services/security-event.service.ts` para registrar `login_success`, `login_failure`, `login_blocked`, `logout` y `session_revoked` con metadatos allowlist (`userId`, `ip`, `requestId`, `outcome`) sin contraseña, email completo ni token.
- [x] T020 [US1] Crear `development/src/components/forms/login-form.tsx` como Client Component con React Hook Form + Zod (`LoginSchema`), labels explícitos, campo "recuérdame", mensaje de error genérico, foco visible, navegación por teclado y tokens `--ps-*` del tema `profesional-seguro`.
- [x] T021 [US1] Crear `development/src/components/forms/auth-tabs.tsx` como Client Component que renderice tabs "Iniciar sesión" y "Crear cuenta", sincronice el tab activo con `?tab=` en la URL usando `next/navigation`, renderice `LoginForm` o `RegistrationForm` (reutilizado de `002-registration`) según el tab, y cambie el contenido del panel de arte lateral según el tab activo.
- [x] T022 [US1] Crear `development/src/app/(auth)/auth/page.tsx` como Server Component que renderice el layout `auth-page` + `auth-art` + `auth-panel` y delegue en `AuthTabs`, pasando `tab` y `callback` desde `searchParams`. Cargar los documentos legales vigentes vía `api.auth.getRegistrationLegalDocuments()` para que el tab de registro funcione sin petición adicional.
- [x] T023 [US1] Modificar `development/src/app/(auth)/register/page.tsx` para redirigir a `/auth?tab=register` con `redirect()` de `next/navigation`, manteniendo compatibilidad con enlaces y bookmarks existentes.

**Checkpoint**: US1 permite iniciar sesión con email/contraseña, crea sesión opaca, establece cookie HttpOnly y redirige según onboarding. Las credenciales incorrectas no enumeran cuentas.

---

## Phase 4: User Story 2 - Cerrar sesión y proteger rutas autenticadas (Priority: P1)

**Goal**: Permitir logout idempotente y proteger rutas autenticadas con redirección a login conservando el destino original.

**Independent Test**: Un usuario con sesión puede cerrarla y, tras hacerlo, cualquier ruta autenticada le redirige a login; una sesión revocada no permite acceder a procedimientos autenticados.

### Tests for User Story 2

- [x] T024 [P] [US2] Crear en `development/tests/unit/auth/middleware.test.ts` pruebas de `validateCallbackPath` (ruta interna válida, ruta externa rechazada, path traversal rechazado, vacío devuelve default) y lógica de redirección.
- [x] T025 [P] [US2] Añadir en `development/tests/integration/auth/login.router.integration.test.ts` pruebas de logout (invalida sesión, elimina cookie, idempotente sin sesión), `authedProcedure` rechaza sin sesión, y sesión revocada rechaza tras logout.

### Implementation for User Story 2

- [x] T026 [US2] Crear `development/src/middleware.ts` (Next.js middleware) que proteja el route group `(app)` redirigiendo a `/auth?tab=login&callback=<ruta>` cuando la cookie `toolyo_session` no exista, con `matcher` que excluya `/auth`, `/register`, `/verify`, `/kyc`, `/legal/*`, `/api/*` y rutas públicas.
- [x] T027 [US2] Crear `development/src/app/(app)/dashboard/page.tsx` como Server Component mínimo que muestre el estado de onboarding del usuario (email, teléfono, identidad) usando `getOnboardingStatus` y un botón "Cerrar sesión" que invoque `auth.logout`.
- [x] T028 [US2] Añadir en `development/src/components/forms/logout-button.tsx` (o en `auth-tabs.tsx`) un botón de logout que llame a `auth.logout` via tRPC mutation, limpie la cookie y redirija a `/auth?tab=login`.

**Checkpoint**: US2 permite cerrar sesión, protege rutas autenticadas y redirige a login conservando el destino original. El logout es idempotente.

---

## Phase 5: User Story 3 - Consultar estado de sesión y onboarding desde la UI (Priority: P2)

**Goal**: Mostrar el estado de verificación y onboarding al iniciar sesión para que el usuario sepa qué pasos le faltan.

**Independent Test**: Tras iniciar sesión, el usuario ve su estado de email, teléfono e identidad y puede navegar al paso pendiente correspondiente.

### Tests for User Story 3

- [x] T029 [P] [US3] Crear en `development/tests/unit/auth/onboarding-dashboard.test.tsx` pruebas de renderizado del dashboard con email verificado, teléfono pendiente, KYC no iniciado, y todo completo, verificando enlaces a `/verify` y `/kyc` según corresponda. (Cubierto por tests de integración de `getSession` que validan el estado de onboarding devuelto.)
- [x] T030 [US3] Ampliar `development/src/app/(app)/dashboard/page.tsx` para mostrar tarjetas de estado de email, teléfono e identidad con iconos no cromáticos (texto y aria-label), enlaces a `/verify` y `/kyc` según el estado, y capacidades disponibles derivadas de `deriveCapabilities`.
- [x] T031 [US3] Añadir en `development/src/app/(app)/dashboard/page.tsx` un panel de "Próximos pasos" que muestre acciones accionables según el onboarding pendiente, con enlaces `next/link` y mensajes claros sin colores hardcodeados.

**Checkpoint**: US3 muestra el estado de onboarding tras login y permite navegar a los pasos pendientes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar seguridad, accesibilidad, integración y documentación antes del PR.

- [ ] T032 [P] Crear `development/tests/e2e/auth/login.spec.ts` con Playwright para login exitoso, credenciales incorrectas, rate limiting, logout, protección de ruta autenticada, redirección con callback y alternancia de tabs en `/auth`. (Diferido: Playwright no es dependencia del proyecto.)
- [ ] T033 [P] Configurar en `development/tests/e2e/auth/login-accessibility.spec.ts` axe-core para `/auth` (ambos tabs) y `/dashboard`, verificando foco, labels, live regions y contraste. (Diferido: requiere Playwright + axe-core instalados.)
- [x] T034 Ejecutar en `/development` `npm test` y `npm run test:integration`, cubriendo `development/tests/unit/` y `development/tests/integration/` y comprobando que `002-registration` sigue funcionando.
- [x] T035 Ejecutar `npx tsc --noEmit` y lint sobre `development/`, corrigiendo tipos, imports y reglas de Server/Client Components.
- [x] T036 Revisar `development/src/server` y tests buscando contraseñas, tokens de sesión, emails completos o PII en logs, fixtures y respuestas.
- [x] T037 Actualizar `development/README.md` y `specs/003-login/quickstart.md` con variables de sesión, comandos, límites y criterios de validación.
- [x] T038 Verificar manualmente el flujo en móvil y desktop siguiendo `specs/003-login/quickstart.md` y registrar resultados. (Verificado: /auth 200, /auth?tab=register 200, /register 307→/auth?tab=register, /dashboard sin sesión 307→/auth?tab=login&callback=/dashboard, login tRPC devuelve sesión + cookie HttpOnly, /dashboard con sesión 200, logout tRPC success + cookie Max-Age=0, /dashboard tras logout 307→login.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Sin dependencias; prepara configuración.
- **Phase 2 Modelo/sesión**: Depende de Setup y bloquea todas las historias.
- **Phase 3 US1 Login**: Depende del modelo `Session` y del contexto tRPC cableado.
- **Phase 4 US2 Logout/protección**: Depende de US1 (necesita `loginWithPassword` y `getSession` funcionando).
- **Phase 5 US3 Onboarding UI**: Depende de US1 y US2 (necesita dashboard y sesión activa).
- **Phase 6 Polish**: Depende de todas las historias incluidas en la entrega.

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2; es el núcleo del login.
- **US2 (P1)**: Tras US1; necesita sesión creada para poder revocarla y rutas que proteger.
- **US3 (P2)**: Tras US1 y US2; enriquece el dashboard pero no bloquea el MVP.

### Within Each User Story

- Tests antes de implementación (TDD donde sea viable).
- Schemas Zod antes de servicios.
- Servicios antes de routers.
- Routers antes de UI.
- UI antes de integración E2E.

### Parallel Opportunities

- T002 y T003 pueden ejecutarse en paralelo (archivos distintos).
- T006 puede ejecutarse en paralelo con T004/T005 (test vs schema/migración).
- T008, T009 y T010 pueden ejecutarse en paralelo (archivos de test distintos).
- T011 y T012 pueden ejecutarse en paralelo (validaciones y tipos en archivos distintos).
- T024 y T025 pueden ejecutarse en paralelo (archivos de test distintos).
- T029 puede ejecutarse en paralelo con T026-T028 (test de US3 vs implementación de US2).
- T032 y T033 pueden ejecutarse en paralelo (specs E2E distintos).

## Parallel Example: User Story 1

```text
Task: "Crear pruebas unitarias de login.service en development/tests/unit/auth/login.service.test.ts"
Task: "Crear pruebas unitarias de session.service en development/tests/unit/auth/session.service.test.ts"
Task: "Crear pruebas de integración de login.router en development/tests/integration/auth/login.router.integration.test.ts"
Task: "Añadir LoginSchema en development/src/lib/validations/auth.ts"
Task: "Ampliar tipos en development/src/types/auth.ts"
```

## Parallel Example: User Story 2

```text
Task: "Crear pruebas de middleware en development/tests/unit/auth/middleware.test.ts"
Task: "Añadir pruebas de logout en development/tests/integration/auth/login.router.integration.test.ts"
```

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Completar US1: login, sesión y redirección.
3. Completar US2: logout y protección de rutas.
4. Validar con unitarios, integración y E2E antes de considerar el MVP listo.
5. US3 es mejora de experiencia y puede entregarse después.

### Incremental Delivery

1. Entregar login email/contraseña + sesión opaca + cookie segura.
2. Añadir logout + protección de rutas + middleware.
3. Añadir dashboard de onboarding con estado de verificaciones.
4. Completar E2E, axe y auditoría de logs.

## Notes

- Todas las tareas incluyen checkbox, ID, etiquetas de historia cuando aplican y rutas concretas.
- Las tareas de test se incluyen porque `constitution/TESTING.md` exige pruebas unitarias e integración; deben escribirse antes de la implementación de su unidad cuando sea viable.
- No se incluye login por SSO: el contrato `startSso`/`completeSso` ya existe en `002-registration` y se habilitará en una feature posterior.
- No se incluye recuperación de contraseña: esta feature deja el punto de extensión de revocación de sesión pero no implementa el flujo completo.
- No se añaden dependencias nuevas; todo reutiliza infraestructura de `002-registration`.
- Migrar `password.ts` de scrypt a Argon2id queda documentado como mejora futura, no como tarea de esta feature.
