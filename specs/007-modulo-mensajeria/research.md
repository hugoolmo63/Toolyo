# Research: Módulo 5 — Mensajería

## Decisión: Socket.io sobre WebSocket nativo

**Rationale**: el requisito explícito pide WebSockets/Socket.io; Socket.io aporta handshake autenticado, rooms, ACK, reconexión y fallback, que reducen código accidental en CHAT-001. Se encapsula detrás de `socket-io.gateway.ts` para que el dominio no dependa de la librería.

**Alternatives considered**: `ws`/WebSocket nativo (menor abstracción, pero requiere implementar reconexión, ACK y rooms); SSE (no soporta de forma natural el envío bidireccional); polling (no cumple tiempo real).

## Decisión: persistir antes de emitir

**Rationale**: PostgreSQL es la fuente de verdad y permite recuperar mensajes cuando un socket cae. El servicio valida y persiste dentro de una transacción; solo después del commit emite `message.created`. La entrega en tiempo real es una optimización, no el mecanismo de durabilidad.

**Alternatives considered**: emitir primero (menor latencia, pero puede anunciar mensajes que fallan al persistir); cola antes de DB (más complejidad y no necesaria para la primera iteración).

## Decisión: tRPC para historial y mutaciones HTTP, Socket.io para eventos

**Rationale**: el proyecto ya usa tRPC + Zod y sus convenciones exigen routers delgados y validación end-to-end. El socket se limita a comandos/eventos de baja latencia; `messaging.listMessages`, `getConversation` y upload presigned se exponen por tRPC.

**Alternatives considered**: duplicar toda la API en eventos Socket.io (contratos menos visibles, peor cache/paginación); REST (introduce una tercera convención no usada en el backend actual).

## Decisión: adjuntos fuera de PostgreSQL

**Rationale**: arquitectura existente indica S3 para imágenes. El mensaje guarda URL/clave, MIME, tamaño, dimensiones y checksum; el cliente sube con URL prefirmada y confirma el adjunto antes de enviar el mensaje.

**Alternatives considered**: `bytea` en PostgreSQL (incrementa backups y latencia); base64 en el payload (alto coste y superficie de abuso).

## Decisión: relación de reserva explícita pero coordinada

**Rationale**: CHAT-002 exige asociación con reserva y la arquitectura documenta `Booking`, pero el schema actual no lo contiene. `Conversation.bookingId` será obligatorio cuando la reserva sea el contexto de negocio; durante la migración puede ser nullable para soportar conversaciones pre-reserva iniciadas desde un listing. La FK se añade en la misma migración o en una migración posterior inmediata cuando `Booking` esté disponible.

**Alternatives considered**: guardar solo `listingId` (no prueba que el usuario tenga relación con la reserva); `metadata Json` (pierde integridad referencial y consultas eficientes).

## Decisión: idempotencia y orden lógico

**Rationale**: `clientMessageId` único por conversación/remitente evita duplicados por reintentos. `createdAt` con `id` como desempate da orden estable; no se usa el reloj del cliente.

**Alternatives considered**: confiar en timestamps del cliente (manipulable y no monotónico); no deduplicar (duplicados en reconexiones).
