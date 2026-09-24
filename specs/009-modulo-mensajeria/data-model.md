# Data Model: Módulo de Mensajería

## Entidades

### Conversation

Representa un hilo privado entre los participantes de una operación.

| Campo | Tipo Prisma | Reglas |
|---|---|---|
| `id` | `String @id @default(cuid())` | No enumerable desde el cliente sin autorización. |
| `bookingId` | `String? @unique` | FK a `Booking`; nullable solo para contacto pre-reserva. |
| `listingId` | `String?` | FK a `Listing`; conserva el contexto cuando no hay reserva. |
| `createdAt`, `updatedAt` | `DateTime @db.Timestamptz(6)` | Auditoría. |
| `deletedAt` | `DateTime? @db.Timestamptz(6)` | Soft delete, no borrar historial físicamente por defecto. |

Relaciones: `participants ConversationParticipant[]`, `messages Message[]`, `booking Booking?`, `listing Listing?`.

### ConversationParticipant

Tabla explícita para membresía y estado de lectura.

| Campo | Tipo | Reglas |
|---|---|---|
| `conversationId` | `String` | FK cascade a conversación. |
| `userId` | `String` | FK restrict/cascade según política de borrado de `User`. |
| `lastReadMessageId` | `String?` | Solo puede apuntar a mensaje de la misma conversación; validar en servicio. |
| `joinedAt`, `lastReadAt` | `DateTime @db.Timestamptz(6)` | Auditoría/orden. |

Constraint: `@@id([conversationId, userId])`, `@@index([userId, updatedAt])`. En la primera versión debe haber exactamente dos miembros y uno debe ser owner del listing; esa invariancia se valida en servicio y, cuando sea posible, en una constraint/migración.

### Message

Mensaje persistente, inmutable para el contenido enviado.

| Campo | Tipo Prisma | Reglas |
|---|---|---|
| `id` | `String @id @default(cuid())` | ID de servidor. |
| `conversationId` | `String` | FK cascade; índice con fecha. |
| `senderId` | `String` | FK a `User`; debe ser participante activo. |
| `clientMessageId` | `String` | Generado por cliente, longitud limitada; único por conversación y sender. |
| `body` | `String? @db.Text` | Al menos body o adjunto; máximo inicial 4000 caracteres, normalizado/sanitizado. |
| `moderationStatus` | `MessageModerationStatus` | `pending`, `approved`, `blocked`, `reported`; primera iteración `approved` por defecto hasta activar moderación. |
| `createdAt`, `updatedAt` | `DateTime @db.Timestamptz(6)` | El servidor asigna timestamps. |
| `deletedAt` | `DateTime? @db.Timestamptz(6)` | Soft delete; no reutilizar `body`. |

Relaciones: `conversation`, `sender`, `attachments MessageAttachment[]`.

Índices: `@@unique([conversationId, senderId, clientMessageId])`, `@@index([conversationId, createdAt, id])`, `@@index([senderId, createdAt])`.

### MessageAttachment

Metadatos de un objeto ya subido a almacenamiento de objetos.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `String @id @default(cuid())` | ID de servidor. |
| `messageId` | `String` | FK a `Message`, cascade. |
| `storageKey` | `String @db.VarChar(512)` | Clave interna, nunca aceptar URL arbitraria. |
| `publicUrl` | `String @db.VarChar(1024)` | URL CDN firmada o pública según política. |
| `mimeType` | `String @db.VarChar(100)` | Allowlist `image/jpeg`, `image/png`, `image/webp`; validar por bytes. |
| `byteSize` | `Int` | Límite inicial documentado en contrato, p.ej. 10 MiB. |
| `width`, `height` | `Int?` | Positivos y acotados. |
| `checksum` | `String?` | Integridad/deduplicación. |
| `createdAt`, `deletedAt` | `DateTime` / `DateTime?` | Auditoría y borrado lógico. |

## Enums y transiciones

`MessageModerationStatus`: `approved → reported → blocked` o `pending → approved/blocked`; bloquear no borra el registro para conservar auditoría.

`Conversation` no necesita enum de estado en la primera iteración: su disponibilidad se deriva de `deletedAt` y membresía. Si reservas canceladas deben cerrar chat, añadir `isClosed`/`closedAt` en una migración posterior, no inferirlo en cada query.

## Reglas de integridad

1. El servidor deriva `senderId` de la sesión.
2. Solo participantes pueden leer, enviar, marcar leído o recibir room events.
3. `bookingId` debe pertenecer a `listingId` y uno de sus usuarios debe ser el sender/participant.
4. Crear conversación y sus dos participantes se hace en una transacción.
5. Crear mensaje y adjuntos confirmados se hace en una transacción; no se emite evento antes del commit.
6. Historial ordenado por `(createdAt DESC, id DESC)` y paginado por cursor opaco.
