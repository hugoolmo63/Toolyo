# Especificación UX/UI: Reservas y Mensajería

**Módulo**: Reservas + Mensajería
**Documento**: 009
**Estado**: Propuesta de navegación y superficies UI
**Fecha**: 2026-09-23
**Alcance**: Next.js App Router, tRPC, Socket.io y componentes feature-based

## 1. Objetivo

Definir cómo se conectan las capacidades backend ya implementadas con las próximas superficies de experiencia de usuario:

- Búsqueda y descubrimiento de productos.
- Detalle público de un listing.
- Solicitud de reserva.
- Creación automática de una conversación.
- Chat persistente y tiempo real.
- Decisión del owner sobre una solicitud.
- Notificaciones y estados de conexión.

El objetivo es priorizar un vertical slice navegable y coherente antes de construir funcionalidades secundarias como moderación, plantillas o automatizaciones avanzadas.

---

## 2. Diagnóstico actual

### 2.1 Vistas existentes

| Superficie | Ruta | Estado | Componentes reutilizables |
|---|---|---|---|
| Home | `/` | Existente | Layout público y entrada a búsqueda |
| Búsqueda | `/search` | Existente | `SearchBar`, `FiltersPanel`, `ResultsList`, `ResultCard`, `ResultRow`, `MapView`, `SortSelector` |
| Detalle de producto | `/listings/[slug]` | Existente | `Gallery`, `Calendar`, `PriceTable`, `OwnerCard`, `ActionButtons`, reviews, reglas y ubicación |
| Dashboard base | `/dashboard` | Existente | Sesión, estado de cuenta, verificaciones y capacidades |
| Gestión de productos | `/dashboard/products` | Existente | `ListingManagementPanel`, `ListingCard`, formularios, edición y eliminación |
| Nuevo producto | `/dashboard/products/new` | Existente | `ListingForm`, editor de fotos |
| Edición de producto | `/dashboard/products/[listingId]/edit` | Existente | Formulario y controles de gestión |

### 2.2 Superficies pendientes

| Superficie | Ruta propuesta | Propósito |
|---|---|---|
| Bandeja de conversaciones | `/messages` | Lista de conversaciones, unread count y selección de hilo |
| Chat contextual | `/messages/[conversationId]` | Historial, tiempo real, adjuntos y contexto de reserva |
| Panel de reservas | `/dashboard/bookings` | Reservas del renter/owner, filtros y acciones |
| Detalle de reserva | `/dashboard/bookings/[bookingId]` | Fechas, desglose financiero, estado, historial y acceso al chat |
| Centro de notificaciones | Popover desde dashboard/header | Solicitudes nuevas, cambios de estado y mensajes offline |

### 2.3 Gaps de integración actuales

1. `ActionButtons` ya contiene los entry-points `Contactar` y `Reservar`, pero actualmente redirige a `/messages` y `/checkout`, rutas que todavía no existen.
2. El backend de reservas expone `booking.request`, `booking.accept`, `booking.reject`, `booking.list` y `booking.getById`, pero todavía no hay UI consumidora.
3. El backend de mensajería expone `messaging.listMessages`, `messaging.markRead`, uploads y Socket.io, pero todavía no hay `MessagingShell` ni `MessageComposer`.
4. El gateway Socket.io se encapsula en `createMessagingGateway(httpServer, prisma)`, pero todavía debe integrarse en un runtime HTTP persistente de Next.js/Node.
5. El backend puede producir notificaciones fallback, pero la UI necesita `NotificationBell`, badges, toasts y rehidratación desde `booking.list`.
6. El flujo visual de reservas no debe inventar una página `/checkout`: para el MVP la solicitud se confirma con un `BookingRequestDialog` y se navega directamente al chat contextual.

---

## 3. Contratos UX ↔ backend

### 3.1 Reservas

| Acción UI | Contrato | Resultado esperado |
|---|---|---|
| Confirmar solicitud | `booking.request` | Booking `pending`, Conversation y participantes creados atómicamente |
| Listar propias | `booking.list` | Items filtrados por renter/owner y cursor |
| Ver detalle | `booking.getById` | Fechas, total, estado y `conversationId` |
| Aceptar | `booking.accept` | Estado `accepted` e historial actualizado |
| Rechazar | `booking.reject` | Estado `rejected`, motivo opcional e historial actualizado |

### 3.2 Mensajería

| Acción UI | Contrato/evento | Resultado esperado |
|---|---|---|
| Cargar historial | `messaging.listMessages` | Página cursorizada de mensajes |
| Entrar al hilo | `conversation:join` | Room privado `conversation:{id}` tras ABAC |
| Enviar mensaje | `message:send` | ACK e inserción previa a `message:created` |
| Recibir mensaje | `message:created` | Inserción optimista reconciliada con ID de servidor |
| Marcar leído | `messaging.markRead` o `conversation:read` | `conversation:read-updated` para participantes |
| Adjuntar imagen | `createAttachmentUpload` + `confirmAttachment` | Upload confirmado y `attachmentId` en `message:send` |

Contratos detallados:

- [Contrato de reservas](../../specs/008-modulo-reservas/contracts/booking-router.md)
- [Contrato de eventos de mensajería](../../specs/007-modulo-mensajeria/contracts/messaging-events.md)

---

## 4. Jornada del Arrendatario (Renter Flow)

### 4.1 Diagrama principal

```text
┌──────────────┐
│ Home / Search│
└──────┬───────┘
       │ seleccionar listing
       ▼
┌─────────────────────┐
│ /listings/[slug]    │
│ Gallery + Calendar  │
└─────────┬───────────┘
          │ seleccionar ?start=&end=
          ▼
┌─────────────────────────────┐
│ BookingRequestDialog        │
│ fechas + resumen financiero  │
└─────────┬───────────────────┘
          │ booking.request
          ▼
┌─────────────────────────────┐
│ Booking creado: pending     │
│ Conversation creada         │
└─────────┬───────────────────┘
          │ router.replace
          ▼
┌─────────────────────────────┐
│ /messages/[conversationId]  │
│ Contexto Booking + Chat     │
└─────────┬───────────────────┘
          │ conversation:join
          ▼
┌─────────────────────────────┐
│ message:send / message:     │
│ created / conversation:read  │
└─────────────────────────────┘
```

### 4.2 Detalle del producto

Ruta existente:

```text
/listings/[slug]
```

El `Calendar` existente mantiene el rango en la URL:

```text
/listings/camara-4k?start=2030-06-01&end=2030-06-04
```

La URL es la fuente de verdad para:

- Restaurar la selección tras login.
- Compartir un rango de fechas.
- Evitar perder el contexto durante una navegación.

### 4.3 `BookingRequestDialog`

El botón `Reservar` debe abrir un modal en desktop y un drawer/bottom sheet en móvil.

```text
┌──────────────────────────────────────┐
│ Solicitar reserva                    │
├──────────────────────────────────────┤
│ Cámara mirrorless 4K                 │
│                                      │
│ Inicio       01/06/2030              │
│ Fin          04/06/2030              │
│                                      │
│ 3 días × 20 €                  60 €  │
│ Comisión de servicio              6 €│
│ Total                            66 €│
│                                      │
│ Se abrirá un chat con el owner       │
│ después de enviar la solicitud.      │
│                                      │
│ [Cancelar]       [Enviar solicitud]  │
└──────────────────────────────────────┘
```

Estados:

```text
idle → validating → submitting → success
                         └──────→ error
```

Input enviado al backend:

```ts
{
  listingId,
  startDate,
  endDate,
  idempotencyKey
}
```

El frontend no envía importes. El servidor calcula `pricePerDay`, `totalDays`, `subtotal`, `serviceFee` y `totalPrice`.

### 4.4 Redirección al chat

Tras `booking.request`:

```ts
router.replace(`/messages/${conversationId}?booking=${bookingId}`);
```

El chat debe mostrar antes de los mensajes un `BookingContextBanner`:

```text
Solicitud enviada · Pendiente de respuesta
01 jun – 04 jun · Total 66 €
```

Después, el cliente:

1. Carga historial con `messaging.listMessages`.
2. Conecta Socket.io.
3. Ejecuta `conversation:join`.
4. Marca el último mensaje visible como leído.
5. Escucha `message:created`.

---

## 5. Jornada del Arrendador (Owner Flow)

### 5.1 Diagrama principal

```text
                 ┌────────────────────┐
                 │ booking.request    │
                 │ crea pending       │
                 └─────────┬──────────┘
                           ▼
                 ┌────────────────────┐
                 │ Owner conectado    │
                 └─────────┬──────────┘
                           │ Socket / polling / query
                           ▼
                 ┌────────────────────┐
                 │ BookingRequestToast│
                 │ + NotificationBell │
                 └──────┬─────┬───────┘
                        │     │
             /messages │     │ /dashboard/bookings
                        ▼     ▼
              ┌──────────────────────┐
              │ Conversation / Panel │
              │ BookingActionCard    │
              └──────────┬───────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        booking.accept     booking.reject
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌───────────────┐
        │ accepted     │  │ rejected      │
        │ chat activo  │  │ motivo visible│
        └──────────────┘  └───────────────┘
```

### 5.2 Entrada por panel de reservas

Ruta propuesta:

```text
/dashboard/bookings
```

Query inicial:

```ts
api.booking.list.useQuery({
  role: "owner",
  status: "pending",
  limit: 20
});
```

Vista:

```text
┌──────────────────────────────────────┐
│ Reservas                              │
├──────────────────────────────────────┤
│ [Pendientes] [Aceptadas] [Historial] │
├──────────────────────────────────────┤
│ Cámara mirrorless 4K                 │
│ Carlos Ruiz · 01–04 jun · 66 €       │
│                                      │
│ [Ver conversación] [Aceptar]         │
│ [Rechazar]                            │
└──────────────────────────────────────┘
```

### 5.3 Entrada por bandeja de mensajes

Ruta propuesta:

```text
/messages
```

Desktop:

```text
┌─────────────────────┬──────────────────────────┐
│ ConversationList    │ ConversationPanel        │
├─────────────────────┼──────────────────────────┤
│ Nueva solicitud     │ BookingContextBanner     │
│ Cámara · Pendiente  │ MessageList              │
│                     │ BookingActionCard        │
│ Otro chat           │ MessageComposer          │
└─────────────────────┴──────────────────────────┘
```

Móvil:

```text
/messages
    ↓ seleccionar conversación
/messages/[conversationId]
```

### 5.4 `BookingRequestToast` y notificaciones

El owner debe tener dos mecanismos:

1. Notificación en tiempo real si hay Socket.io activo.
2. Rehidratación desde `booking.list` al abrir dashboard/messages si estuvo offline.

Componentes:

```text
NotificationBell
NotificationBadge
NotificationPopover
BookingRequestToast
```

Ejemplo:

```text
Nueva solicitud de reserva
Carlos Ruiz quiere reservar Cámara mirrorless 4K

[Ver solicitud]
```

### 5.5 `BookingActionCard`

Estado `pending`:

```text
┌──────────────────────────────────────┐
│ Solicitud de reserva                 │
│ Cámara mirrorless 4K                 │
│ 01 jun – 04 jun · 66 €               │
│                                      │
│ [Aceptar reserva] [Rechazar]         │
└──────────────────────────────────────┘
```

Estado `accepted`:

```text
┌──────────────────────────────────────┐
│ Reserva aceptada                     │
│ Continúa la coordinación por chat.  │
└──────────────────────────────────────┘
```

Estado `rejected`:

```text
┌──────────────────────────────────────┐
│ Solicitud rechazada                  │
│ Motivo: Fechas no disponibles        │
└──────────────────────────────────────┘
```

El botón `Rechazar` abre `RejectBookingDialog` con un motivo opcional de máximo 500 caracteres.

---

## 6. Chat contextual y tiempo real

### 6.1 Ruta

```text
/messages/[conversationId]
```

### 6.2 Layout

```text
┌────────────────────────────────────────────┐
│ ← Mensajes                                 │
├────────────────────────────────────────────┤
│ Producto / Reserva                         │
│ Cámara mirrorless 4K · Pendiente           │
│ 01 jun – 04 jun · 66 €                     │
├────────────────────────────────────────────┤
│                                            │
│ Mensajes                                  │
│                                            │
├────────────────────────────────────────────┤
│ [Adjuntar] Escribe un mensaje... [Enviar] │
└────────────────────────────────────────────┘
```

Componentes:

```text
MessagingShell
ConversationHeader
BookingContextBanner
MessageList
MessageBubble
MessageComposer
AttachmentPicker
ConnectionStatus
UnreadBadge
ReadReceipt
```

### 6.3 Estados del socket

```text
connecting → connected → reconnecting → connected
                         └────────────→ offline
```

Reglas UX:

- `message:created` reconcilia el mensaje optimista usando el ID de servidor.
- La desconexión no elimina mensajes enviados: el historial se recupera con `listMessages`.
- `clientMessageId` evita duplicados al reintentar.
- `conversation:read` se emite cuando el último mensaje visible entra en viewport.

---

## 7. Rutas App Router propuestas

```text
src/app/
├── (public)/
│   ├── page.tsx
│   ├── search/
│   └── listings/[slug]/
│
└── (app)/
    ├── dashboard/
    │   ├── page.tsx
    │   ├── bookings/
    │   │   ├── page.tsx
    │   │   ├── loading.tsx
    │   │   └── [bookingId]/
    │   │       ├── page.tsx
    │   │       ├── loading.tsx
    │   │       └── error.tsx
    │   └── products/
    │
    └── messages/
        ├── page.tsx
        ├── loading.tsx
        ├── error.tsx
        └── [conversationId]/
            ├── page.tsx
            ├── loading.tsx
            └── error.tsx
```

### Responsabilidades de las páginas

| Página | Responsabilidad |
|---|---|
| `/dashboard/bookings` | Listar solicitudes/reservas por rol y filtros |
| `/dashboard/bookings/[bookingId]` | Mostrar detalle, timeline, total y conversación |
| `/messages` | Bandeja master-detail y unread count |
| `/messages/[conversationId]` | Historial, Socket.io, composer y BookingActionCard |

---

## 8. Organización feature-based

### `src/features/bookings`

```text
src/features/bookings/
├── application/
│   └── booking.client-actions.ts
├── domain/
│   └── booking-view-model.ts
├── presentation/
│   ├── booking-request-dialog.tsx
│   ├── booking-summary.tsx
│   ├── booking-confirmation.tsx
│   ├── booking-status-badge.tsx
│   ├── booking-list.tsx
│   ├── booking-list-item.tsx
│   ├── booking-detail.tsx
│   ├── booking-action-card.tsx
│   ├── owner-booking-actions.tsx
│   ├── reject-booking-dialog.tsx
│   └── booking-empty-state.tsx
└── shared/
    └── booking-ui.schema.ts
```

### `src/features/messaging`

```text
src/features/messaging/
├── application/
│   ├── messaging.client.ts
│   └── socket-client.ts
├── domain/
│   ├── conversation-view-model.ts
│   └── message-view-model.ts
├── presentation/
│   ├── messaging-shell.tsx
│   ├── conversation-list.tsx
│   ├── conversation-list-item.tsx
│   ├── conversation-header.tsx
│   ├── booking-context-banner.tsx
│   ├── message-list.tsx
│   ├── message-bubble.tsx
│   ├── message-composer.tsx
│   ├── attachment-picker.tsx
│   ├── connection-status.tsx
│   ├── unread-badge.tsx
│   └── read-receipt.tsx
├── infrastructure/
│   └── socket-client.ts
└── shared/
    └── messaging-ui.schema.ts
```

### `src/features/notifications`

```text
src/features/notifications/
├── application/
│   └── notification-query.ts
├── presentation/
│   ├── notification-bell.tsx
│   ├── notification-badge.tsx
│   ├── notification-popover.tsx
│   ├── booking-request-toast.tsx
│   └── toast-provider.tsx
└── shared/
    └── notification-ui.schema.ts
```

---

## 9. Plan de implementación por iteraciones

### I1 — Solicitud + chat básico

**Objetivo**: completar el camino crítico del renter.

```text
/listings/[slug]
    → BookingRequestDialog
    → booking.request
    → /messages/[conversationId]
    → conversation:join
    → listMessages
    → message:send / message:created
```

Componentes:

1. `BookingRequestDialog`.
2. `BookingSummary`.
3. Integración de `ActionButtons` con `booking.request`.
4. `/messages/[conversationId]`.
5. `MessagingShell`.
6. `BookingContextBanner`.
7. `MessageList`.
8. `MessageComposer`.
9. `ConnectionStatus`.

**Criterio de salida**: el renter puede solicitar una reserva y enviar/recibir un mensaje persistente en el chat contextual.

### I2 — Panel Owner + decisiones

**Objetivo**: permitir que el owner resuelva solicitudes sin abandonar el flujo de conversación.

```text
booking.request
    → BookingRequestToast / NotificationBell
    → /dashboard/bookings o /messages
    → BookingActionCard
    → booking.accept / booking.reject
    → estado actualizado en panel y chat
```

Componentes:

1. `/dashboard/bookings`.
2. `BookingList`.
3. `BookingListItem`.
4. `BookingActionCard`.
5. `OwnerBookingActions`.
6. `RejectBookingDialog`.
7. `BookingRequestToast`.
8. `NotificationBell`.

**Criterio de salida**: el owner puede aceptar/rechazar desde el panel o chat y ambos usuarios ven el estado actualizado.

### I3 — Bandeja completa y adjuntos

**Objetivo**: mejorar la operación diaria del chat.

```text
/messages
    → ConversationList
    → unread counts
    → MessageList
    → AttachmentPicker
    → createAttachmentUpload
    → confirmAttachment
    → message:send(attachmentIds)
```

Componentes:

- `ConversationList`.
- `UnreadBadge`.
- `AttachmentPicker`.
- `AttachmentPreview`.
- `UploadProgress`.
- `ReadReceipt`.
- `ReconnectBanner`.

**Criterio de salida**: los usuarios pueden encontrar conversaciones, recuperar historial y compartir imágenes validadas.

### I4 — Refinamiento operativo

**Objetivo**: robustecer estados secundarios y comunicación offline.

Incluye:

- Centro de notificaciones completo.
- Emails/push reales según preferencias.
- Estados de reconexión avanzados.
- Moderación y reportes.
- Plantillas de respuesta rápida.
- Telemetría UX: tiempo hasta solicitar, tiempo hasta aceptar y tasa de abandono del modal.

---

## 10. Estados UX obligatorios

Cada superficie debe definir explícitamente sus estados:

```text
loading
empty
ready
submitting
success
error
offline / reconnecting
forbidden
not-found
```

### Reserva

```text
idle → validating → submitting → success
                         └──────→ error
```

### Chat

```text
connecting → connected → reconnecting → connected
                         └────────────→ offline
```

### Decisión owner

```text
pending → accepting → accepted
   │
   └────→ rejecting → rejected
```

Los botones deben deshabilitarse durante la mutación y las respuestas deben invalidar las queries relacionadas:

- `booking.list`.
- `booking.getById`.
- `messaging.listMessages`.

---

## 11. Accesibilidad y responsive

- `BookingRequestDialog` debe usar foco atrapado y cerrar con `Escape`.
- En móvil, el modal debe convertirse en bottom sheet usable con teclado y lector de pantalla.
- Las acciones `Aceptar` y `Rechazar` deben tener etiquetas explícitas y estados de loading anunciables.
- `MessageList` debe mantener el foco del composer al enviar.
- Los mensajes nuevos deben anunciarse de forma no intrusiva mediante una región `aria-live`.
- Las fechas deben ser legibles en formato localizado, manteniendo `YYYY-MM-DD` solo en contratos.
- Los estados de reserva no deben depender únicamente del color; usar texto y badge.
- Usar `data-testid` estable en botones críticos y filas de reserva para E2E.

---

## 12. Decisiones y siguientes pasos

Orden recomendado:

1. Implementar I1 sin crear una ruta `/checkout` intermedia.
2. Integrar `ActionButtons` con `BookingRequestDialog`.
3. Construir `/messages/[conversationId]` y su cliente Socket.io.
4. Implementar I2 con `/dashboard/bookings` y `BookingActionCard`.
5. Añadir `/messages` como bandeja master-detail.
6. Integrar adjuntos y notificaciones visuales en I3/I4.

Antes de activar E2E completo debe resolverse el bootstrap del gateway:

```text
Next.js + servidor HTTP persistente
        ├── App Router
        └── Socket.io Gateway
```

La UI no debe considerar el evento Socket.io como única fuente de verdad: al entrar en dashboard, reservas o mensajes siempre debe rehidratarse desde tRPC.
