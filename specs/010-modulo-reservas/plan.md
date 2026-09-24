# Implementation Plan: Módulo de Reservas

**Branch**: `008-modulo-reservas` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification for booking requests, lifecycle management, financial breakdown, tRPC contracts and Conversation integration.

## Summary

Implementar el agregado `Booking` para solicitudes de alquiler con aprobación manual. La operación de creación valida disponibilidad, calcula y congela el desglose financiero, crea la reserva en `pending` y crea de forma idempotente la `Conversation` con renter y owner en una transacción. Los procedimientos tRPC serán delgados y delegarán la autorización, disponibilidad, transiciones y persistencia a un servicio de reservas.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router.

**Primary Dependencies**: Prisma 5.20, PostgreSQL 15, tRPC 11, Zod 3.23, React Query 5, Vitest y `@testcontainers/postgresql`.

**Storage**: PostgreSQL/Prisma para `Booking`, disponibilidad y relaciones. `Conversation` se persiste según el modelo del Módulo 5. No se incluyen pagos externos en esta iteración.

**Testing**: Vitest para cálculo, validaciones y máquina de estados; integración con PostgreSQL real para constraints, transacciones y concurrencia; Playwright para el flujo E2E renter → solicitud → conversación → mensajería y owner → aceptación/rechazo; benchmark reproducible de aceptación/rechazo con umbral p95.

**Target Platform**: Aplicación web de Toolyo y futuros clientes que consuman los contratos tRPC.

**Project Type**: Web application con backend modular bajo `development/`.

**Performance Goals**: creación/listado de reserva por debajo de 500 ms p95 en carga normal; transición de aceptación/rechazo por debajo de 2 s p95; ninguna operación exitosa deja reserva sin conversación.

**Constraints**: autorización por recurso; no confiar en IDs o importes sensibles del cliente; preservar snapshot financiero; evitar solapamientos concurrentes; `Booking` y `Conversation` pueden requerir migraciones coordinadas porque no están completos en el schema actual.

**Scale/Scope**: MVP con un renter, un owner, un listing y una conversación por reserva; paginación para listados y diseño extensible a pagos/cancelaciones posteriores.

## Constitution Check

*GATE: Must pass before implementation planning proceeds.*

- **PASS — Backend**: router tRPC delgado, servicio de dominio aislado, schemas Zod y autorización por defecto.
- **PASS — Database**: IDs no enumerables, `Timestamptz`, `Decimal(19,4)`, FKs, índices, soft delete y constraints explícitos.
- **PASS — Transactions**: creación de `Booking`, `Conversation` y participantes dentro de una transacción; aceptación protegida contra solapamientos.
- **PASS — Security**: renter derivado de sesión, owner derivado del listing, datos financieros visibles solo a participantes y logs sin PII innecesaria.
- **PASS — Testing**: pruebas unitarias, integración con PostgreSQL y E2E del flujo crítico.
- **PASS — No unresolved clarifications**: los defaults del MVP están documentados en `spec.md`.

## Implementation Phases

1. **Modelo y migración**: añadir `BookingStatus`, `Booking`, `BookingStatusHistory`, relaciones e índices; coordinar la FK `Conversation.bookingId` y revisar el SQL generado.
2. **Dominio de solicitud**: validar fechas, disponibilidad, tarifa, service fee, idempotencia y creación transaccional de reserva + conversación.
3. **Resolución del ciclo de vida**: aceptar/rechazar con autorización del owner, control de estado y protección contra solapamiento concurrente.
4. **Lecturas**: listar por rol con filtros, paginación estable, resumen financiero y `conversationId`.
5. **Integración de mensajería**: devolver el identificador de conversación y garantizar que el hilo está listo para el gateway/contratos del Módulo 5.
6. **Validación**: unitarios de reglas, integración con DB real, pruebas de concurrencia, benchmark p95 de transiciones y E2E con renter y owner.

## Project Structure

```text
development/
├── prisma/schema.prisma
├── prisma/migrations/<timestamp>_add_bookings/
├── src/features/bookings/
│   ├── application/booking.service.ts
│   ├── domain/booking.ts
│   ├── infrastructure/booking.repository.ts
│   └── shared/booking.schema.ts
├── src/server/api/routers/booking.router.ts
├── src/server/api/root.ts
└── tests/
    ├── unit/bookings/
    ├── integration/bookings/
    ├── integration/messaging/
    └── e2e/bookings-messaging.spec.ts
```

**Structure Decision**: seguir el patrón feature-based existente. `booking.router.ts` solo valida entrada, obtiene contexto y mapea errores; `booking.service.ts` ejecuta reglas de dominio; el repositorio encapsula Prisma. La integración con `Conversation` se realiza mediante el servicio/repositorio de mensajería dentro de la transacción, nunca mediante escritura directa desde el router.

## Risks and Mitigations

- **Modelo Conversation aún no disponible o incompatible**: coordinar migración y contrato antes de aplicar; fallar el despliegue si la FK no puede validarse.
- **Condiciones de carrera en disponibilidad**: usar transacción, aislamiento/constraint apropiado y revalidar solapamiento al aceptar.
- **Cambios de tarifa posteriores**: guardar el snapshot financiero en `Booking`, nunca recalcular reservas históricas desde `Listing`.
- **Reintentos de red**: exigir idempotency key única por renter/listing/rango y devolver el resultado existente.
- **Auditoría de transiciones**: insertar `BookingStatusHistory` en la misma transacción que cada cambio de estado; `lastTransitionById` no sustituye el historial completo.
- **Rendimiento de transiciones**: ejecutar el benchmark con al menos 100 operaciones y registrar p50, p95, p99, errores y conflictos para verificar `SC-004`.
