# Contrato Serverless de Mensajería — CHAT-001 / CHAT-002

Todos los procedimientos requieren sesión autenticada. La identidad, permisos y timestamps se derivan en servidor. No existe una conexión global persistente: la UI consulta tRPC y puede hacer polling corto únicamente mientras el usuario está dentro del chat activo.

## Procedimientos tRPC

### `messaging.sendMessage`

```ts
{ conversationId: string; clientMessageId: string; body?: string; attachmentIds: string[] }
```

Valida membresía, deduplica por `(conversationId, senderId, clientMessageId)`, persiste mensaje y adjuntos en una transacción y devuelve el payload con ID de servidor. Después del commit dispara email de forma asíncrona; un fallo del proveedor no revierte la persistencia ni la respuesta tRPC.

### `messaging.listMessages`

```ts
{ conversationId: string; cursor?: string; limit?: number }
```

Devuelve `{ items, nextCursor }` ordenado por `createdAt DESC, id DESC`. Solo participantes autorizados pueden consultar el historial.

### `messaging.markRead`

```ts
{ conversationId: string; messageId: string }
```

Actualiza el cursor de lectura del participante autorizado.

### `messaging.getUnreadCount`

```ts
{ conversationId?: string }
```

Devuelve `{ count }` para badges y consultas ligeras desde `/messages`, dashboard o navegación global.

### Adjuntos

- `messaging.createAttachmentUpload({ conversationId, mimeType, byteSize, checksum? })` devuelve URL prefirmada y `attachmentId`.
- `messaging.confirmAttachment({ attachmentId })` verifica los metadatos.
- Solo un adjunto confirmado puede referenciarse en `messaging.sendMessage`.

## Cliente web

```text
/messages/[conversationId]
    ├── listMessages al entrar
    ├── sendMessage con actualización optimista
    ├── polling corto opcional mientras el chat está activo
    └── markRead al avanzar el viewport

Header / dashboard
    └── getUnreadCount bajo demanda o con polling espaciado
```

## Errores

`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`. Las respuestas no incluyen tokens, stack traces ni detalles internos.
