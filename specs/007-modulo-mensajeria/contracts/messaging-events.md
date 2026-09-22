# Contratos de Mensajería — CHAT-001 / CHAT-002

Todos los contratos requieren sesión autenticada. Los IDs, fechas y `senderId` se verifican en servidor. Los nombres son canónicos y deben compartirse desde TypeScript/Zod para web y futuros clientes móviles.

## Socket.io handshake

Cliente conecta con `auth: { sessionToken }` o cookies de sesión HttpOnly según el adaptador. El servidor valida sesión, expiración, usuario activo y origen permitido. El socket se rechaza con `UNAUTHORIZED` o `FORBIDDEN`; nunca se acepta un `userId` declarado por cliente.

## Cliente → servidor

### `conversation:join`

```json
{ "conversationId": "clx..." }
```

Respuesta ACK: `{ "ok": true, "conversationId": "clx..." }` o `{ "ok": false, "code": "FORBIDDEN" }`. Solo agrega el socket a `conversation:{id}` tras comprobar membresía.

### `message:send`

```json
{
  "conversationId": "clx...",
  "clientMessageId": "client-generated-uuid",
  "body": "¿Está disponible el producto?",
  "attachmentIds": []
}
```

Reglas: `body` opcional solo si existe al menos un adjunto; máximo 4000 caracteres; `attachmentIds` pertenecen a uploads confirmados del mismo usuario/conversación; máximo 5; no se acepta `senderId`, `createdAt` ni `messageId`.

ACK exitoso: `{ "ok": true, "message": MessageCreatedPayload, "deduplicated": false }`. Un reintento con la misma clave devuelve el mensaje existente y `deduplicated: true`.

### `conversation:read`

```json
{ "conversationId": "clx...", "messageId": "clx..." }
```

Solo avanza el cursor de lectura si el mensaje pertenece al hilo. ACK devuelve `lastReadMessageId` y `lastReadAt` del servidor.

## Servidor → cliente

### `message:created`

```json
{
  "id": "clx-server-id",
  "conversationId": "clx...",
  "senderId": "clx-user-id",
  "body": "¿Está disponible el producto?",
  "attachments": [],
  "createdAt": "2026-09-22T12:00:00.000Z"
}
```

Se emite al room solo después de confirmar PostgreSQL. El receptor debe tratar `id` como deduplicador.

### `message:acknowledged`

Opcional para UX de entrega: `{ "messageId": "clx...", "conversationId": "clx..." }`. No significa leído; leído usa `conversation:read`.

### `conversation:read-updated`

`{ "conversationId": "clx...", "userId": "clx...", "messageId": "clx...", "readAt": "..." }`. Solo se emite a miembros autorizados y no expone información adicional.

### `socket:error`

```json
{ "code": "VALIDATION_ERROR|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|RATE_LIMITED|CONFLICT|INTERNAL", "requestId": "..." }
```

No incluye stack traces, tokens ni detalles de Prisma.

## Contratos tRPC/HTTP

- `messaging.listConversations({ cursor?, limit? })` → conversaciones del usuario con último mensaje y unread count.
- `messaging.getConversation({ conversationId })` → metadatos mínimos y participantes públicos.
- `messaging.listMessages({ conversationId, cursor?, limit? })` → `{ items: MessageCreatedPayload[], nextCursor: string | null }`, orden descendente estable.
- `messaging.createConversation({ listingId?, bookingId?, participantId })` → conversación o existente idempotente; el servidor determina owner/renter.
- `messaging.markRead({ conversationId, messageId })` → estado de lectura validado.
- `messaging.createAttachmentUpload({ conversationId, mimeType, byteSize, checksum? })` → URL prefirmada y `attachmentId` temporal.
- `messaging.confirmAttachment({ attachmentId })` → metadatos verificados; solo después puede referenciarse en `message:send`.

## Semántica de errores

`UNAUTHORIZED` sesión ausente/expirada; `FORBIDDEN` no miembro; `NOT_FOUND` recurso inexistente o no visible; `VALIDATION_ERROR` payload inválido; `CONFLICT` idempotency key con contenido incompatible; `RATE_LIMITED` exceso de mensajes/uploads. Todos incluyen `requestId` para correlación.
