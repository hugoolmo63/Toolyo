# Tasks: Reviews y Reputación

**Input**: Design documents from `/specs/006-modulo-reviews/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/review-router.md`, `quickstart.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la estructura de Reviews, fixtures y datos sintéticos.

- [X] T001 Crear la estructura feature-based en `development/src/features/reviews/{application,domain,infrastructure,presentation,shared}` y las carpetas `development/tests/{unit,integration,e2e}/reviews`.
- [X] T002 [P] Revisar dependencias y scripts de Prisma, tRPC, Zod, Vitest, Testcontainers y Playwright en `development/package.json` y documentar faltantes en `specs/006-modulo-reviews/plan.md`.
- [X] T003 [P] Añadir fixtures deterministas de usuarios, listings y reservas `completed` en `development/tests/fixtures/review.fixtures.ts`.
- [X] T004 [P] Añadir datos sintéticos de reviews y estados de moderación en `development/prisma/seed.ts` sin duplicar seeds existentes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo, validación, autorización y errores comunes a todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede comenzar hasta completar esta fase.

- [X] T005 Definir los enums y modelos `Review`, `ReviewCategoryScore` y `ReviewReport`, con relaciones a `Booking`, `User` y `Listing`, en `development/prisma/schema.prisma`.
- [X] T006 Añadir constraints e índices para unicidad `(bookingId, authorId, direction)`, categorías, reportes activos, estados y consultas por listing/usuario en `development/prisma/schema.prisma`.
- [X] T007 Crear las migraciones Prisma `development/prisma/migrations/20260923090000_reviews_foundational/migration.sql` y `development/prisma/migrations/20260923170000_fix_completed_at_trigger/migration.sql`, incluyendo FKs, índices, constraints y el trigger de inmutabilidad.
- [X] T008 [P] Implementar tipos y transiciones `hidden`, `published`, `under_review` y `removed` en `development/src/features/reviews/domain/review.ts`.
- [X] T009 [P] Implementar elegibilidad y ventana de 14 días en `development/src/features/reviews/domain/review-eligibility.ts`.
- [X] T010 [P] Crear schemas Zod de envío, consulta, reporte y resolución en `development/src/features/reviews/shared/review.schema.ts`.
- [X] T011 [P] Crear errores de dominio para no elegible, expirado, duplicado, no autorizado, categoría inválida y moderación en `development/src/features/reviews/domain/review-errors.ts`.
- [X] T012 Implementar autorización renter/owner, visibilidad doble ciega y rol de moderación en `development/src/features/reviews/application/review-authorization.ts`.
- [X] T013 [P] Escribir tests unitarios de elegibilidad, ventana, categorías y transiciones en `development/tests/unit/reviews/review-domain.test.ts`.
- [X] T014 Ejecutar validación Prisma y migración contra PostgreSQL de pruebas; documentar el checkpoint en `development/tests/integration/reviews/README.md`.

**Checkpoint**: Modelo, validaciones, autorización y fixtures disponibles.

---

## Phase 3: User Story 1 - Valorar propietario y producto (Priority: P1) 🎯 MVP

**Goal**: El renter puede emitir una review válida del owner y del listing tras un alquiler completado.

**Independent Test**: Con reserva `completed` dentro de 14 días, el renter crea una review con puntuación, categorías y comentario opcional; duplicados y reviews fuera de plazo se rechazan.

### Tests for User Story 1

- [X] T015 [P] [US1] Escribir tests del payload renter → owner/producto en `development/tests/unit/reviews/renter-review.schema.test.ts`.
- [X] T016 [P] [US1] Escribir test de integración de `review.submit` para renter en `development/tests/integration/reviews/renter-review.integration.test.ts`.
- [X] T017 [P] [US1] Escribir tests de rechazo por estado, ventana, usuario externo y duplicado en `development/tests/integration/reviews/renter-review-errors.integration.test.ts`.

### Implementation for User Story 1

- [X] T018 [P] [US1] Implementar creación y consulta de reviews, categorías y unicidad en `development/src/features/reviews/infrastructure/review.repository.ts`.
- [X] T019 [US1] Implementar `reviewService.submit` para renter en `development/src/features/reviews/application/review.service.ts`.
- [X] T020 [US1] Crear `review.submit` y registrar `reviewRouter` en `development/src/server/api/routers/review.router.ts` y `development/src/server/api/root.ts`.
- [X] T021 [US1] Crear formulario renter con estados loading/error/éxito en `development/src/features/reviews/presentation/review-form.tsx`.
- [X] T022 [US1] Añadir la entrada de review en `development/src/app/(app)/dashboard/bookings/[bookingId]/review/page.tsx`.
- [X] T023 [US1] Ejecutar tests unitarios e integración de US1 y registrar el resultado en `specs/006-modulo-reviews/quickstart.md`.

**Checkpoint**: El renter puede emitir una única review válida y recibe el estado de visibilidad.

---

## Phase 4: User Story 2 - Valorar al arrendatario (Priority: P1)

**Goal**: El owner puede valorar comunicación, cuidado del producto y puntualidad del renter.

**Independent Test**: El owner autorizado envía una review owner → renter; las categorías se validan y los usuarios externos son rechazados.

- [X] T024 [P] [US2] Escribir tests de categorías y payload owner → renter en `development/tests/unit/reviews/owner-review.schema.test.ts`.
- [X] T025 [P] [US2] Escribir test de integración de owner en `development/tests/integration/reviews/renter-review.integration.test.ts`.
- [X] T026 [P] [US2] Escribir tests de autorización, aislamiento y duplicados en `development/tests/integration/reviews/renter-review.integration.test.ts`.
- [X] T027 [US2] Extender `reviewService.submit` con dirección y categorías owner → renter en `development/src/features/reviews/application/review.service.ts`.
- [X] T028 [US2] Implementar `reviews.createOwnerReview` y `reviews.getOwnerReviewStatus` con estado `hidden` en `development/src/server/api/routers/review.router.ts`.
- [X] T029 [US2] Añadir formulario y CTA del owner en `development/src/features/reviews/presentation/owner-review-form.tsx` y `development/src/app/(app)/dashboard/bookings/[bookingId]/review/page.tsx`.
- [X] T030 [US2] Ejecutar tests unitarios e integración de owner y autorización en `development/tests/integration/reviews/renter-review.integration.test.ts`.

**Checkpoint**: Ambas partes valoran en su dirección correcta sin manipular la review ajena.

---

## Phase 5: User Story 3 - Consultar reputación pública (Priority: P1)

**Goal**: Mostrar reputación agregada de listings y usuarios usando solo reviews publicadas.

**Independent Test**: Un visitante consulta un listing o perfil y ve promedio, recuento y categorías coherentes; reviews ocultas o moderadas no aparecen ni alteran agregados.

- [X] T031 [P] [US3] Escribir tests de promedio, exclusión de estados y redondeo a una decimal en `development/tests/unit/reviews/reputation-aggregation.test.ts`.
- [X] T032 [P] [US3] Escribir tests de `review.getListingReputation` y `review.getUserReputation` en `development/tests/integration/reviews/reputation-router.integration.test.ts`.
- [X] T033 [P] [US3] Escribir test de privacidad de recuentos y promedios en `development/tests/integration/reviews/reputation-visibility.integration.test.ts`.
- [X] T034 [P] [US3] Implementar agregados por listing y usuario filtrando `published` en `development/src/features/reviews/infrastructure/review.repository.ts`.
- [X] T035 [US3] Implementar procedimientos de reputación pública en `development/src/server/api/routers/review.router.ts`.
- [X] T036 [P] [US3] Crear `ReputationSummary` y `ReviewCard` en `development/src/features/reviews/presentation/reputation-summary.tsx` y `development/src/features/reviews/presentation/review-card.tsx`.
- [X] T037 [US3] Integrar `ReputationSummary` en `development/src/app/(public)/listings/[slug]/page.tsx` y perfil público existente.
- [X] T038 [US3] Ejecutar tests de agregados y privacidad en los archivos de integración de US3.

**Checkpoint**: La comunidad consulta reputación sin acceder a reviews ocultas o moderadas.

---

## Phase 6: User Story 4 - Reportar y moderar reviews (Priority: P2)

**Goal**: Reportar contenido inapropiado y resolverlo con autorización y trazabilidad.

- [X] T039 [P] [US4] Escribir tests de motivos, duplicados activos y transiciones en `development/tests/unit/reviews/review-moderation.test.ts`.
- [X] T040 [P] [US4] Escribir tests de `review.report` en `development/tests/integration/reviews/review-report.integration.test.ts`.
- [X] T041 [P] [US4] Escribir tests de `review.resolveReport` y trazabilidad en `development/tests/integration/reviews/review-moderation.integration.test.ts`.
- [X] T042 [US4] Implementar reportes, deduplicación y transición `under_review` en `development/src/features/reviews/application/review.service.ts`.
- [X] T043 [US4] Implementar `review.report` y `review.resolveReport` en `development/src/server/api/routers/review.router.ts`.
- [X] T044 [P] [US4] Crear `ReviewReportDialog` y estado de moderación en `development/src/features/reviews/presentation/review-report-dialog.tsx` y `development/src/features/reviews/presentation/review-moderation-status.tsx`.
- [X] T045 [US4] Crear la vista autorizada de moderación en `development/src/app/(app)/moderation/reviews/page.tsx`.
- [X] T046 [US4] Ejecutar tests unitarios y de integración de moderación en los archivos de US4.

**Checkpoint**: Los reportes tienen ciclo de vida trazable y las reviews moderadas quedan excluidas.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Completar doble ciego, expiración, accesibilidad, E2E y rendimiento.

- [X] T047 Implementar publicación al segundo envío o vencimiento de 14 días en `development/src/features/reviews/application/review-publication.service.ts`.
- [X] T048 [P] Crear tests de doble ciego, publicación simultánea y review única al vencer en `development/tests/integration/reviews/review-publication.integration.test.ts`.
- [X] T049 [P] Crear el job idempotente de publicación vencida en `development/src/server/jobs/publish-expired-reviews.ts`.
- [X] T050 [P] Crear E2E renter → owner → reputación pública en `development/tests/e2e/reviews.spec.ts`.
- [X] T051 [P] Crear E2E de ventana expirada, review única, reporte y estado oculto en `development/tests/e2e/reviews-edge-cases.spec.ts`.
- [X] T052 [P] Verificar accesibilidad de formularios en `development/tests/e2e/reviews-accessibility.spec.ts`.
- [X] T053 Crear benchmark de agregados en `development/tests/performance/reviews/reviews.performance.test.ts` con 10.000 reviews `PUBLISHED` distribuidas entre 1.000 listings/usuarios y 50 peticiones concurrentes; validar p95 < 500 ms y tasa de errores < 0,1%, y escribir métricas en `specs/006-modulo-reviews/benchmark-results.json`.
- [X] T054 Actualizar mensajes de estado y documentación en `development/src/features/reviews/presentation/review-status-message.tsx` y `specs/006-modulo-reviews/quickstart.md`.
- [X] T055 Ejecutar Prisma, tests unitarios, integración, typecheck y Playwright; hacer fallar la validación si T053 incumple p95 < 500 ms o la tasa de errores >= 0,1%, y registrar resultados en `specs/006-modulo-reviews/quickstart.md`.

---

## Dependencies & Execution Order

- **Setup T001–T004**: sin dependencias.
- **Foundational T005–T014**: depende de Setup y bloquea historias.
- **US1 T015–T023**: MVP; depende de Foundational.
- **US2 T024–T030**: depende de Foundational y reutiliza el servicio base de US1.
- **US3 T031–T038**: depende de datos publicables de US1/US2.
- **US4 T039–T046**: depende del modelo y estados fundacionales; puede avanzar junto con US3.
- **Polish T047–T055**: depende de US1–US4.

## Parallel Opportunities

- T002–T004 y T008–T011 pueden ejecutarse en paralelo cuando sus archivos no se solapen.
- Tests T015–T017, T024–T026, T031–T033 y T039–T041 son paralelizables.
- US3 y US4 pueden avanzar en paralelo después de Foundational.
- T050–T053 pueden ejecutarse en paralelo tras completar servicios y routers.

## Parallel Example: User Story 1

```text
T015: schema unitario
T016: integración submit
T017: errores de integración
```

## Implementation Strategy

### MVP First

1. Completar T001–T014.
2. Completar US1, T015–T023.
3. Validar emisión, duplicado, expiración y reserva no elegible.
4. Detenerse para demo antes de ampliar reputación pública o moderación.

### Incremental Delivery

1. Setup + Foundational.
2. US1 renter.
3. US2 owner.
4. US3 reputación pública.
5. US4 moderación.
6. Polish con doble ciego, expiración, E2E y rendimiento.

### Definition of Done

- Cada historia tiene tests unitarios e integración con PostgreSQL.
- El doble ciego no revela reviews antes de ambas submissions o vencimiento.
- Una review única se publica al vencer y participa en agregados.
- Reviews no publicadas o bajo moderación no afectan promedios.
- Reportes conservan actor, decisión y timestamps.
- `npm test`, `npm run test:integration`, `npx tsc --noEmit` y Playwright pasan.
