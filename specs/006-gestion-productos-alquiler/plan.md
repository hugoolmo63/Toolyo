# Implementation Plan: Gestión de productos para alquiler

**Branch**: `006-gestion-productos-alquiler` | **Date**: 2026-09-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-gestion-productos-alquiler/spec.md`

## Summary

Implementar un panel privado para que un usuario identificado consulte y gestione sus productos de alquiler. La feature reutilizará `Listing` como entidad de producto y añadirá operaciones privadas para listar, consultar, crear como borrador o publicar, editar, publicar y retirar mediante soft delete. La autorización se realizará en dos capas: procedimiento tRPC autenticado y ownership dentro del servicio/repositorio. El formulario compartirá schemas Zod con el backend, las mutaciones serán transaccionales cuando afecten a listing y fotos, y la interfaz invalidará las consultas del panel después de cada mutación.

El schema actual ya contiene los campos necesarios en `Listing`, `ListingPhoto`, `Category` y `User`; no se prevé una migración para el MVP. La comprobación de solicitudes o alquileres activos quedará encapsulada como dependencia del módulo de reservas, que todavía no existe en el schema actual; hasta que ese módulo esté disponible, la retirada deberá preservar el punto de extensión y no inventar datos de reservas.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router

**Primary Dependencies**: tRPC 11, React Query 5, Prisma 5.20, Zod 3.23, React Hook Form 7, Tailwind CSS 3.4, Vitest 2, Playwright, axe-core. No se añade una dependencia nueva.

**Storage**: PostgreSQL 15 mediante Prisma. Se reutilizan `Listing`, `ListingPhoto`, `ListingAvailability`, `Category` y `User`; el soft delete usa `Listing.deletedAt`. No se crea una tabla nueva en el MVP.

**Testing**: Vitest para schemas, reglas de dominio y servicios; Vitest + PostgreSQL efímero/Testcontainers para routers y ownership; Playwright para login → panel → creación/edición/retirada; axe-core para accesibilidad.

**Target Platform**: Aplicación web responsive en navegadores modernos, con Next.js App Router y renderizado server-first.

**Project Type**: Aplicación web full-stack con frontend Next.js, API tRPC y persistencia Prisma/PostgreSQL.

**Performance Goals**: La primera página del panel debe estar disponible para el usuario en menos de 1 segundo en condiciones normales; las consultas paginadas del panel deben responder en menos de 500 ms p95; una mutación confirmada debe reflejarse en la lista en menos de 5 segundos; la validación de formularios debe ofrecer feedback inmediato.

**Constraints**: Todas las operaciones privadas requieren sesión válida y ownership del recurso. Inputs validados con Zod. No acceso del navegador a Prisma/PostgreSQL. Dinero en `Decimal` EUR. Soft delete y auditoría obligatorios. No exponer datos privados de otros usuarios. Interfaz accesible WCAG 2.1 AA, teclado, foco visible y tokens `profesional-seguro`. No introducir proveedor de imágenes ni módulo de reservas en esta feature.

**Scale/Scope**: Una ruta privada `/dashboard/products` con listado paginado, estado vacío y filtros básicos; una vista/formulario de creación y edición; un router tRPC privado con `listMine`, `getMine`, `create`, `update`, `publish` y `remove`; una capa de servicio y repositorio de listing management; schemas compartidos; tests unitarios, integración y E2E. Se reutiliza el modelo existente y no se crea `tasks.md` en esta fase.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Documento | Gate | Estado |
|---|---|---|
| `BACKEND.md` §1, §4, §6 | Router privado con `authedProcedure`, inputs Zod, servicio separado y ownership comprobado dentro del recurso | ✅ PASS |
| `BACKEND.md` §1.4, `DATABASE.md` §6 | Crear/editar listing y fotos relacionadas dentro de transacciones; revisar cualquier migración antes de aplicarla | ✅ PASS |
| `BACKEND.md` §1.6, `SECURITY.md` §1.6 | El navegador solo consume tRPC/Server Components; nunca accede directamente a Prisma/PostgreSQL | ✅ PASS |
| `BACKEND.md` §7.1, `DATABASE.md` §7 | Retirada mediante `deletedAt`, filtros por defecto y conservación de auditoría; no borrado físico | ✅ PASS |
| `DATABASE.md` §3.3 | `pricePerDay` se mantiene como `Decimal(19,4)` en EUR; no se usa `Float` | ✅ PASS |
| `DATABASE.md` §5.2 | La consulta por propietario aprovecha `@@index([ownerId, status])`; paginación y orden estable | ✅ PASS |
| `SECURITY.md` §3 | Sesión para autorización de endpoint + ownership para autorización de recurso; fail secure para sesión ausente | ✅ PASS |
| `SECURITY.md` §5 | Límites, formatos, contenido y URLs de imagen se validan con Zod; mutaciones sensibles aplican rate limiting | ✅ PASS |
| `FRONTEND.md` §1, §5 | Server Components por defecto, React Query/tRPC para estado de servidor e invalidación tras mutación | ✅ PASS |
| `FRONTEND.md` §5.3, §8 | Formularios de varios campos con React Hook Form + Zod, labels explícitos, foco visible y diálogos accesibles | ✅ PASS |
| `FRONTEND.md` §7, `DESIGN.md` | UI responsive mobile-first, Tailwind y tokens `--ps-*`; sin colores hardcodeados | ✅ PASS |
| `TESTING.md` §2 | Pirámide de unitarios, integración con DB real y pocos E2E para los flujos críticos | ✅ PASS |

No hay violaciones conocidas que requieran una entrada en Complexity Tracking.

## Phase 0: Research Summary

La investigación está documentada en [research.md](research.md). Decisiones resueltas:

1. Reutilizar `Listing` en vez de crear una entidad de producto duplicada.
2. Separar la superficie privada en `listingManagement` y protegerla con `authedProcedure` + ownership.
3. Usar `draft`/`published` y `deletedAt` para el ciclo de publicación y retirada.
4. Reutilizar `ListingPhoto` y no introducir un proveedor de almacenamiento no solicitado.
5. Compartir validación Zod y mantener dinero como Decimal.
6. Encapsular la comprobación de compromisos activos como dependencia del módulo de reservas.
7. Paginar y filtrar el panel para evitar cargar inventarios completos.
8. Aplicar la pirámide de testing definida por el proyecto.

## Phase 1: Design

### Data model

[data-model.md](data-model.md) define las entidades existentes, invariantes, validaciones y transiciones. El diseño no añade tablas ni columnas: `Listing.deletedAt` satisface la retirada lógica; `ListingPhoto` satisface la gestión de imágenes; los índices existentes cubren ownership y estados.

La creación de listing y fotos, la actualización con reemplazo de fotos, la publicación y la retirada se ejecutan como unidades transaccionales. La retirada no elimina físicamente datos y debe consultar el adaptador de compromisos antes de cambiar el estado lógico.

### Contracts

El contrato tRPC está en [contracts/listing-management.md](contracts/listing-management.md). El router `listingManagement` tendrá:

- `listMine` para panel paginado y filtros.
- `getMine` para consulta privada completa.
- `create` para borrador o publicación inicial.
- `update` para datos y fotos del propietario.
- `publish` para transición validada a publicado o revisión.
- `remove` para retirada confirmada e idempotente.

Los errores se mapean a `UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT` y `TOO_MANY_REQUESTS` sin filtrar detalles internos.

### Quickstart

[quickstart.md](quickstart.md) contiene los comandos y escenarios para validar autenticación, CRUD, ownership, retirada segura, estados vacíos y accesibilidad.

## Project Structure

### Documentation (this feature)

```text
specs/006-gestion-productos-alquiler/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── listing-management.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2, generado por /speckit-tasks
```

### Source Code (repository root)

```text
development/
├── prisma/
│   └── schema.prisma                         # sin cambios previstos; reutiliza Listing y ListingPhoto
├── src/
│   ├── app/
│   │   └── (app)/
│   │       └── dashboard/
│   │           └── products/
│   │               ├── page.tsx              # panel privado, Server Component
│   │               ├── loading.tsx            # skeleton del panel
│   │               ├── error.tsx              # error boundary
│   │               ├── new/page.tsx           # formulario de creación
│   │               └── [listingId]/
│   │                   ├── page.tsx           # consulta privada
│   │                   └── edit/page.tsx      # edición
│   ├── features/
│   │   └── listing-management/
│   │       ├── application/
│   │       │   └── listing-management.service.ts
│   │       ├── domain/
│   │       │   ├── listing-management.ts     # DTOs y estados de transición
│   │       │   └── listing-management.errors.ts
│   │       ├── infrastructure/
│   │       │   └── listing-management.repository.ts
│   │       ├── presentation/
│   │       │   ├── listing-management-panel.tsx
│   │       │   ├── listing-card.tsx
│   │       │   ├── listing-form.tsx
│   │       │   ├── listing-status-badge.tsx
│   │       │   ├── listing-delete-dialog.tsx
│   │       │   └── listing-empty-state.tsx
│   │       └── shared/
│   │           └── listing-management.schema.ts # schemas Zod compartidos
│   ├── server/
│   │   └── api/
│   │       ├── routers/
│   │       │   └── listing-management.router.ts
│   │       └── root.ts                         # registrar listingManagementRouter
│   └── lib/
│       └── validations/
│           └── listing-management.ts          # re-export compartido si aplica
└── tests/
    ├── unit/
    │   └── listing-management/
    │       ├── listing-management.schema.test.ts
    │       ├── listing-management.service.test.ts
    │       └── listing-management.transitions.test.ts
    ├── integration/
    │   └── listing-management/
    │       └── listing-management.router.integration.test.ts
    └── e2e/
        └── listing-management/
            └── listing-management.spec.ts
```

**Structure Decision**: Se mantiene la estructura feature-based existente bajo `development/src/features`, con routers tRPC delgados bajo `src/server/api/routers` y rutas privadas bajo `src/app/(app)/dashboard`. La página del panel y las vistas iniciales serán Server Components; el formulario, filtros, diálogo de retirada y feedback de mutaciones serán Client Components únicamente por interactividad. El acceso al servidor usará `createServerApi` y el cliente tRPC/React Query existente.

## Implementation Sequence

1. Definir schemas Zod, DTOs, errores de dominio y transición de estados.
2. Implementar repository con queries por `ownerId`, filtros de soft delete, paginación y mapeos explícitos.
3. Implementar servicio con ownership, validación de categoría, transacciones, idempotencia y punto de comprobación de compromisos.
4. Implementar router `listingManagement`, registrarlo en `root.ts`, aplicar rate limiting y logging estructurado.
5. Crear panel, formulario, estados de carga/error/vacío, consulta/edición y diálogo de retirada siguiendo tokens y accesibilidad.
6. Añadir pruebas unitarias e integración; después cubrir los flujos E2E críticos.
7. Ejecutar los comandos de quickstart, revisar migraciones (si la implementación descubre alguna necesidad), lint, build y pruebas.

## Post-Design Constitution Check

| Área | Verificación posterior al diseño | Estado |
|---|---|---|
| Autenticación/autorización | Todas las operaciones privadas usan `authedProcedure` y filtran por `ctx.session.userId`; recurso ajeno se presenta como `NOT_FOUND` | ✅ PASS |
| Datos y privacidad | Los DTOs privados contienen solo datos del listing propio; las respuestas públicas existentes siguen filtrando `published` y `deletedAt IS NULL` | ✅ PASS |
| Persistencia | No se añade modelo duplicado; soft delete, auditoría, constraints e índices existentes se respetan | ✅ PASS |
| Transacciones | Crear/editar fotos y retirar/publicar se diseñan como operaciones atómicas | ✅ PASS |
| Frontend | Server-first, formularios RHF + Zod, invalidación React Query, responsive y tokens `profesional-seguro` | ✅ PASS |
| Accesibilidad | Labels, foco visible, teclado, confirmación accesible, estados de carga/error/vacío y axe-core | ✅ PASS |
| Testing | Unitarios para reglas, integración con PostgreSQL real y E2E de los flujos críticos | ✅ PASS |
| Complejidad | No hay violaciones que deban justificarse; la dependencia futura de reservas está aislada y documentada | ✅ PASS |

## Complexity Tracking

> No hay violaciones de la constitución que requieran justificación.
