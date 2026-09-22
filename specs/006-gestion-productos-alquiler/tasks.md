---

description: "Tareas de implementación para la gestión de productos de alquiler"
---

# Tasks: Gestión de productos para alquiler

**Input**: Design documents from `/specs/006-gestion-productos-alquiler/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/listing-management.md](contracts/listing-management.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la estructura de feature y confirmar que se reutilizan las entidades y dependencias existentes.

- [X] T001 [P] Crear la estructura de carpetas de feature en `development/src/features/listing-management/{application,domain,infrastructure,presentation,shared}`.
- [X] T002 [P] Crear la estructura de rutas privadas en `development/src/app/(app)/dashboard/products/` incluyendo `new/` y `[listingId]/edit/`.
- [X] T003 [P] Crear las carpetas de pruebas en `development/tests/unit/listing-management/`, `development/tests/integration/listing-management/` y `development/tests/e2e/listing-management/`.
- [X] T004 Verificar en `development/prisma/schema.prisma` que `Listing`, `ListingPhoto`, `Category` y `User` cubren el modelo definido sin añadir una entidad duplicada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Construir las reglas compartidas de validación, autorización, errores y contratos que bloquean todas las historias.

**⚠️ CRITICAL**: No iniciar la implementación de historias hasta completar esta fase.

- [X] T005 [P] Definir los schemas Zod compartidos para filtros, paginación, campos de listing, fotos, publicación y retirada en `development/src/features/listing-management/shared/listing-management.schema.ts`.
- [X] T006 [P] Definir DTOs, tipos de estado, resultados paginados y errores de dominio en `development/src/features/listing-management/domain/listing-management.ts` y `development/src/features/listing-management/domain/listing-management.errors.ts`.
- [X] T007 [P] Crear el re-export de validaciones compartidas en `development/src/lib/validations/listing-management.ts`.
- [X] T008 Implementar el repository base con mapeos explícitos, filtros `deletedAt`, consultas por `ownerId`, orden estable y paginación en `development/src/features/listing-management/infrastructure/listing-management.repository.ts`.
- [X] T009 Implementar las funciones de autorización de recurso y transiciones de estado en `development/src/features/listing-management/application/listing-management.service.ts`, sin aceptar `ownerId` desde inputs.
- [X] T010 Implementar el punto de extensión para consultar compromisos activos antes de retirar un listing en `development/src/features/listing-management/application/active-commitments.port.ts`.
- [X] T011 Crear el router tRPC privado `listingManagement` con `authedProcedure`, mapeo de errores, logging y rate limiting en `development/src/server/api/routers/listing-management.router.ts`.
- [X] T012 Registrar `listingManagementRouter` en `development/src/server/api/root.ts` y verificar que los procedimientos del contrato quedan tipados en el `AppRouter`.
- [X] T013 [P] Añadir pruebas unitarias de schemas, límites, precio positivo, URLs de imagen, paginación y errores en `development/tests/unit/listing-management/listing-management.schema.test.ts`.
- [X] T014 [P] Añadir pruebas unitarias de ownership, transiciones, soft delete, idempotencia y rechazo de compromisos activos en `development/tests/unit/listing-management/listing-management.service.test.ts` y `development/tests/unit/listing-management/listing-management.transitions.test.ts`.

**Checkpoint**: El router privado y las reglas de dominio están disponibles; las historias pueden implementarse y probarse de forma incremental.

---

## Phase 3: User Story 1 - Consultar el panel de productos publicados (Priority: P1) 🎯 MVP

**Goal**: Permitir que un usuario identificado vea únicamente sus productos, sus datos principales, estado y un estado vacío accionable.

**Independent Test**: Un usuario identificado con productos abre `/dashboard/products` y ve solo sus listings; un usuario sin listings ve una acción para crear; un visitante no identificado es redirigido al login sin datos privados.

### Tests for User Story 1

- [X] T015 [P] [US1] Añadir pruebas de integración de `listMine` para aislamiento por propietario, estado vacío, filtros, paginación y orden estable en `development/tests/integration/listing-management/listing-management.router.integration.test.ts`.
- [X] T016 [P] [US1] Añadir pruebas E2E del acceso autenticado, redirección sin sesión y estado vacío en `development/tests/e2e/listing-management/listing-management.spec.ts`.

### Implementation for User Story 1

- [X] T017 [US1] Implementar el procedimiento `listMine` y su consulta paginada con categoría e imagen principal en `development/src/features/listing-management/infrastructure/listing-management.repository.ts` y `development/src/features/listing-management/application/listing-management.service.ts`.
- [X] T018 [US1] Crear la página Server Component del panel en `development/src/app/(app)/dashboard/products/page.tsx` usando `createServerApi`, redirección a login y datos del usuario autenticado.
- [X] T019 [P] [US1] Crear el skeleton y error boundary del panel en `development/src/app/(app)/dashboard/products/loading.tsx` y `development/src/app/(app)/dashboard/products/error.tsx`.
- [X] T020 [P] [US1] Crear el estado vacío accesible con acción `Crear producto` en `development/src/features/listing-management/presentation/listing-empty-state.tsx`.
- [X] T021 [P] [US1] Crear la tarjeta de producto y badge de estado en `development/src/features/listing-management/presentation/listing-card.tsx` y `development/src/features/listing-management/presentation/listing-status-badge.tsx`.
- [X] T022 [US1] Implementar el panel interactivo con filtros, paginación, estados de carga/error y feedback de consulta en `development/src/features/listing-management/presentation/listing-management-panel.tsx`.
- [X] T023 [US1] Aplicar navegación accesible, diseño responsive mobile-first y tokens `profesional-seguro` al panel en los componentes de `development/src/features/listing-management/presentation/`.

**Checkpoint**: User Story 1 es demostrable de forma independiente y entrega el MVP del panel privado.

---

## Phase 4: User Story 2 - Publicar un nuevo producto para alquiler (Priority: P1)

**Goal**: Permitir crear un producto como borrador o publicarlo con datos válidos, asociándolo exclusivamente al usuario autenticado.

**Independent Test**: Un usuario autenticado completa `/dashboard/products/new` con datos válidos, guarda un borrador o publica, y ve exactamente un producto propio con el estado resultante; datos inválidos no crean registros.

### Tests for User Story 2

- [X] T024 [P] [US2] Añadir pruebas de integración de `create` para asociación al usuario de sesión, validación de categoría/precio/fotos, transacción y ausencia de duplicados en `development/tests/integration/listing-management/listing-management.router.integration.test.ts`.
- [X] T025 [P] [US2] Añadir pruebas E2E de formulario inválido, guardado como borrador y publicación en `development/tests/e2e/listing-management/listing-management.spec.ts`.

### Implementation for User Story 2

- [X] T026 [US2] Implementar `create` en el servicio y repository con generación estable de slug, validación de categoría, creación atómica de `Listing` y `ListingPhoto` en `development/src/features/listing-management/application/listing-management.service.ts` y `development/src/features/listing-management/infrastructure/listing-management.repository.ts`.
- [X] T027 [US2] Implementar la idempotencia de creación/publicación y el control de requisitos mínimos de publicación en `development/src/features/listing-management/domain/listing-management.ts`.
- [X] T028 [US2] Crear el formulario de producto con React Hook Form, resolver Zod, campos obligatorios, precio Decimal, ubicación aproximada, fotos y acciones de borrador/publicación en `development/src/features/listing-management/presentation/listing-form.tsx`.
- [X] T029 [US2] Crear la página Server Component de alta en `development/src/app/(app)/dashboard/products/new/page.tsx` y cargar categorías activas mediante el cliente de servidor existente.
- [X] T030 [P] [US2] Implementar la interfaz de gestión de referencias de fotos, orden y texto alternativo en `development/src/features/listing-management/presentation/listing-photo-editor.tsx`.
- [X] T031 [US2] Integrar la mutación `create`, estados pending/error/success, invalidación de `listMine` y redirección al producto creado en `development/src/features/listing-management/presentation/listing-form.tsx`.
- [X] T032 [US2] Verificar que la publicación solo expone el listing en las consultas públicas cuando `status = published` y `deletedAt IS NULL`, actualizando los filtros compartidos si fuera necesario en `development/src/features/listing-management/application/listing-management.service.ts`.

**Checkpoint**: User Story 2 permite crear y publicar productos sin duplicados y con validación completa.

---

## Phase 5: User Story 3 - Modificar y consultar un producto propio (Priority: P1)

**Goal**: Permitir consultar y editar un listing propio, conservando la versión anterior cuando la validación o el guardado fallen.

**Independent Test**: El propietario abre un producto propio, consulta sus datos, cambia título o precio válidos, guarda y ve el cambio reflejado; un producto ajeno o datos inválidos se rechazan sin fuga de información.

### Tests for User Story 3

- [X] T033 [P] [US3] Añadir pruebas de integración de `getMine` y `update` para ownership, datos completos, transacción de fotos, rollback y consistencia tras recarga en `development/tests/integration/listing-management/listing-management.router.integration.test.ts`.
- [X] T034 [P] [US3] Añadir pruebas E2E de consulta, edición válida, edición inválida y persistencia visual en `development/tests/e2e/listing-management/listing-management.spec.ts`.

### Implementation for User Story 3

- [X] T035 [US3] Implementar `getMine` con DTO privado explícito, disponibilidad, fotos y conteo de compromisos en `development/src/features/listing-management/infrastructure/listing-management.repository.ts` y `development/src/features/listing-management/application/listing-management.service.ts`.
- [X] T036 [US3] Implementar `update` transaccional con reemplazo/soft delete de fotos, validación previa y conservación de la versión anterior en `development/src/features/listing-management/application/listing-management.service.ts`.
- [X] T037 [US3] Crear la página privada de consulta en `development/src/app/(app)/dashboard/products/[listingId]/page.tsx` con acciones de editar, publicar y retirar según estado.
- [X] T038 [US3] Crear la página privada de edición en `development/src/app/(app)/dashboard/products/[listingId]/edit/page.tsx`, reutilizando `listing-form.tsx` con valores iniciales y datos de categoría.
- [X] T039 [US3] Integrar la mutación `update`, invalidación de `listMine`/`getMine` y feedback accesible de éxito/error en `development/src/features/listing-management/presentation/listing-form.tsx`.
- [X] T040 [P] [US3] Añadir estados de carga, 404 y error para consulta/edición en `development/src/app/(app)/dashboard/products/[listingId]/loading.tsx`, `not-found.tsx` y `error.tsx`.

**Checkpoint**: User Story 3 permite consultar y modificar productos propios sin perder datos válidos.

---

## Phase 6: User Story 4 - Retirar un producto del alquiler (Priority: P2)

**Goal**: Retirar un producto propio con confirmación explícita, soft delete y protección de compromisos activos.

**Independent Test**: El propietario cancela una confirmación y no hay cambios; confirma una retirada y el producto desaparece de activos/búsqueda pública; con compromisos activos recibe conflicto y el listing permanece.

### Tests for User Story 4

- [X] T041 [P] [US4] Añadir pruebas de integración de `remove` para confirmación, idempotencia, soft delete, exclusión pública y conflicto por compromisos activos en `development/tests/integration/listing-management/listing-management.router.integration.test.ts`.
- [X] T042 [P] [US4] Añadir pruebas E2E de cancelación, confirmación, desaparición del panel activo y mensaje de conflicto en `development/tests/e2e/listing-management/listing-management.spec.ts`.

### Implementation for User Story 4

- [X] T043 [US4] Implementar `remove` como operación transaccional con comprobación de compromisos, ownership, `deletedAt` y resultado idempotente en `development/src/features/listing-management/application/listing-management.service.ts` y `development/src/features/listing-management/infrastructure/listing-management.repository.ts`.
- [X] T044 [US4] Crear el diálogo de confirmación accesible con foco atrapado, acción destructiva y cancelación sin cambios en `development/src/features/listing-management/presentation/listing-delete-dialog.tsx`.
- [X] T045 [US4] Integrar la mutación `remove`, errores `CONFLICT`, invalidación del panel/detalle y redirección segura en `development/src/features/listing-management/presentation/listing-delete-dialog.tsx` y `development/src/app/(app)/dashboard/products/[listingId]/page.tsx`.
- [X] T046 [US4] Verificar y ajustar los filtros públicos de búsqueda/detalle para excluir listings retirados mediante `deletedAt` en `development/src/features/search/` y `development/src/features/listing-detail/` sin romper sus pruebas existentes.

**Checkpoint**: User Story 4 retira listings sin borrado destructivo ni cancelación implícita de compromisos.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación final, seguridad, accesibilidad, rendimiento y documentación de la feature completa.

- [X] T047 [P] Añadir pruebas de accesibilidad axe-core para panel, formulario y diálogo en `development/tests/e2e/listing-management/listing-management.a11y.spec.ts`.
- [X] T048 [P] Revisar logging estructurado de mutaciones y errores sin incluir datos sensibles en `development/src/server/api/routers/listing-management.router.ts` y `development/src/features/listing-management/application/listing-management.service.ts`.
- [X] T049 [P] Revisar límites de rate limiting para lecturas y mutaciones privadas en `development/src/server/auth/rate-limit.service.ts` y configuración de entorno correspondiente.
- [X] T050 Ejecutar la validación completa descrita en `specs/006-gestion-productos-alquiler/quickstart.md` y corregir fallos de integración, lint o build.
- [X] T051 Revisar el diff final contra `spec.md`, `data-model.md` y `contracts/listing-management.md`, incluyendo autorización, soft delete, estados, errores y criterios de éxito.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; las tareas T001-T004 pueden comenzar inmediatamente.
- **Foundational (Phase 2)**: Depende de Setup; T005-T014 bloquean las historias.
- **User Stories (Phases 3-6)**: Dependen de Foundation; US1, US2 y US3 son P1 y comparten los contratos base, US4 es P2.
- **Polish (Phase 7)**: Depende de las historias que se quieran entregar; T050-T051 requieren la implementación completa.

### User Story Dependencies

- **US1 (P1)**: Puede comenzar después de Phase 2; no depende de otra historia y constituye el MVP del panel.
- **US2 (P1)**: Puede comenzar después de Phase 2; reutiliza navegación y componentes del panel de US1, pero sus pruebas de servicio/contrato son independientes.
- **US3 (P1)**: Puede comenzar después de Phase 2; reutiliza el formulario de US2 para edición, pero puede probarse con fixtures propios.
- **US4 (P2)**: Puede comenzar después de Phase 2; reutiliza la vista privada de US3 y el servicio base, pero su retirada se valida independientemente.

### Within Each User Story

- Las pruebas de cada historia se escriben antes de implementar su comportamiento y deben fallar inicialmente.
- Repository/servicio preceden a router y UI cuando la tarea depende del contrato.
- La UI se integra después de que el procedimiento tRPC correspondiente exista.
- Cada checkpoint debe pasar su prueba independiente antes de continuar.

### Parallel Opportunities

- **Setup**: T001, T002 y T003 pueden ejecutarse en paralelo; T004 valida el resultado común.
- **Foundation**: T005, T006, T007, T013 y T014 pueden ejecutarse en paralelo; T008-T012 requieren los contratos/tipos definidos.
- **US1**: T015 y T016 pueden ejecutarse en paralelo; T019-T021 pueden ejecutarse en paralelo después de definir los DTOs.
- **US2**: T024 y T025 pueden ejecutarse en paralelo; T028-T030 pueden dividirse por archivos después de T005.
- **US3**: T033 y T034 pueden ejecutarse en paralelo; T037-T040 pueden dividirse después de T035-T036.
- **US4**: T041 y T042 pueden ejecutarse en paralelo; T044 puede desarrollarse en paralelo con T043.
- **Cross-cutting**: T047-T049 pueden ejecutarse en paralelo antes de T050.

## Parallel Example: User Story 1

```text
Task: "T015 [US1] Integration tests for listMine in development/tests/integration/listing-management/listing-management.router.integration.test.ts"
Task: "T016 [US1] E2E access and empty-state tests in development/tests/e2e/listing-management/listing-management.spec.ts"
Task: "T019 [US1] Loading/error route states in development/src/app/(app)/dashboard/products/loading.tsx and error.tsx"
Task: "T020 [US1] Empty state component in development/src/features/listing-management/presentation/listing-empty-state.tsx"
Task: "T021 [US1] Listing card and status badge in development/src/features/listing-management/presentation/"
```

## Parallel Example: User Story 2

```text
Task: "T024 [US2] Integration tests for create in development/tests/integration/listing-management/listing-management.router.integration.test.ts"
Task: "T025 [US2] E2E create and publish tests in development/tests/e2e/listing-management/listing-management.spec.ts"
Task: "T028 [US2] Listing form in development/src/features/listing-management/presentation/listing-form.tsx"
Task: "T030 [US2] Photo editor in development/src/features/listing-management/presentation/listing-photo-editor.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar US1: panel autenticado, listado propio, filtros/paginación y estado vacío.
3. Ejecutar T015-T016 y validar el checkpoint de US1.
4. Detenerse para demostrar el panel antes de añadir creación o edición.

### Incremental Delivery

1. Foundation lista → entregar US1 como panel navegable.
2. Añadir US2 → crear borradores y publicar productos.
3. Añadir US3 → consultar y modificar productos propios.
4. Añadir US4 → retirar de forma segura y conservar auditoría.
5. Ejecutar Polish y quickstart completo.

### Parallel Team Strategy

1. Un equipo completa Setup + Foundation.
2. Después, un desarrollador puede trabajar en US1, otro en US2 y otro en US3; US4 puede comenzar cuando su integración de detalle esté disponible.
3. T050-T051 se ejecutan después de integrar todas las historias deseadas.

## Notes

- `[P]` indica que la tarea puede ejecutarse en paralelo sin depender de trabajo incompleto en el mismo archivo.
- Cada tarea incluye un ID, la etiqueta de historia cuando corresponde y rutas concretas.
- No se modifica `development/prisma/schema.prisma` salvo que la implementación descubra una dependencia real no cubierta; cualquier migración debe revisarse antes de aplicarse.
- La subida de archivos no se implementa aquí; las fotos se gestionan como referencias válidas según el contrato.
- T050 queda pendiente: la suite global de integración arranca correctamente con Docker, pero `prisma db push` falla en las suites existentes porque la imagen `postgis/postgis:15-3.4-alpine` no incluye la extensión `vector` requerida por `ListingEmbedding`. La prueba de contrato específica de esta feature sí pasa.
