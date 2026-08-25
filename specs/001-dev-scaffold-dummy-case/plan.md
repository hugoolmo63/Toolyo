# Implementation Plan: Caso Dummy de Desarrollo (Scaffold de Referencia)

**Branch**: `001-dev-scaffold-dummy-case` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dev-scaffold-dummy-case/spec.md`

**Note**: Este plan lo genera `/speckit-plan`; su definición describe el flujo de ejecución.

## Summary

Crear un **scaffold de desarrollo de referencia** que atraviese todas las capas de la arquitectura (interfaz → API → lógica de negocio → datos) mediante una única **entidad de ejemplo mínima y representativa** del dominio. El valor del caso no es la funcionalidad, sino establecer las facilidades de desarrollo (estructura de carpetas conforme a la constitución, validación en borde, jerarquía de errores, auditoría, seed, utilidades de prueba unitarias e integración y una guía de arranque) que servirán de plantilla viva para el resto de desarrollos.

**Entidad de ejemplo elegida**: `Category` (Categoría). Es la entidad más simple y autocontenida del modelo de datos (`docs/03-arquitectura-y-tech-stack.md`), y demuestra de forma limpia: creación/lectura con validación, campo único (`slug`), auto-referencia (`parentId`), una marca de estado (`showInNav`), y campos de auditoría — todo sin arrastrar cadenas complejas de claves foráneas ni lógica de negocio que, en este caso, solo añadiría ruido.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 20+ LTS

**Primary Dependencies**: Next.js 14+ (App Router), tRPC, Prisma, Zod, Tailwind CSS + shadcn/ui (base visual del tema `profesional-seguro`)

**Storage**: PostgreSQL (local/efímera para desarrollo diario)

**Testing**: Vitest (unitarios + integración), Testcontainers para integración con DB real

**Target Platform**: Web (navegador), desarrollo y prueba en local

**Project Type**: Web application (full-stack, monolito Next.js con tRPC)

**Performance Goals**: No aplica como objetivo crítico (caso dummy); se exige únicamente arranque y pruebas deterministas y rápidas (< 100 ms por test unitario, < 2 s por suite de integración — conforme `TESTING.md`)

**Constraints**: Sin credenciales ni servicios externos en el día a día; base de datos local/efímera; validación estricta en borde; sin exposición de detalles internos a cliente

**Scale/Scope**: 1 entidad, 1 pantalla mínima, 1 flujo de extremo a extremo, pruebas unitarias + integración

## Constitution Check

*GATE: Debe pasar antes de la investigación de Fase 0. Se revalida tras el diseño de Fase 1.*

| Norma (documento) | Requisito | Cumplimiento previsto |
|-------------------|-----------|----------------------|
| `BACKEND.md` §3.1 | TS `strict`, sin `any`, retornos explícitos en servicios | ✅ Tipado estricto; servicio con retorno explícito |
| `BACKEND.md` §2.1 | `server/api/routers`, `server/services`, `server/db`, `lib/validations`, `lib/errors` | ✅ Estructura replicada |
| `BACKEND.md` §5 | Zod como única fuente de validación, compartido front/back en `lib/validations` | ✅ Esquema compartido |
| `BACKEND.md` §9 | Jerarquía de errores de dominio (`AppError`, `ValidationError`, `NotFoundError`…) sin leaks | ✅ Clases de error + mapping en router |
| `BACKEND.md` §10.4 | Validación de env al arranque, fallo explícito si falta variable crítica | ✅ Validación de entorno |
| `DATABASE.md` §7.2 | Auditoría `createdAt`, `updatedAt` | ✅ En entidad `Category` |
| `DATABASE.md` §3.1 | `id` String con `cuid()`/`uuid()` | ✅ `@id @default(cuid())` |
| `DATABASE.md` §3.4 | `slug` único, kebab-case, inmutable | ✅ Constraint `@unique` |
| `DATABASE.md` §2.2 | Nombres de modelo PascalCase singular, campos camelCase | ✅ `Category` |
| `FRONTEND.md` §1 | Server-first, tRPC + React Query, no re-declarar contratos | ✅ RSC + `api.*.useQuery` |
| `FRONTEND.md` §3.1 | Sin `any`, union types sobre enums | ✅ Union types |
| `TESTING.md` §2 | Pirámide: unitarios + integración | ✅ Unitario + integración; E2E omitido (fuera del alcance del dummy) |
| `TESTING.md` §6 | Seed script `prisma/seed.ts` | ✅ Seed mínimo y determinista |
| `SECURITY.md` §5.1 | Validación de inputs con Zod | ✅ Reutilizada en router |

**Resultado**: Sin violaciones. El caso dummy se alinea con la constitución sin desviaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

La estructura sigue la organización dictada por `constitution/BACKEND.md` §2 y `constitution/FRONTEND.md` §2, en un monolito Next.js (App Router) con tRPC:

```text
src/
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   └── category.router.ts      # Router tRPC del dominio de ejemplo
│   │   ├── root.ts                     # App router (merge de routers)
│   │   └── trpc.ts                     # Context, middlewares, procedimientos base
│   ├── db/
│   │   └── client.ts                   # Cliente Prisma + utilidades tipadas
│   ├── services/
│   │   └── category.service.ts         # Lógica de negocio pura del caso dummy
│   └── lib/
│       ├── validations/
│       │   └── category.schema.ts      # Zod schema compartido front/back
│       └── errors/
│           └── domain-errors.ts        # AppError, ValidationError, NotFoundError…
├── app/
│   └── (app)/
│       └── categories/
│           ├── page.tsx                # Server Component: listado + lectura vía tRPC
│           ├── loading.tsx             # Skeleton (ruta dinámica)
│           ├── error.tsx               # Error boundary de ruta
│           └── new/
│               └── form.tsx            # Client Component: formulario de creación
├── components/ui/                      # Base shadcn/ui (tema profesional-seguro)
├── lib/
│   ├── trpc.ts                         # Cliente tRPC (server + client)
│   └── utils.ts                        # Helpers puros
├── providers/
│   └── app-providers.tsx               # Compose de contextos del cliente
├── styles/
│   └── globals.css                     # Tailwind + tokens del tema profesional-seguro
└── env.mjs                             # Validación Zod de variables de entorno

prisma/
├── schema.prisma                       # Modelo Category + auditoría
└── seed.ts                             # Semilla mínima y determinista

tests/
├── unit/
│   └── category.service.test.ts        # Unitarios (Vitest, lógica pura)
└── integration/
    └── category.router.test.ts         # Integración (tRPC + DB real)
```

**Structure Decision**: Opción "Web application (monolito Next.js)". Se usa un único proyecto full-stack (no repos separados front/back) porque tRPC integra tipo-safely el cliente y el servidor dentro del mismo árbol, tal y como describen los documentos de arquitectura y constitución. El layout replica exactamente las rutas de `BACKEND.md`/`FRONTEND.md` para que sirva de plantilla.

## Complexity Tracking

Sin violaciones constitucionales que justificar. (Casilla rellenada solo si existieran violaciones a documentar.)
