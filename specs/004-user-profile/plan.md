# Implementation Plan: Módulo de Perfil de Usuario

**Branch**: `004-user-profile` | **Date**: 2026-09-16 | **Spec**: [spec.md](spec.md)

## Summary

Implementar el perfil público `/users/[id]` y el formulario privado `/profile`, reutilizando `User`, autenticación/sesiones, Prisma, tRPC y Next.js App Router. Se añadirá `preferredLocation` como campo nullable y se calcularán los badges en servidor.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router

**Primary Dependencies**: tRPC 11, Prisma 5.20, PostgreSQL 15, Zod 3.23, React Hook Form 7, Vitest 2, Testcontainers

**Storage**: PostgreSQL mediante Prisma; migración nullable para `User.preferredLocation`

**Testing**: Vitest unitario, integración con PostgreSQL/Testcontainers, Playwright/axe para UI cuando esté configurado

**Target Platform**: Web moderna, servidor Next.js y navegadores desktop/móvil

**Project Type**: Web application

**Performance Goals**: Lectura de perfil con listings activos <500ms p95 en condiciones normales; actualización confirmada en una petición

**Constraints**: No exponer datos privados; autorización en middleware y servidor; server-first; no duplicar fuentes de verdad para badges

**Scale/Scope**: Dos rutas, una proyección pública, una mutación protegida, una migración y pruebas unitarias/integración

## Constitution Check

- **PASS** — Se consultan los documentos de dominio aplicables en `constitution/` y se documentan decisiones.
- **PASS** — Server-first: lecturas/escrituras y datos sensibles permanecen en servidor; Client Components solo para interacción del formulario.
- **PASS** — Seguridad por diseño: sesión del servidor, autorización por identidad y minimización de datos públicos.
- **PASS** — Prisma/PostgreSQL: migración nullable, constraints explícitos y sin duplicar estados derivados.
- **PASS** — Testing: unitarios para lógica y integración real para routers, autorización y persistencia.

No hay violaciones que requieran Complexity Tracking.

## Project Structure

```text
specs/004-user-profile/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/profile-ui.md

development/src/
├── app/(public)/users/[id]/page.tsx
├── app/(app)/profile/page.tsx
├── features/user-profile/
│   ├── application/user-profile.service.ts
│   ├── shared/user-profile.schema.ts
│   └── presentation/
├── server/api/routers/user-profile.router.ts
└── middleware.ts

development/prisma/
└── schema.prisma

development/tests/
├── unit/user-profile/
└── integration/user-profile/
```

**Structure Decision**: Seguir la arquitectura feature-based existente bajo `development/src`, con tRPC delgado, servicio de aplicación para reglas de perfil y componentes de ruta server-first.

## Phase 0 / Phase 1 Deliverables

- Phase 0: decisiones de modelo, autorización, badges y testing en [research.md](research.md).
- Phase 1: entidades y validaciones en [data-model.md](data-model.md), contrato de UI en [contracts/profile-ui.md](contracts/profile-ui.md) y guía ejecutable en [quickstart.md](quickstart.md).

## Post-Design Constitution Check

**PASS** — El diseño mantiene las cinco obligaciones: fuente normativa por dominio, separación por capas, reglas verificables, responsabilidad explícita y pruebas de cumplimiento. La ubicación preferida queda privada por defecto y los badges continúan siendo derivados del servidor.