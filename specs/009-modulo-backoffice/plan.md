# Implementation Plan: Módulo Administrativo (Backoffice)

**Branch**: `009-modulo-backoffice` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-modulo-backoffice/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

La primera entrega habilita TOTP RFC 6238, QR, RBAC `ADMIN`/`MODERATOR`, gestión de usuarios/KYC y moderación de reviews del Módulo 006. Todas las acciones administrativas se registran en `AdminAuditLog` mediante middleware/helper de tRPC. Listings, disputas, analytics, categorías y CMS/FAQ quedan fuera del MVP.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.6, Node.js según configuración existente

**Primary Dependencies**: Next.js 14 App Router, React 18, tRPC 11, Prisma 5, PostgreSQL, Zod, Vitest, Playwright; añadir `otplib` y `qrcode` según `research.md`

**Storage**: PostgreSQL mediante Prisma; secretos TOTP cifrados en reposo; `AdminAuditLog` append-only

**Testing**: Vitest unitario/integración con PostgreSQL/Testcontainers; Playwright; `npm run lint`, `npm run build`

**Target Platform**: Aplicación web Next.js desplegada en servidor Node.js

**Project Type**: Aplicación web full-stack con API tRPC y panel administrativo App Router

**Performance Goals**: p95 inferior a 800 ms en 100 consultas/decisiones administrativas válidas bajo condiciones representativas

**Constraints**: No exponer secretos TOTP, hashes, documentos KYC ni tokens; Zod en inputs; autorización por procedimiento y recurso; operaciones multi-entidad transaccionales

**Scale/Scope**: MVP interno con roles `ADMIN`/`MODERATOR`, Auth 2FA, usuarios, KYC, moderación de reviews y auditoría transversal; listings, disputas, analytics, categorías y CMS/FAQ quedan diferidos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 gate: PASS

| Gate | Verificación |
|---|---|
| Fuente de verdad | Se reutilizan entidades existentes y PostgreSQL/Prisma como estado duradero. |
| Seguridad | TOTP, RBAC, autorización por recurso, mínimo privilegio y protección KYC. |
| Backend | Inputs Zod, routers delgados, servicios separados y errores de dominio. |
| Datos | IDs `cuid`, timestamptz, índices, migraciones revisables y auditoría. |
| Frontend | App Router, Server Components, tRPC/React Query, loading/error y a11y. |
| Testing | Unitarios, integración PostgreSQL y E2E para flujos críticos. |

No se detectan violaciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/009-modulo-backoffice/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
development/
├── prisma/schema.prisma
├── prisma/migrations/<timestamp>_admin_backoffice/
├── src/app/admin/{page.tsx,loading.tsx,error.tsx,setup-2fa/page.tsx}
├── src/features/admin/{application,domain,infrastructure,presentation,shared}
├── src/server/api/routers/admin.router.ts
├── src/server/api/trpc.ts
├── src/middleware.ts
└── tests/{unit,integration,e2e}/admin
```

**Structure Decision**: Aplicación existente en `development/`; el dominio administrativo vive en `features/admin`, con router dedicado integrado en `server/api/root.ts`. No se crea una segunda aplicación.

## Development Phases

### Fase 1 — Auth 2FA y RBAC

1. Introducir roles `ADMIN` y `MODERATOR` en el modelo y contexto de sesión sin aceptar roles del cliente.
2. Añadir credencial TOTP cifrada, setup QR, confirmación RFC 6238, rate limiting y revocación protegida.
3. Proteger `/admin` con middleware de sesión y autorización de rol en servidor; añadir estados loading/error y pruebas.

### Fase 2 — Usuarios y KYC

1. Reutilizar `IdentityVerification` como solicitud KYC y añadir campos administrativos mínimos para decisión, motivo y trazabilidad.
2. Crear consultas paginadas con proyecciones sin secretos/documentos no autorizados.
3. Implementar decisiones KYC transaccionales, notificación existente, auditoría y tests de permisos, privacidad, concurrencia e idempotencia.

### Fase 3 — Moderación de Reviews

1. Reutilizar `Review`/`ReviewReport` y sus estados del Módulo 006.
2. Exponer reportes abiertos y resolución `published`/`removed` con motivo obligatorio.
3. Integrar el panel en `/admin`, preservar autorización y cubrir doble resolución, conflictos y regresiones públicas.

### Fase 4 — Auditoría y Middleware

1. Crear `AdminAuditLog` append-only con actor, procedimiento, recurso, resultado, motivo, requestId acotado y timestamp.
2. Crear middleware/helper tRPC para registrar éxito, denegación, validación y error sin secretos.
3. Hacer atómicas las mutaciones de dominio y su auditoría cuando aplique; añadir consulta protegida y pruebas de inmutabilidad.

## Phase 0 — Research Output

Decisiones sobre `otplib`, `qrcode`, middleware tRPC, entidades existentes, roles y cifrado: [research.md](./research.md).

## Phase 1 — Design Output

- [data-model.md](./data-model.md)
- [contracts/admin-router.md](./contracts/admin-router.md)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check: PASS

| Principio | Evidencia |
|---|---|
| Seguridad por diseño | TOTP cifrado, RBAC, autorización de recurso y auditoría. |
| Lógica aislada | Router delgado y servicios administrativos separados. |
| Transaccionalidad | Decisiones KYC/review y auditoría atómicas. |
| Integridad | Estados, relaciones, constraints e índices en Prisma/PostgreSQL. |
| Observabilidad | `AdminAuditLog`, `SecurityEvent`, requestId sin secretos. |
| Frontend | App Router server-first, tRPC, loading/error y a11y. |
| Testing | Unit, integración PostgreSQL y E2E Playwright. |

No se requieren entradas en Complexity Tracking.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
