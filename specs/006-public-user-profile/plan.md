# Implementation Plan: Vista Pública del Perfil de Usuario

**Branch**: `006-public-user-profile` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-public-user-profile/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implementar la vista pública `/users/[id]` como Server Component de Next.js 14, con componentes React presentacionales en `development/src/components/profile/`. La página consumirá una proyección pública de `User` mediante Prisma, mostrará cabecera y badges derivados, ubicación aproximada con Leaflet/OpenStreetMap, listings activos mediante un `ListingCard` público reutilizable y reseñas públicas cuando el dominio de reviews esté disponible. La respuesta no expondrá datos privados ni controles de edición.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14 App Router

**Primary Dependencies**: React 18, Prisma 5.20, PostgreSQL 15/PostGIS, Leaflet 1.9, react-leaflet 4.2, tRPC existente, Tailwind/CSS del proyecto, Vitest

**Storage**: PostgreSQL mediante Prisma; reutiliza `User`, `Listing`, `ListingPhoto` y `VerificationState`. `Review` queda como dependencia futura/proyección opcional porque no existe en el schema actual.

**Testing**: Vitest para mapeos y reglas públicas; integración Prisma/PostgreSQL para filtros y privacidad; Playwright/axe cuando la infraestructura E2E esté disponible

**Target Platform**: Web responsive en navegadores modernos, servidor Next.js y cliente Leaflet solo para el mapa

**Project Type**: Web application pública/server-first

**Performance Goals**: Perfil público completo <2 s para el 95% de cargas normales; una lectura pública con proyección explícita y listings limitados; mapa no bloquea el render inicial

**Constraints**: Sin sesión; no email/teléfono/dirección exacta/KYC; radio aproximado de 750 m; no edición; datos derivados exclusivamente en servidor; compatibilidad con usuarios sin reviews o listings

**Scale/Scope**: Una ruta dinámica, cinco componentes solicitados, una proyección pública, una consulta de listings, mapa aproximado y sección de reseñas con estado vacío/contrato futuro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **PASS — Gobernanza por dominio**: se aplican BACKEND, DATABASE, FRONTEND, DESIGN, SECURITY y TESTING.
- **PASS — Server-first**: Prisma y la proyección pública se ejecutan en servidor; Leaflet queda encapsulado en `UserProfileLocationMap` como componente cliente.
- **PASS — Seguridad por diseño**: `select` explícito, filtros de usuario activo/listings publicados, ubicación aproximada y ausencia de campos privados.
- **PASS — Reglas verificables**: badges, radio de mapa, estados vacíos, orden de reseñas y 404 tienen criterios observables.
- **PASS — Testing**: unitarios para mapeo/badges y tests de integración para consulta pública, filtros y exclusión de datos.

No hay violaciones constitucionales que requieran Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-public-user-profile/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
development/src/app/users/[id]/
├── page.tsx
├── loading.tsx
├── error.tsx
└── not-found.tsx

development/src/components/profile/
├── UserProfileHeader.tsx
├── UserProfileBadges.tsx
├── UserProfileLocationMap.tsx
├── UserProfileListings.tsx
├── UserProfileReviews.tsx
└── ListingCard.tsx

development/src/features/users/
├── application/user.service.ts
├── domain/public-user-profile.ts
├── infrastructure/user.repository.ts
└── shared/public-user-profile.schema.ts

development/src/server/api/routers/user-profile.router.ts
development/tests/unit/user-profile/
development/tests/integration/user-profile/
```

**Structure Decision**: La ruta pública vive en `src/app/users/[id]` como fachada fina. Los cinco componentes solicitados viven en `src/components/profile/` para poder reutilizarse desde otras superficies públicas. La lectura y mapeo están en `features/users`, con repositorio Prisma y proyección explícita. `UserProfileLocationMap` reutiliza la integración dinámica Leaflet existente (`MapView`/`PreferredLocationMap`) y no se renderiza en servidor. Como no existe `ListingCard` literal, se crea un componente público pequeño que consume el DTO de listing y reutiliza estilos/contrato de `ResultCard` sin acoplar la página a la búsqueda.

## Post-Design Constitution Check

- **PASS** — El diseño conserva separación de responsabilidades: ruta fina, componentes de UI, servicio de aplicación y repositorio Prisma.
- **PASS** — La privacidad se aplica mediante proyección explícita, filtros de visibilidad y zona de mapa aproximada.
- **PASS** — Leaflet se limita al componente cliente; la consulta y los datos sensibles permanecen en servidor.
- **PASS** — La ausencia del modelo Review se trata como dependencia opcional con estado vacío, sin inventar datos.
- **PASS** — La validación propuesta cubre unidad, integración, seguridad, accesibilidad y flujo público.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | No se identifican violaciones constitucionales. |
