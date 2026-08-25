---
description: "Task list template for feature implementation"
---

# Tasks: Caso Dummy de Desarrollo (Scaffold de Referencia)

**Input**: Design documents from `/specs/001-dev-scaffold-dummy-case/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Incluidas — la spec (FR-006) y `constitution/TESTING.md` exigen pruebas unitarias e integración como parte del scaffold.

**Organization**: Las tareas están agrupadas por user story para permitir implementación y testing independientes de cada story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: A qué user story pertenece la tarea (US1, US2, US3)
- Incluye rutas de fichero exactas.

## Path Conventions

- **Monolito Next.js (App Router)**: `src/server/` (backend/tRPC), `src/app/` (frontend), `prisma/`, `tests/` en la raíz del repositorio.
- Las rutas se ajustan a `constitution/BACKEND.md` §2.1 y `constitution/FRONTEND.md` §2.1.

---

## Phase 1: Setup (Infraestructura Compartida)

**Purpose**: Inicialización del proyecto y estructura base.

- [X] T001 Inicializar el proyecto Next.js (App Router) con TypeScript estricto y dependencias tRPC, Prisma, Zod, Tailwind CSS + shadcn/ui conforme a `plan.md` (package.json, tsconfig.json, next.config.js)
- [X] T002 [P] Configurar ESLint + Prettier con reglas del proyecto (.eslintrc, .prettierrc)
- [X] T003 [P] Configurar Tailwind y `styles/globals.css` con los tokens del tema `profesional-seguro` de `constitution/DESIGN.md` (data-theme, variables CSS)
- [X] T004 [P] Crear `src/env.mjs` con validación Zod de variables de entorno (DATABASE_URL y demás críticas), fallando explícitamente si falta alguna (`BACKEND.md` §10.4)
- [X] T005 [P] Configurar Docker Compose con servicio PostgreSQL local para desarrollo (`docker-compose.yml`)

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes)

**Purpose**: Infraestructura núcleo que DEBE estar completa antes de implementar CUALQUIER user story.

**⚠️ CRITICAL**: Ningún trabajo de user story puede comenzar hasta completar esta fase.

- [X] T006 Definir el modelo Prisma `Category` en `prisma/schema.prisma` (id cuid, name, slug unique, parentId auto-ref, showInNav, createdAt/updatedAt/deletedAt con Timestamptz; índice parentId) conforme a `data-model.md` y `DATABASE.md`
- [X] T007 Crear `src/server/db/client.ts` con cliente Prisma singleton tipado y utilidades de query encapsuladas (`BACKEND.md` §2.2, sin exponer Prisma crudo)
- [X] T008 [P] Crear jerarquía de errores de dominio en `src/server/lib/errors/domain-errors.ts` (AppError base, ValidationError, NotFoundError, ConflictError, InternalServerError) (`BACKEND.md` §9)
- [X] T009 [P] Crear `src/server/lib/validations/category.schema.ts` con schemas Zod compartidos (`CreateCategorySchema`, `CategoryParamsSchema`) conforme a `contracts/category-api.md` y `data-model.md`
- [X] T010 [P] Crear `src/server/lib/logger.ts` con logger estructurado (niveles info/warn/error, campos requestId/userId) (`BACKEND.md` §9.3)
- [X] T011 Configurar el core tRPC en `src/server/api/trpc.ts`: context, middlewares y procedimientos base (`publicProcedure`, `authedProcedure` preparado pero no cableado) (`BACKEND.md` §4.1, `research.md` R6)
- [X] T012 [P] Configurar cliente tRPC compartido en `src/lib/trpc.ts` (server + client) y `src/providers/app-providers.tsx` (compose de contextos del cliente) (`FRONTEND.md` §2.1)
- [X] T013 [P] Crear script de semilla `prisma/seed.ts` con categorías de ejemplo mínimas y deterministas (`TESTING.md` §6)

**Checkpoint**: Fundación lista — la implementación de user stories puede comenzar.

---

## Phase 3: User Story 1 - Esqueleto ejecutable de referencia (Priority: P1) 🎯 MVP

**Goal**: Una aplicación mínima que levante en local y atraviese todas las capas (UI → API → lógica → datos) con la entidad `Category`, verificable de extremo a extremo.

**Independent Test**: `pnpm dev` + abrir `/categories` muestra el listado de categorías sembradas (lectura end-to-end), y `/categories/new` permite crear una categoría que se persiste y aparece en el listado.

### Tests for User Story 1 ⚠️

> **NOTE: Escribir estos tests PRIMERO y verificar que FALLAN antes de la implementación**

- [X] T014 [P] [US1] Test unitario de la lógica pura del servicio (normalización de slug, validación de `showInNav`, error si `name` vacío) en `tests/unit/category.service.test.ts`
- [X] T015 [P] [US1] Test de integración del router tRPC (`list` filtra `deletedAt: null`, `create` persiste y devuelve DTO) contra PostgreSQL real vía Testcontainers en `tests/integration/category.router.test.ts`

### Implementation for User Story 1

- [X] T016 [US1] Implementar `CategoryService` (lógica pura, sin dependencias HTTP/tRPC) en `src/server/services/category.service.ts`: `listActive`, `createCategory` con derivación de slug y verificación de unicidad (depende de T007, T008, T009)
- [X] T017 [US1] Implementar `categoryRouter` en `src/server/api/routers/category.router.ts` con `list` (query pública) y `create` (mutation) que validen con Zod y mapeen errores de dominio a códigos HTTP (`BACKEND.md` §4.2, §9.2)
- [X] T018 [US1] Registrar el router en el app router en `src/server/api/root.ts` (merge de routers y exportación del tipo)
- [X] T019 [US1] Crear la página de listado (Server Component) en `src/app/(app)/categories/page.tsx` leyendo vía `api.category.list` (RSC, `FRONTEND.md` §6.1)
- [X] T020 [US1] Crear `loading.tsx` (skeleton) y `error.tsx` (error boundary) en `src/app/(app)/categories/` (`FRONTEND.md` §6.3)
- [X] T021 [US1] Crear el formulario de creación (Client Component) en `src/app/(app)/categories/new/form.tsx` con React Hook Form + Zod (reutilizando el schema) y mostrando errores por campo (`FRONTEND.md` §5.3)

**Checkpoint**: En este punto, la User Story 1 debería ser totalmente funcional y testeable de forma independiente (equivalente al MVP).

---

## Phase 4: User Story 2 - Patrón reutilizable y documentado (Priority: P1)

**Goal**: Documentar explícitamente la estructura de carpetas, convenciones y puntos de extensión para que un nuevo desarrollo pueda replicar el patrón sin ambigüedad.

**Independent Test**: Una persona puede localizar, para cada capa (interfaz, API, lógica, datos, validación, testing), el fichero de ejemplo correspondiente y seguir la documentación para añadir una nueva entidad mínima.

### Implementation for User Story 2

> No se requieren tests nuevos para esta story (es documental); se valida contra los artefactos ya generados.

- [X] T022 [US2] Crear `README.md` en la raíz del repositorio documentando estructura de carpetas, convenciones de nombrado y el mapa capa→fichero del scaffold
- [X] T023 [US2] Documentar en `src/server/api/trpc.ts` (o README) los procedimientos base preparados (`authedProcedure`, `verifiedProcedure`, `adminProcedure`) como puntos de extensión no cableados (`BACKEND.md` §4.1, `research.md` R6)
- [X] T024 [US2] Añadir un ejemplo comentado "cómo añadir una nueva entidad" en la documentación, listando los artefactos a replicar (tabla de puntos de extensión de `quickstart.md`)

**Checkpoint**: Las User Stories 1 Y 2 funcionan y documentan el patrón de forma independiente.

---

## Phase 5: User Story 3 - Utilidades de prueba locales (Priority: P2)

**Goal**: Pruebas unitarias e integración ejecutables con comandos simples y deterministas, sin infraestructura externa ni credenciales.

**Independent Test**: `pnpm test` y `pnpm test:integration` finalizan en verde de forma reproducible, y un cambio en la lógica de negocio hace fallar algún test.

### Tests for User Story 3 ⚠️

- [X] T025 [P] [US3] Añadir casos límite al unitario (`slug` mal formado, `name` con longitud máxima, `showInNav` por defecto) en `tests/unit/category.service.test.ts`
- [X] T026 [P] [US3] Añadir caso de conflicto (slug duplicado → 409) y de padre inexistente (404) al test de integración en `tests/integration/category.router.test.ts`

### Implementation for User Story 3

- [X] T027 [US3] Configurar el runner de tests (Vitest) con scripts `test` (unitarios) y `test:integration` (Testcontainers) en `package.json`
- [X] T028 [US3] Configurar Testcontainers (PostgreSQL) y fixtures/factories mínimos para integración (`tests/integration/` setup) (`TESTING.md` §4.4)
- [X] T029 [US3] Verificar que la semilla y las suites son deterministas (sin dependencia de tiempo/red/orden) conforme a `TESTING.md` §9

**Checkpoint**: Las tres user stories quedan funcionales; el scaffold es una plantilla completa con pruebas reproducibles.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras transversales que afectan a varias user stories.

- [X] T030 [P] Validar el flujo completo descrito en `quickstart.md` (arranque, listado, creación, conflicto, suites verdes) y corregir desviaciones
- [X] T031 [P] Verificar cumplimiento de la Constitution Check de `plan.md` (sin `any`, Zod en borde, errores de dominio, auditoría, tokens del tema) y documentar cualquier desviación
- [X] T032 [P] Añadir headers de seguridad y validación de entorno en `next.config.js` conforme a `SECURITY.md` §5.3 (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede comenzar de inmediato.
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las user stories.
- **User Stories (Phase 3+)**: Dependen de completar Foundational.
  - US1 y US2 comparten prioridad P1; US3 es P2.
  - Pueden avanzar en paralelo (si hay capacidad) o en orden de prioridad.
- **Polish (Phase Final)**: Depende de las user stories deseadas completas.

### User Story Dependencies

- **User Story 1 (P1)**: Comienza tras Foundational. Sin dependencias de otras stories. 🎯 MVP
- **User Story 2 (P1)**: Tras Foundational. Es documental; se apoya en los artefactos de US1 pero es independientemente testeable.
- **User Story 3 (P2)**: Tras Foundational; amplía las suites de US1 con casos límite e integración.

### Within Each User Story

- Tests (cuando se incluyen) se escriben PRIMERO y deben FALLAR antes de implementar.
- Servicio antes que router; router antes que UI; core antes que integración.
- Story completa antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- T002, T003, T004, T005 (Setup) en paralelo.
- T008, T009, T010, T012, T013 (Foundational) en paralelo.
- T014 y T015 (tests de US1) en paralelo.
- T025 y T026 (tests de US3) en paralelo.
- T030, T031, T032 (Polish) en paralelo.

---

## Parallel Example: User Story 1

```bash
# Tests de US1 juntos (escribir primero, deben fallar):
Task: "Test unitario ... tests/unit/category.service.test.ts"
Task: "Test de integración ... tests/integration/category.router.test.ts"

# Componentes de UI de US1 (página, loading, error, formulario — ficheros distintos):
Task: "Crear la página de listado ... page.tsx"
Task: "Crear loading.tsx y error.tsx ..."
Task: "Crear el formulario ... new/form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (CRÍTICA — bloquea todas las stories).
3. Completar Phase 3: User Story 1.
4. **PARAR y VALIDAR**: testear US1 de forma independiente.
5. Desplegar/demostrar si está listo.

### Incremental Delivery

1. Setup + Foundational → Fundación lista.
2. User Story 1 → test independiente → MVP (aplicación ejecutable end-to-end).
3. User Story 2 → documentación del patrón → guía para el resto de desarrollos.
4. User Story 3 → suites reproducibles → facilidades de prueba.
5. Cada story añade valor sin romper las anteriores.

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational juntos.
2. Una vez lista la fundación:
   - Developer A: User Story 1 (esqueleto ejecutable).
   - Developer B: User Story 2 (documentación del patrón).
   - Developer C: User Story 3 (suites de prueba).
3. Las stories se completan e integran de forma independiente.

---

## Notes

- Las tareas [P] implican ficheros distintos y sin dependencias.
- La etiqueta [Story] mapea cada tarea a su user story para trazabilidad.
- Cada user story debe ser completable y testeable de forma independiente.
- Verificar que los tests fallan antes de implementar.
- Commitear tras cada tarea o grupo lógico.
- Parar en cada checkpoint para validar la story de forma independiente.
- Evitar: tareas vagas, conflictos en el mismo fichero, dependencias entre stories que rompan la independencia.