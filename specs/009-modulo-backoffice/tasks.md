---
description: "Task list for Módulo Administrativo (Backoffice)"
---

# Tasks: Módulo Administrativo (Backoffice)

**Input**: Design documents from `/specs/009-modulo-backoffice/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/admin-router.md`, `quickstart.md`

**Scope**: MVP de ADMIN-001 (2FA), ADMIN-002 (usuarios), ADMIN-003 (KYC), ADMIN-005 (moderación de reviews integrada con Módulo 006) y US4 (Auditoría y Trazabilidad Inmutable). Listings, disputas, analytics, categorías y CMS/FAQ permanecen fuera del MVP.

**Organization**: Cinco fases ejecutables. Las historias US1–US4 son incrementos verificables; US4 es Auditoría y Trazabilidad Inmutable y cubre la auditoría transversal del MVP.

**Tests**: Incluidos porque fueron solicitados explícitamente. Los tests de cada historia deben escribirse antes de la implementación y comprobar el criterio independiente indicado.

## Phase 1: Setup + Foundation (Shared Infrastructure)

**Purpose**: Preparar dependencias, schema, errores, contexto tRPC y estructura compartida. Esta fase bloquea las historias.

- [X] T001 [P] Añadir `otplib` y `qrcode` a `development/package.json` y actualizar `development/package-lock.json`, verificando versiones compatibles con Node/TypeScript del proyecto
- [X] T002 [P] Crear la estructura de dominio administrativo en `development/src/features/admin/{application,domain,infrastructure,presentation,shared}/` y los directorios de pruebas `development/tests/{unit,integration,e2e}/admin/`
- [X] T003 [P] Crear los schemas Zod compartidos para paginación, roles, TOTP, KYC, moderación y auditoría en `development/src/features/admin/shared/admin.schema.ts`
- [X] T004 Actualizar primero `development/prisma/schema.prisma` con `ADMIN`/`MODERATOR`, `TotpCredential`, los campos/relationes KYC y `AdminAuditLog`, incluyendo índices, `onDelete: Restrict`, relación inversa `kycReviews` y comentarios de campos sensibles
- [X] T005 Generar la migración Prisma desde `development/prisma/schema.prisma` en `development/prisma/migrations/<timestamp>_admin_backoffice/migration.sql`, ejecutar `prisma generate`, revisar el SQL y preservar usuarios, verificaciones, reviews y reportes existentes
- [X] T006 [P] Definir errores de dominio administrativos (`ADMIN_FORBIDDEN`, `TOTP_INVALID`, `TOTP_LOCKED`, `KYC_INVALID_TRANSITION`, `REVIEW_ALREADY_RESOLVED`, `AUDIT_WRITE_FAILED`) en `development/src/features/admin/domain/admin-errors.ts`
- [X] T007 [P] Crear los mappers de proyecciones seguras que excluyan secretos TOTP, password hashes, documentos KYC y metadata sensible en `development/src/features/admin/application/admin-projections.ts`
- [X] T008 Actualizar el tipo de sesión y el contexto de tRPC para transportar `ADMIN`/`MODERATOR` y el estado `PENDING_2FA` sin aceptar roles del cliente; mapear el rol legacy `admin` a `ADMIN` y actualizar `adminProcedure`, seeds, fixtures y consumidores existentes en `development/src/server/api/trpc.ts`, `development/src/types/auth.ts`, `development/src/server/auth/session.service.ts`, `development/src/server/auth/login.service.ts`, `development/prisma/seed.ts` y `development/tests/`
- [X] T009 Actualizar el guard de autorización administrativa y el matcher de `/admin` en `development/src/server/api/trpc.ts` y `development/src/middleware.ts`, manteniendo la autorización de recurso en los servicios
- [X] T010 Registrar el router administrativo vacío en `development/src/server/api/root.ts` y crear el esqueleto de `development/src/server/api/routers/admin.router.ts` con procedimientos tipados por fases, incluyendo `admin.verifyTotp` para resolver challenges `PENDING_2FA`
- [X] T011 [P] Añadir configuración validada de secretos TOTP y rate limits administrativos en `development/src/env.mjs` y `development/src/server/auth/rate-limit.service.ts`, sin valores secretos hardcodeados
- [X] T012 Ejecutar la migración/generación Prisma y comprobar que el schema mantiene relaciones existentes mediante `development/package.json`, `development/prisma/schema.prisma` y `development/prisma/migrations/<timestamp>_admin_backoffice/migration.sql`

**Checkpoint**: Foundation ready. El schema, las roles canónicas, la validación, el contexto tRPC y la estructura de router están listos; US1–US4 pueden comenzar según dependencias.

---

## Phase 2: User Story 1 - Auth 2FA (ADMIN-001) y RBAC (Priority: P1) 🎯 MVP

**Goal**: Permitir que `ADMIN` y `MODERATOR` configuren TOTP RFC 6238 mediante QR y entren en `/admin` únicamente con permisos válidos.

**Independent Test**: Configurar TOTP con QR, confirmar un código válido, acceder como `ADMIN` y `MODERATOR`, comprobar permisos diferenciados y verificar que un usuario normal o un código inválido recibe denegación sin exposición de secretos.

### Tests for User Story 1

- [X] T013 [P] [US1] Añadir tests unitarios de generación/validación RFC 6238, ventana temporal, formato de seis dígitos y bloqueo progresivo en `development/tests/unit/admin/totp.service.test.ts`
- [X] T014 [P] [US1] Añadir tests de integración para setup, confirmación, revocación, challenge `PENDING_2FA`, prevención de replay y RBAC en `development/tests/integration/admin/admin-auth.integration.test.ts`
- [X] T015 [P] [US1] Añadir tests E2E del setup QR, login TOTP, redirección a `/admin/setup-2fa` y formulario de segundo factor en `development/tests/e2e/admin/admin-auth-2fa.spec.ts`

### Implementation for User Story 1

- [X] T016 [P] [US1] Implementar el adaptador RFC 6238 con `otplib`, configuración de periodo/dígitos/ventana y generación de URI `otpauth://` en `development/src/features/admin/infrastructure/totp.provider.ts`
- [X] T017 [P] [US1] Implementar generación temporal de QR con `qrcode`, expiración e invalidación del setup en `development/src/features/admin/infrastructure/totp-qr.service.ts`
- [X] T018 [US1] Implementar cifrado/descifrado de `TotpCredential.secretCiphertext`, activación, timestamps, contador de fallos y bloqueo en `development/src/features/admin/application/totp.service.ts` (depende de T016, T017)
- [X] T019 [US1] Implementar permisos canónicos `ADMIN`/`MODERATOR`, autorización de `/admin` y permisos por procedimiento en `development/src/features/admin/application/admin-authorization.service.ts` y `development/src/server/api/trpc.ts` (depende de T008, T009)
- [X] T020 [US1] Implementar `admin.getAccess`, `admin.startTotpSetup`, `admin.confirmTotpSetup`, `admin.verifyTotp` y `admin.revokeTotp` en `development/src/server/api/routers/admin.router.ts`, consumiendo challenges `PENDING_2FA` de `development/src/server/auth/login.service.ts` y elevando la sesión solo tras consumir el challenge (depende de T018, T019)
- [X] T021 [US1] Crear el layout/página, setup QR, estados loading/error y feedback accesible del backoffice en `development/src/app/admin/layout.tsx`, `development/src/app/admin/page.tsx`, `development/src/app/admin/setup-2fa/page.tsx`, `development/src/app/admin/loading.tsx` y `development/src/app/admin/error.tsx`
- [X] T022 [US1] Integrar las llamadas tRPC y la invalidación de sesión/queries en `development/src/features/admin/presentation/admin-access-panel.tsx` y `development/src/features/admin/presentation/totp-setup-form.tsx` (depende de T020, T021)
- [X] T023 [US1] Verificar que las respuestas y logs no contienen secreto TOTP, QR persistente, password hash ni token en `development/src/features/admin/application/totp.service.ts`, `development/src/server/lib/logger.ts` y los tests de US1

**Checkpoint**: US1 funciona de forma independiente: un operador con TOTP válido entra a `/admin`, el RBAC se aplica en servidor y los usuarios no autorizados son rechazados.

---

## Phase 3: User Story 2 - Gestión de Usuarios (ADMIN-002) y Verificación KYC (ADMIN-003) (Priority: P1) 🎯 MVP

**Goal**: Permitir a `ADMIN` consultar usuarios/verificaciones y resolver solicitudes KYC con motivo, transición válida, privacidad y trazabilidad.

**Independent Test**: Crear una `IdentityVerification` pendiente, listarla sin documentos, resolverla como `ADMIN` con motivo y verificar estado, auditoría/notificación, rechazo de permisos insuficientes y conflicto de doble decisión.

### Tests for User Story 2

- [X] T024 [P] [US2] Añadir tests unitarios de transiciones KYC, validación de motivos, permisos y mapeo de proyecciones seguras en `development/tests/unit/admin/kyc.service.test.ts`
- [X] T025 [P] [US2] Añadir tests de integración para `admin.listUsers`, `admin.getUserKycDetails`, `admin.reviewKyc` y `admin.suspendUser` con PostgreSQL en `development/tests/integration/admin/admin-users-kyc.integration.test.ts`
- [X] T026 [P] [US2] Añadir tests E2E de listado, detalle sin PII restringida, resolución KYC y estados vacío/error en `development/tests/e2e/admin/admin-users-kyc.spec.ts`

### Implementation for User Story 2
- [X] T027 [P] [US2] Implementar repositorio de usuarios/KYC con cursor pagination, orden estable `createdAt,id`, selects explícitos y filtros de estado en `development/src/features/admin/infrastructure/admin-user.repository.ts`
- [X] T028 [US2] Implementar servicio de consulta de usuarios y KYC con autorización por rol/recurso, estados y proyecciones seguras en `development/src/features/admin/application/admin-users.service.ts` (depende de T007, T027)
- [X] T029 [US2] Implementar servicio transaccional de resolución KYC con `verified`, `rejected` y `retry_required`, motivo obligatorio y conflicto concurrente en `development/src/features/admin/application/admin-kyc.service.ts` (depende de T006, T028)
- [X] T030 [US2] Añadir `admin.listUsers`, `admin.getUserKycDetails`, `admin.reviewKyc`, `admin.suspendUser` y `admin.reactivateUser` a `development/src/server/api/routers/admin.router.ts` con schemas Zod y mapping de errores (depende de T003, T028, T029)
- [X] T031 [US2] Crear el panel de usuarios/KYC, filtros, paginación, detalle, motivos y estados de carga/error en `development/src/features/admin/presentation/users-panel.tsx`, `development/src/features/admin/presentation/kyc-review-panel.tsx` y `development/src/app/admin/users/page.tsx`
- [X] T032 [US2] Integrar notificaciones de decisión KYC sin documentos ni información interna en `development/src/server/integrations/email/email.provider.ts` y `development/src/features/admin/application/admin-kyc.service.ts` (depende de T029)
- [X] T033 [US2] Verificar que usuarios `MODERATOR` y roles no autorizados no acceden a documentos KYC, exportaciones o campos restringidos en `development/tests/integration/admin/admin-users-kyc.integration.test.ts`

**Checkpoint**: US2 funciona de forma independiente después de Foundation: `ADMIN` puede gestionar KYC sin exposición de datos restringidos y los estados son consistentes ante concurrencia.

---

## Phase 4: User Story 3 - Moderación de Reviews (Priority: P1) 🎯 MVP

**Goal**: Permitir a `ADMIN` y `MODERATOR` gestionar reportes de reviews del Módulo 006 sin duplicar modelos ni romper la visibilidad pública.

**Independent Test**: Crear/usar un reporte abierto, listarlo desde `/admin`, resolverlo como `MODERATOR`, verificar estado público, motivo, relación con `ReviewReport` y rechazo de una segunda resolución o conflicto de interés.

### Tests for User Story 3

- [X] T034 [P] [US3] Añadir tests unitarios de autorización de moderador, conflicto de interés, decisiones `published`/`removed` y estados inválidos en `development/tests/unit/admin/admin-audit.middleware.test.ts`
- [X] T035 [P] [US3] Añadir tests de integración para `admin.listReviewReports` y `admin.resolveReviewReport`, incluyendo transacción Review + ReviewReport, en `development/tests/integration/admin/admin-reviews-audit.integration.test.ts`
- [X] T036 [P] [US3] Añadir tests E2E del panel `/admin/reviews`, resolución, error `CONFLICT` y regresión de proyecciones públicas en `development/tests/e2e/admin/admin-review-moderation.spec.ts`

### Implementation for User Story 3

- [X] T037 [P] [US3] Implementar repositorio administrativo de `Review`/`ReviewReport` con filtros, paginación y proyección mínima en `development/src/features/admin/infrastructure/admin-review.repository.ts`
- [X] T038 [US3] Implementar servicio de listado/resolución de reportes reutilizando estados y reglas del Módulo 006 en `development/src/features/admin/application/admin-review.service.ts` (depende de T006, T037)
- [X] T039 [US3] Añadir `admin.listReviewReports` y `admin.resolveReviewReport` al router en `development/src/server/api/routers/admin.router.ts` (depende de T003, T038)
- [X] T040 [US3] Crear panel administrativo de reviews, tabla/filtros, detalle, motivo y estados accesibles en `development/src/features/admin/presentation/review-moderation-panel.tsx` y `development/src/app/admin/reviews/page.tsx`
- [X] T041 [US3] Mantener compatibilidad entre `/admin/reviews` y la ruta existente `/moderation/reviews` mediante integración de componentes y autorización en `development/src/app/(app)/moderation/reviews/page.tsx` y `development/src/features/reviews/presentation/review-moderation-panel.tsx` (depende de T040)
- [X] T042 [US3] Verificar que la moderación actualiza únicamente la review/report autorizada y no altera agregados públicos indebidamente en `development/src/features/reviews/infrastructure/review.repository.ts` y `development/tests/integration/admin/admin-reviews-audit.integration.test.ts`

**Checkpoint**: US3 funciona de forma independiente después de Foundation: los moderadores resuelven reportes una sola vez, las reviews públicas reflejan la decisión y el Módulo 006 mantiene sus contratos.

---

## Phase 5: User Story 4 - Auditoría y Trazabilidad Inmutable (Priority: P1) 🎯 MVP

**Goal**: Registrar automáticamente todas las acciones administrativas y hacer demostrable la inmutabilidad, consulta y cobertura de auditoría.

**Independent Test**: Ejecutar acciones exitosas, denegadas, inválidas y fallidas de US1–US3; consultar logs como `ADMIN`; comprobar actor/procedimiento/recurso/resultado, ausencia de secretos y que no existen update/delete.

### Tests for User Story 4

- [X] T043 [P] [US4] Añadir tests unitarios del clasificador de resultados, sanitización de metadata y contrato append-only en `development/tests/unit/admin/admin-audit.middleware.test.ts`
- [X] T044 [P] [US4] Añadir tests de integración que verifiquen auditoría atómica junto a resolución KYC/review, rollback con `AUDIT_WRITE_FAILED` cuando falla la inserción del log, fallos de transacción y consultas paginadas en `development/tests/integration/admin/admin-reviews-audit.integration.test.ts`
- [X] T045 [P] [US4] Añadir tests E2E de auditoría de acciones administrativas y denegaciones en `development/tests/e2e/admin/admin-review-moderation.spec.ts`

### Implementation for User Story 4

- [X] T046 [P] [US4] Implementar repositorio append-only de `AdminAuditLog` con selects seguros, cursor pagination y filtros en `development/src/features/admin/infrastructure/admin-audit.repository.ts`
- [X] T047 [US4] Implementar helper/middleware tRPC para capturar procedimiento, actor, recurso, resultado, requestId y metadata sanitizada en `development/src/features/admin/application/admin-audit.middleware.ts` y `development/src/features/admin/application/admin-audit.service.ts` (depende de T010, T046)
- [X] T048 [US4] Integrar auditoría atómica en la resolución de reviews y revertir la mutación si falla `AdminAuditLog` en `development/src/server/api/routers/admin.router.ts` y `development/src/features/admin/application/admin-review.service.ts` (depende de T038, T047)
- [X] T049 [US4] Implementar `admin.listAuditLogs` como consulta solo lectura protegida para `ADMIN` en `development/src/server/api/routers/admin.router.ts` y `development/src/features/admin/application/admin-audit.service.ts` (depende de T046, T047)
- [X] T050 [US4] Añadir cobertura de observabilidad y proyecciones sin PII restringida en `development/src/features/admin/application/admin-audit.service.ts` y `development/src/server/services/security-event.service.ts` (depende de T047)
- [X] T051 [US4] Verificar append-only por ausencia de update/delete, permisos de DB y rollback en `development/prisma/migrations/20260924120000_init_backoffice_2fa_audit/migration.sql` y `development/tests/integration/admin/admin-reviews-audit.integration.test.ts`

**Checkpoint**: US4 funciona de forma independiente sobre las tres historias anteriores: toda acción administrativa queda trazable y `AdminAuditLog` no puede modificarse desde la aplicación.

### Final validation and polish

- [X] T052 [P] [US4] Añadir la vista de auditoría con filtros, paginación, estados vacío/error y accesibilidad en `development/src/features/admin/presentation/audit-log-panel.tsx` y `development/src/app/admin/audit/page.tsx`
- [X] T053 [P] Actualizar documentación de endpoints, roles y seguridad en `development/README.md` y enlazar `specs/009-modulo-backoffice/quickstart.md`
- [X] T054 [P] Revisar rate limits, headers, cookies, no exposición de secretos y logs sensibles en `development/src/middleware.ts`, `development/src/server/api/trpc.ts`, `development/src/server/auth/rate-limit.service.ts` y `development/src/server/lib/logger.ts`
- [X] T055 Ejecutar el quickstart completo, lint, tests unitarios/integración, build y E2E; corregir regresiones en `development/` según `specs/009-modulo-backoffice/quickstart.md`
- [X] T056 Confirmar que el diff no implementa listings, disputas, analytics, categorías ni CMS/FAQ y documentar esos límites en `specs/009-modulo-backoffice/plan.md`
- [X] T057 [P] Añadir benchmark de 100 operaciones administrativas representativas y verificar que el p95 es inferior a 800 ms para SC-004 en `development/tests/integration/admin/admin-performance.test.ts`

**Final Checkpoint**: MVP listo para análisis: las cuatro historias tienen tests independientes, las decisiones administrativas son transaccionales y auditables, y el alcance diferido no se ha implementado accidentalmente.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup + Foundation**: Sin dependencias externas; bloquea todas las historias. T004 → T005 → T012 y T008 → T009 → T010 son estrictamente secuenciales dentro del trabajo de integración.
- **Phase 2 — US1 Auth 2FA/RBAC**: Depende de Phase 1; habilita `/admin` y los guards reutilizados por las demás historias.
- **Phase 3 — US2 Usuarios/KYC**: Depende de Phase 1 y de T019/T030 para autorización/procedimientos; puede desarrollarse en paralelo con US3 si los cambios compartidos del router se coordinan.
- **Phase 4 — US3 Moderación**: Depende de Phase 1 y del contrato existente del Módulo 006; puede desarrollarse en paralelo con US2 después de T010.
- **Phase 5 — US4 Auditoría**: El repositorio/middleware puede prepararse tras Phase 1, pero la integración completa T048 requiere US2 y US3; la validación final depende de US1–US4.

### User Story Dependencies

- **US1 (P1)**: Depende de Foundation; es el primer incremento MVP y habilita la superficie `/admin`.
- **US2 (P1)**: Depende de Foundation y consume autorización de US1, pero sus servicios y tests de dominio son independientes.
- **US3 (P1)**: Depende de Foundation y de los modelos del Módulo 006; sus servicios y tests son independientes de KYC.
- **US4 (P1)**: Cross-cutting; puede comenzar con repositorio/middleware en paralelo, pero su integración y prueba final requieren acciones de US1–US3.

### Strictly Sequential Chains

- `T004 → T005 → T012`: schema.prisma → migración SQL + prisma generate → aplicación/verificación de base de datos.
- `T008 → T009 → T010 → T019`: sesión `PENDING_2FA` → middleware/guard → router/challenge → permisos de procedimiento.
- `T016 → T018 → T020 → T022`: proveedor TOTP → servicio → router → UI.
- `T027 → T028 → T029 → T030`: repositorio KYC → consulta → resolución → contrato tRPC.
- `T037 → T038 → T039 → T040`: repositorio reviews → servicio → router → panel.
- `T046 → T047 → T048 → T049`: repositorio audit → middleware → integración → consulta.

### Parallel Opportunities

- **Phase 1**: T001, T002, T003, T006, T007 y T011 pueden ejecutarse en paralelo; T004/T005 son la secuencia de schema.
- **US1 tests**: T013, T014 y T015 pueden ejecutarse en paralelo antes de T016–T020.
- **US2 tests/repository**: T024, T025, T026 y T027 pueden ejecutarse en paralelo tras Foundation.
- **US3 tests/repository**: T034, T035, T036 y T037 pueden ejecutarse en paralelo tras Foundation.
- **Entre historias**: US2 y US3 pueden trabajarse en paralelo tras Foundation; evitar edición simultánea no coordinada de `admin.router.ts`.
- **US4**: T043–T046 pueden ejecutarse en paralelo; T047 debe esperar a T046 y T048 debe esperar a los servicios de KYC/Reviews.
- **Polish**: T052, T053 y T054 pueden ejecutarse en paralelo; T057 debe completarse antes de T055 para validar SC-004 junto con el quickstart; T056 cierra el control de alcance después de T055.

## Parallel Execution Examples

### User Story 1

```text
Task T013: Unit tests TOTP in development/tests/unit/admin/totp.service.test.ts
Task T014: Contract tests admin auth in development/tests/integration/admin/admin-auth.contract.test.ts
Task T015: E2E auth flow in development/tests/e2e/admin/admin-auth.spec.ts
```

### User Story 2

```text
Task T024: Unit tests KYC
Task T025: Integration tests admin KYC router
Task T026: E2E KYC flow
Task T027: KYC repository and pagination
```

### User Story 3

```text
Task T034: Unit tests review moderation
Task T035: Integration tests review router
Task T036: E2E moderation flow
Task T037: Review report repository
```

### User Story 4

```text
Task T043: Unit tests audit middleware
Task T044: Integration tests audit atomicity
Task T045: E2E audit flow
Task T046: Append-only audit repository
```

## Implementation Strategy

### MVP First

1. Completar Phase 1: Setup + Foundation.
2. Completar Phase 2: US1 Auth 2FA/RBAC.
3. Ejecutar el criterio independiente de US1 y detenerse para validar acceso, QR, roles y seguridad.
4. Completar US2 y US3 como incrementos MVP independientes.
5. Integrar US4 Auditoría y Trazabilidad Inmutable y ejecutar la validación completa.

### Incremental Delivery

1. Foundation → schema y guards listos.
2. US1 → backoffice seguro y demostrable.
3. US2 → operación KYC sin exponer datos restringidos.
4. US3 → moderación conectada con Módulo 006.
5. US4 → trazabilidad completa y controles de auditoría.

### Notes

- Cada tarea tiene checkbox, ID secuencial, etiquetas requeridas y ruta concreta.
- `[P]` solo marca tareas separables por archivo/superficie y sin dependencia incompleta.
- Las ediciones compartidas de `admin.router.ts`, `trpc.ts`, `schema.prisma` y `package-lock.json` deben coordinarse aunque tareas vecinas estén marcadas como paralelas.
- No crear `tasks.md` para funcionalidades fuera del alcance MVP; quedan explícitamente diferidas.