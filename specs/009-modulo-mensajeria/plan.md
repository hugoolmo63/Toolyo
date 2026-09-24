# Implementation Plan: Módulo 5 — Mensajería

**Branch**: `007-modulo-mensajeria` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Requisitos CHAT-001 a CHAT-006 de `docs/04-especificaciones-funcionales.md` y solicitud de diseño del módulo.

## Summary

Implementar mensajería privada entre arrendador y arrendatario con dos caminos coordinados: tRPC/Prisma para persistencia, lectura y recuperación del historial en runtime Serverless. La primera iteración entrega CHAT-001 y CHAT-002: autorización tRPC por conversación, escritura transaccional del mensaje antes de responder y email asíncrono, idempotencia, orden estable y paginación del historial. Las iteraciones posteriores añaden adjuntos de imagen (CHAT-004), notificaciones (CHAT-003), respuestas rápidas (CHAT-005) y moderación/reportes (CHAT-006).

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router.

**Primary Dependencies**: Prisma 5.20 + PostgreSQL 15, tRPC 11, Zod 3.23, React Query 5, Vitest y `@testcontainers/postgresql`; no se requieren dependencias WebSocket ni custom server.

**Storage**: PostgreSQL como fuente de verdad para conversaciones, mensajes y metadatos de adjuntos; Redis queda reservado para presencia, rate limiting y escalado multi-instancia; S3/R2 para bytes de imágenes mediante URLs prefirmadas.

**Testing**: Vitest para validaciones/servicios; Vitest + Testcontainers/PostgreSQL para persistencia y autorización; Playwright para el flujo crítico de dos usuarios; pruebas tRPC sin depender de `setTimeout` arbitrarios.

**Target Platform**: Web (Next.js) y futuros clientes React Native; runtimes Serverless compatibles con route handlers tRPC.

**Project Type**: Web application / backend modular bajo `development/`.

**Performance Goals**: p95 de aceptación y broadcast inferior a 500 ms en una instancia; lectura de primera página de historial inferior a 300 ms p95; reconexión con recuperación desde `lastMessageId`; no perder mensajes aceptados aunque el cliente se desconecte inmediatamente.

**Constraints**: Solo usuarios autenticados y miembros de la conversación; nunca confiar en `conversationId`, `senderId` o `bookingId` enviados por el cliente; límites de longitud y frecuencia; no guardar binarios en PostgreSQL; no mantener conexiones globales persistentes; `Booking` se integra mediante la migración del módulo de reservas.

**Scale/Scope**: Primera versión para conversaciones de dos participantes (arrendador/arrendatario), una reserva y opcionalmente un listing por conversación; diseño preparado para múltiples instancias con Redis adapter, aunque el primer despliegue puede ser single-node.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **PASS — Fuente de verdad y capas**: se consultan `constitution/` y se separan router, servicio, repositorio y validaciones tRPC.
- **PASS — Seguridad por diseño**: autenticación en handshake, autorización ABAC por membresía, TLS/CORS explícitos, rate limiting y logs estructurados.
- **PASS — Type-safety**: Zod define payloads; los contratos de eventos y procedimientos se comparten como tipos derivados, sin `any`.
- **PASS — Integridad de datos**: FKs, índices, `onDelete` explícito, timestamps con zona horaria, soft delete e idempotency key.
- **PASS — Transaccionalidad**: el mensaje y sus adjuntos se crean en una transacción; el broadcast ocurre después del commit.
- **PASS — Testing**: unitarios, integración con PostgreSQL y E2E del flujo de mensajería.
- **PASS — No hay violaciones que requieran Complexity Tracking**.

## Project Structure

```text
development/
├── prisma/schema.prisma                         # ampliar con Conversation/Message/MessageAttachment
├── prisma/migrations/<timestamp>_messaging/
├── src/features/messaging/
│   ├── application/messaging.service.ts         # casos de uso y autorización de dominio
│   ├── domain/messaging.ts                      # tipos/eventos de dominio
│   ├── infrastructure/messaging.repository.ts  # Prisma; no expone Prisma al cliente
    ├── infrastructure/messaging.repository.ts   # persistencia tRPC
│   ├── presentation/messaging.schema.ts        # Zod compartido
│   └── presentation/message-list.tsx            # UI incremental, si entra en la iteración
├── src/server/api/routers/messaging.router.ts   # historial, conversaciones y uploads
├── src/server/api/root.ts                       # registrar messagingRouter
└── tests/
    ├── unit/messaging/
    ├── integration/messaging/
    └── e2e/messaging.spec.ts
```

**Structure Decision**: seguir la estructura feature-based existente bajo `development/src/features`, con un router tRPC delgado y servicios/repositorios de mensajería. El cliente mantiene polling solo en `/messages/[conversationId]`; no existe custom server ni gateway persistente.

## Iterative Delivery

1. **Iteración 1 — CHAT-001 + base de CHAT-002**: implementar `sendMessage`, autorización tRPC, persistencia transaccional, email asíncrono, deduplicación y actualización optimista.
2. **Iteración 2 — CHAT-002 completo**: historial paginado, cursores, unread/read state, recuperación tras desconexión e integración con `Booking` cuando exista el modelo.
3. **Iteración 3 — CHAT-004**: presigned upload, validación MIME/tamaño, `MessageAttachment`, virus scan/moderación de imagen y evento `message.created` con metadatos públicos.
4. **Iteración 4 — CHAT-003**: notificación push/email fuera del camino crítico mediante job idempotente y preferencias del usuario.
5. **Iteración 5 — CHAT-005 + CHAT-006**: plantillas por arrendador, filtro/reportes, estados de moderación y auditoría.

## Complexity Tracking

No hay violaciones de la constitución. El almacenamiento S3/R2 y el email son integraciones desacopladas mediante puertos; no se requiere un proceso persistente adicional para mensajería.
