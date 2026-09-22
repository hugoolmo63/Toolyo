# Implementation Plan: Módulo 5 — Mensajería

**Branch**: `007-modulo-mensajeria` | **Date**: 2026-09-22 | **Spec**: [docs/specs/05-modulo-mensajeria.md](../../docs/specs/05-modulo-mensajeria.md)

**Input**: Requisitos CHAT-001 a CHAT-006 de `docs/04-especificaciones-funcionales.md` y solicitud de diseño del módulo.

## Summary

Implementar mensajería privada entre arrendador y arrendatario con dos caminos coordinados: Socket.io para entrega en tiempo real y tRPC/Prisma para persistencia, lectura y recuperación del historial. La primera iteración entrega CHAT-001 y CHAT-002: autenticación del socket, autorización por conversación, escritura transaccional del mensaje antes de emitirlo, idempotencia, orden estable y paginación del historial. Las iteraciones posteriores añaden adjuntos de imagen (CHAT-004), notificaciones (CHAT-003), respuestas rápidas (CHAT-005) y moderación/reportes (CHAT-006).

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node.js 20+, Next.js 14.2 App Router.

**Primary Dependencies**: Prisma 5.20 + PostgreSQL 15, tRPC 11, Zod 3.23, React Query 5, Vitest, `@testcontainers/postgresql`; añadir `socket.io` y `socket.io-client` con versiones compatibles con Node 20 y registrar ambas en `development/package-lock.json`.

**Storage**: PostgreSQL como fuente de verdad para conversaciones, mensajes y metadatos de adjuntos; Redis queda reservado para presencia, rate limiting y escalado multi-instancia; S3/R2 para bytes de imágenes mediante URLs prefirmadas.

**Testing**: Vitest para validaciones/servicios y contrato de eventos; Vitest + Testcontainers/PostgreSQL para persistencia y autorización; Playwright para el flujo crítico de dos usuarios; pruebas Socket.io con cliente/servidor en memoria, sin depender de `setTimeout` arbitrarios.

**Target Platform**: Web (Next.js) y futuros clientes React Native; servidor Node persistente para Socket.io detrás de TLS y proxy compatible con WebSocket.

**Project Type**: Web application / backend modular bajo `development/`.

**Performance Goals**: p95 de aceptación y broadcast inferior a 500 ms en una instancia; lectura de primera página de historial inferior a 300 ms p95; reconexión con recuperación desde `lastMessageId`; no perder mensajes aceptados aunque el cliente se desconecte inmediatamente.

**Constraints**: Solo usuarios autenticados y miembros de la conversación; nunca confiar en `conversationId`, `senderId` o `bookingId` enviados por el cliente; límites de longitud y frecuencia; no guardar binarios en PostgreSQL; Socket.io no sustituye la persistencia; `Booking` aún no existe en el schema actual y debe integrarse con la migración del módulo de reservas.

**Scale/Scope**: Primera versión para conversaciones de dos participantes (arrendador/arrendatario), una reserva y opcionalmente un listing por conversación; diseño preparado para múltiples instancias con Redis adapter, aunque el primer despliegue puede ser single-node.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **PASS — Fuente de verdad y capas**: se consultan `constitution/` y se separan router, servicio, repositorio, validaciones y adaptador Socket.io.
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
│   ├── infrastructure/socket-io.gateway.ts      # handshake, rooms y emisión post-commit
│   ├── presentation/messaging.schema.ts        # Zod compartido
│   └── presentation/message-list.tsx            # UI incremental, si entra en la iteración
├── src/server/api/routers/messaging.router.ts   # historial, conversaciones y uploads
├── src/server/api/root.ts                       # registrar messagingRouter
├── src/app/api/socket/route.ts                  # bootstrap/adaptador según runtime elegido
└── tests/
    ├── unit/messaging/
    ├── integration/messaging/
    └── e2e/messaging.spec.ts
```

**Structure Decision**: seguir la estructura feature-based existente bajo `development/src/features`, con un router tRPC delgado y un gateway Socket.io como adaptador de infraestructura. La implementación debe confirmar antes del código si el despliegue Next.js soporta un proceso Node persistente; si no, el gateway se alojará como servicio Node separado y el contrato de eventos permanecerá idéntico.

## Iterative Delivery

1. **Iteración 1 — CHAT-001 + base de CHAT-002**: instalar Socket.io, definir handshake/autorización, rooms por conversación, `Conversation`/`Message`, envío persistente-before-broadcast, ACK, deduplicación y reconexión.
2. **Iteración 2 — CHAT-002 completo**: historial paginado, cursores, unread/read state, recuperación tras desconexión e integración con `Booking` cuando exista el modelo.
3. **Iteración 3 — CHAT-004**: presigned upload, validación MIME/tamaño, `MessageAttachment`, virus scan/moderación de imagen y evento `message.created` con metadatos públicos.
4. **Iteración 4 — CHAT-003**: notificación push/email fuera del camino crítico mediante job idempotente y preferencias del usuario.
5. **Iteración 5 — CHAT-005 + CHAT-006**: plantillas por arrendador, filtro/reportes, estados de moderación y auditoría.

## Complexity Tracking

No hay violaciones de la constitución. Redis adapter, servicio Socket.io separado y almacenamiento S3/R2 son decisiones de integración justificadas por escalado y por no almacenar binarios en PostgreSQL; no son necesarios para alterar el contrato funcional de la primera iteración.
