# Implementation Plan: Reviews y Reputación

**Branch**: `006-modulo-reviews` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Especificación funcional de reviews bidireccionales post-alquiler, doble ciego, reputación agregada y moderación.
## Summary

Implementar reviews bidireccionales vinculadas a reservas `completed`, con ventana de 14 días, publicación doble ciega, agregados públicos y moderación de reportes. Si solo una parte envía review, se publica al vencer la ventana y participa en agregados.

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router.

**Primary Dependencies**: Prisma 5.20, PostgreSQL 15, tRPC 11, Zod 3.23, React Query 5, Vitest, Testcontainers/PostgreSQL y Playwright.

**Storage**: PostgreSQL para reviews, categorías, reportes, estados de publicación y agregados.

**Testing**: Unitarios para elegibilidad, ventana, doble ciego, categorías y agregados; integración con PostgreSQL; E2E para emitir reviews y consultar reputación.

**Target Platform**: Aplicación web Serverless con route handlers tRPC.

**Project Type**: Web application modular bajo `development/`.

**Performance Goals**: Formulario completado en menos de 2 minutos; reputación agregada sobre 10.000 reviews `PUBLISHED` distribuidas entre 1.000 listings/usuarios y 50 peticiones concurrentes con p95 < 500 ms y tasa de errores < 0,1%; publicación determinista al segundo envío o vencimiento.

**Constraints**: Solo reservas `completed`; ventana de 14 días; una review por autor/reserva/dirección; puntuaciones 1–5; reviews ocultas o moderadas fuera de agregados.

**Scale/Scope**: Dos reviews máximas por reserva, categorías tipadas, agregados por listing/usuario y moderación autorizada. El benchmark usa 10.000 reviews `PUBLISHED`, 1.000 listings/usuarios y 50 peticiones concurrentes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **PASS**: separación por capas, validación Zod y autorización por recurso.
- **PASS**: integridad referencial, unicidad, timestamps y auditoría de moderación.
- **PASS**: doble ciego aplicado en servidor y datos públicos limitados a reviews publicadas.
- **PASS**: unitarios, integración PostgreSQL y E2E.
- **PASS**: no hay violaciones que requieran Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/008-modulo-reviews/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)

```text
development/
├── prisma/schema.prisma
├── prisma/migrations/<timestamp>_reviews/
├── src/features/reviews/
│   ├── application/review.service.ts
│   ├── domain/review.ts
│   ├── domain/review-eligibility.ts
│   ├── infrastructure/review.repository.ts
│   ├── presentation/review-form.tsx
│   ├── presentation/review-card.tsx
│   ├── presentation/reputation-summary.tsx
│   └── shared/review.schema.ts
├── src/server/api/routers/review.router.ts
└── tests/
    ├── unit/reviews/
    ├── integration/reviews/
    └── e2e/reviews.spec.ts
```

**Structure Decision**: Seguir el patrón feature-based existente. El servicio concentra elegibilidad, doble ciego, publicación y moderación; el repositorio encapsula Prisma; las vistas reutilizan reputación en listings y perfiles.

## Post-Design Constitution Check

- **PASS**: la autorización por recurso y el doble ciego se aplican en servidor.
- **PASS**: la integridad referencial, la unicidad y la auditoría de moderación están representadas en el modelo.
- **PASS**: los contratos son validables con Zod y los flujos críticos tienen cobertura unitaria, de integración y E2E.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ninguna | N/A | El diseño cumple la constitución sin excepciones. |

## Delivery Phases

1. Elegibilidad, emisión, categorías y unicidad.
2. Doble ciego y publicación al segundo envío o vencimiento.
3. Reputación pública y agregados con una decimal.
4. Reportes, moderación y trazabilidad.
5. Formularios, accesibilidad, E2E y rendimiento.

El benchmark debe escribir sus métricas en `specs/008-modulo-reviews/benchmark-results.json` y fallar si p95 >= 500 ms o la tasa de errores >= 0,1%.
