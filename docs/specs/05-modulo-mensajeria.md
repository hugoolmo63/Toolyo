# Módulo 5: Mensajería — CHAT-001 a CHAT-006

**Estado**: especificación y plan de implementación | **Fecha**: 2026-09-22 | **Plan técnico**: [`specs/007-modulo-mensajeria/plan.md`](../../specs/007-modulo-mensajeria/plan.md)

## 1. Objetivo y alcance

Toolyo debe permitir comunicación privada entre arrendador y arrendatario, vinculada al listing y, cuando exista, a la reserva. El sistema combina Socket.io para la experiencia en tiempo real con PostgreSQL/Prisma como fuente de verdad del historial. El mensaje se persiste antes de emitirse: una desconexión nunca debe causar pérdida de un mensaje aceptado.

Requisitos funcionales:

| ID | Alcance | Entrega |
|---|---|---|
| CHAT-001 | Chat tiempo real | Socket.io, rooms privadas, ACK, reconexión y autorización. |
| CHAT-002 | Historial persistente | Conversation/Message, paginación por cursor, unread/read y recuperación. |
| CHAT-003 | Notificaciones | Iteración posterior, job push/email fuera del camino crítico. |
| CHAT-004 | Imágenes | Upload prefirmado a S3/R2 y metadatos `MessageAttachment`. |
| CHAT-005 | Respuestas rápidas | Plantillas versionadas por arrendador. |
| CHAT-006 | Moderación | Estado de moderación, filtrado, reportes y auditoría. |

## 2. Arquitectura propuesta

```text
Cliente web/móvil
   ├── tRPC + Zod ── historial, conversaciones, uploads ──┐
   └── Socket.io ── join/send/read/events ─────────────────┤
                                                          ▼
              Messaging Service + autorización ABAC
                    ├── Prisma → PostgreSQL
                    ├── Socket.io Gateway → rooms privadas
                    ├── Redis (rate limit/presencia/multi-node)
                    └── S3/R2 (bytes de imágenes)
```

La primera entrega instala `socket.io`/`socket.io-client`, crea el gateway y registra el router `messagingRouter`. Los routers son delgados; las reglas viven en `messaging.service.ts`. El gateway no escribe directamente en Prisma: llama al servicio y emite solo tras éxito.

## 3. Esquema Prisma propuesto

El diseño completo está en [`specs/007-modulo-mensajeria/data-model.md`](../../specs/007-modulo-mensajeria/data-model.md). Resumen de relaciones:

```text
User 1──N ConversationParticipant N──1 Conversation
Conversation 1──N Message N──1 User
Message 1──N MessageAttachment
Conversation 0..1──1 Booking
Conversation N──1 Listing (opcional en pre-reserva)
```

Modelos requeridos:

- `Conversation`: `id`, `bookingId? @unique`, `listingId?`, timestamps y `deletedAt`.
- `ConversationParticipant`: clave compuesta `(conversationId, userId)`, cursor de lectura y timestamps.
- `Message`: `id`, `conversationId`, `senderId`, `clientMessageId`, `body?`, estado de moderación, timestamps y `deletedAt`; unique `(conversationId, senderId, clientMessageId)`.
- `MessageAttachment`: `storageKey`, `publicUrl`, `mimeType`, `byteSize`, dimensiones, checksum y timestamps. No contiene binarios.

`Booking` todavía no está presente en `development/prisma/schema.prisma`; la FK debe coordinarse con la migración de reservas. Hasta entonces `bookingId` se documenta como nullable para permitir contacto iniciado desde un listing, sin sacrificar la relación tipada cuando el modelo exista.

## 4. Contratos de API y eventos

Los contratos canónicos están en [`specs/007-modulo-mensajeria/contracts/messaging-events.md`](../../specs/007-modulo-mensajeria/contracts/messaging-events.md). En resumen:

- Socket.io cliente → servidor: `conversation:join`, `message:send`, `conversation:read`.
- Socket.io servidor → cliente: `message:created`, `message:acknowledged`, `conversation:read-updated`, `socket:error`.
- tRPC: `listConversations`, `getConversation`, `listMessages`, `createConversation`, `markRead`, `createAttachmentUpload`, `confirmAttachment`.
- Todos los comandos se autentican, validan con Zod y autorizan por membresía; el servidor deriva identidad y timestamps.

## 5. Plan iterativo

1. **Base CHAT-001/CHAT-002**: schema + migración, repositorio, servicio de autorización, gateway Socket.io, handshake, rooms, envío persistente-before-broadcast, ACK e idempotencia.
2. **Historial robusto**: cursores, unread/read, reconexión, orden estable y pruebas de integración con PostgreSQL.
3. **CHAT-004**: presigned uploads, límites, MIME/magic bytes, checksum y adjuntos.
4. **CHAT-003**: push/email mediante job idempotente con preferencias y rate limits.
5. **CHAT-005/CHAT-006**: plantillas, filtros, reportes, moderación y auditoría.

## 6. Seguridad, operación y límites

- TLS, CORS por allowlist y sesión HttpOnly; validar origen durante el handshake.
- ABAC en servicio: solo los dos participantes pueden leer/escribir; nunca basta el rol `user`.
- Límite inicial sugerido: 4000 caracteres, 5 adjuntos por mensaje, 10 MiB por imagen y rate limit por usuario/conversación; ajustar con métricas.
- Registrar `requestId`, `userId`, conversación y resultado sin guardar el contenido completo en logs.
- Para múltiples instancias usar Redis adapter y sticky sessions si el proveedor las exige; la persistencia no depende de Redis.
- Aplicar migración incremental, revisar SQL generado y ejecutar tests contra PostgreSQL efímero.

## 7. Criterios de aceptación de la primera entrega

- Dos usuarios autorizados reciben un mensaje en tiempo real con el mismo ID de servidor.
- El mensaje queda visible tras refrescar y tras desconectar/reconectar el receptor.
- Reintentar el mismo `clientMessageId` no crea duplicados.
- Un tercer usuario recibe `FORBIDDEN` y no puede entrar al room ni consultar historial.
- La API devuelve páginas reproducibles con cursor y no expone email, teléfono, tokens ni stack traces.
- Los tests unitarios, integración y E2E definidos en [`quickstart.md`](../../specs/007-modulo-mensajeria/quickstart.md) pasan.
