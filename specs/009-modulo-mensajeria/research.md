# Research: Módulo 5 — Mensajería

## Decisión: tRPC + polling limitado Serverless

**Rationale**: el equipo prioriza Serverless, coste adicional cero y ausencia de custom server. tRPC ofrece contratos tipados, autorización y persistencia; React Query usa actualización optimista y polling corto solo dentro del chat activo.

**Alternatives considered**: WebSocket persistente (requieren proceso persistente); SSE (mantiene conexión persistente); polling global (coste innecesario).

## Decisión: persistir antes de responder y notificar

**Rationale**: PostgreSQL es la fuente de verdad. El servicio persiste mensaje y adjuntos dentro de una transacción; después responde por tRPC y dispara el email de forma asíncrona. Una caída del proveedor email nunca revierte el mensaje.

**Alternatives considered**: emitir primero (menor latencia, pero puede anunciar mensajes que fallan al persistir); cola antes de DB (más complejidad y no necesaria para la primera iteración).

## Decisión: tRPC para todas las operaciones

**Rationale**: `messaging.listMessages`, `sendMessage`, `markRead`, `getUnreadCount` y uploads se exponen por tRPC con Zod, autorización ABAC y tipos end-to-end.

**Alternatives considered**: duplicar la API en eventos WebSocket; REST adicional; ambas introducen contratos y operación innecesarios.

## Decisión: adjuntos fuera de PostgreSQL

**Rationale**: arquitectura existente indica S3 para imágenes. El mensaje guarda URL/clave, MIME, tamaño, dimensiones y checksum; el cliente sube con URL prefirmada y confirma el adjunto antes de enviar el mensaje.

**Alternatives considered**: `bytea` en PostgreSQL (incrementa backups y latencia); base64 en el payload (alto coste y superficie de abuso).

## Decisión: relación de reserva explícita pero coordinada

**Rationale**: CHAT-002 exige asociación con reserva y la arquitectura documenta `Booking`, pero el schema actual no lo contiene. `Conversation.bookingId` será obligatorio cuando la reserva sea el contexto de negocio; durante la migración puede ser nullable para soportar conversaciones pre-reserva iniciadas desde un listing. La FK se añade en la misma migración o en una migración posterior inmediata cuando `Booking` esté disponible.

**Alternatives considered**: guardar solo `listingId` (no prueba que el usuario tenga relación con la reserva); `metadata Json` (pierde integridad referencial y consultas eficientes).

## Decisión: idempotencia y orden lógico

**Rationale**: `clientMessageId` único por conversación/remitente evita duplicados por reintentos. `createdAt` con `id` como desempate da orden estable; no se usa el reloj del cliente.

**Alternatives considered**: confiar en timestamps del cliente (manipulable y no monotónico); no deduplicar (duplicados en reconexiones).
