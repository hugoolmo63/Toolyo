# Contrato tRPC: `bookingRouter`

Todos los procedimientos requieren un usuario autenticado. El router valida con Zod, deriva la identidad desde la sesión y delega en el servicio de reservas. Las respuestas no exponen datos privados de usuarios que no sean necesarios para la operación.

## `booking.request`

Solicita una reserva y crea la conversación contextual en la misma transacción.

### Input

```ts
{
  listingId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD, exclusiva
  idempotencyKey: string;
}
```

### Reglas

- El actor autenticado se usa como `renterId`.
- `ownerId` se obtiene desde `Listing.ownerId`; no se acepta del cliente.
- El listing debe estar publicado, activo y no eliminado.
- El actor no puede ser owner del listing.
- El rango debe ser válido y estar disponible.
- Los importes se calculan en servidor.
- Se crea o recupera una `Conversation` con renter y owner y se asocia mediante `conversationId`.
- Una repetición con el mismo `idempotencyKey` devuelve el resultado original si los parámetros coinciden; si no, devuelve `CONFLICT`.

### Output

```ts
{
  id: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  conversationId: string;
  startDate: string;
  endDate: string;
  status: "pending";
  financials: {
    pricePerDay: string;
    totalDays: number;
    subtotal: string;
    serviceFee: string;
    totalPrice: string;
    currencyCode: "EUR";
  };
  createdAt: string;
}
```

### Errors

`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`, `BOOKING_CONFLICT`, `CONFLICT`.

## `booking.accept`

Acepta una solicitud pendiente del owner del listing.

### Input

```ts
{ bookingId: string }
```

### Output

```ts
{
  bookingId: string;
  status: "accepted";
  conversationId: string;
  transitionedAt: string;
  transitionedBy: string;
}
```

### Reglas

- El actor debe ser el `ownerId` de la reserva.
- El estado actual debe ser `pending`.
- Se revalida disponibilidad dentro de la transacción.
- La transición y cualquier bloqueo/actualización de disponibilidad son atómicos.

### Errors

`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `INVALID_STATE`, `BOOKING_CONFLICT`.

## `booking.reject`

Rechaza una solicitud pendiente del owner.

### Input

```ts
{
  bookingId: string;
  reason?: string; // máximo 500 caracteres
}
```

### Output

```ts
{
  bookingId: string;
  status: "rejected";
  conversationId: string;
  rejectionReason: string | null;
  transitionedAt: string;
  transitionedBy: string;
}
```

### Reglas

- El actor debe ser el owner de la reserva.
- El estado actual debe ser `pending`.
- El motivo se sanitiza, limita y queda visible únicamente a los participantes autorizados.

### Errors

`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `INVALID_STATE`, `VALIDATION_ERROR`.

## `booking.list`

Lista reservas en las que el actor participa como renter o owner.

### Input

```ts
{
  role?: "renter" | "owner" | "all";
  status?: "pending" | "accepted" | "rejected" | "cancelled" | "active" | "completed";
  listingId?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  cursor?: string;
  limit?: number; // 1..50, default 20
}
```

### Output

```ts
{
  items: Array<{
    id: string;
    listing: { id: string; title: string; slug: string };
    renter: { id: string; displayName: string | null };
    owner: { id: string; displayName: string | null };
    startDate: string;
    endDate: string;
    status: string;
    totalPrice: string;
    currencyCode: string;
    conversationId: string;
    createdAt: string;
  }>;
  nextCursor: string | null;
}
```

### Reglas

- El actor se filtra siempre por `renterId` u `ownerId`; nunca puede listar reservas ajenas.
- Orden estable: `createdAt DESC, id DESC`.
- El cursor es opaco y no permite modificar el filtro de autorización.
- Los filtros de fechas deben validar `fromDate <= toDate`.

## `booking.getById`

Obtiene el detalle de una reserva para un renter o owner autorizado.

### Input

```ts
{
  bookingId: string;
}
```

### Output

```ts
{
  id: string;
  listing: { id: string; title: string; slug: string };
  renter: { id: string; displayName: string | null };
  owner: { id: string; displayName: string | null };
  startDate: string;
  endDate: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "active" | "completed";
  financials: {
    pricePerDay: string;
    totalDays: number;
    subtotal: string;
    serviceFee: string;
    totalPrice: string;
    currencyCode: string;
  };
  conversationId: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Reglas

- El actor debe coincidir con `renterId` o `ownerId`.
- Un usuario no relacionado recibe `FORBIDDEN` o `NOT_FOUND` según la política de privacidad.
- `conversationId` solo se devuelve a usuarios autorizados.
- La respuesta no incluye información privada innecesaria.

### Errors

`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`.

## Integración con Módulo 5

`booking.request` es el punto de integración obligatorio:

1. Llama al servicio de conversación para crear un hilo con contexto `bookingId`/`listingId`.
2. Añade al renter y owner como participantes.
3. Persiste la relación única entre `Booking` y `Conversation`.
4. Devuelve `conversationId` en la respuesta.
5. Después del commit, la UI puede navegar al hilo de mensajería o conectarse al room correspondiente.

La operación no debe depender de que exista un mensaje inicial. La conversación queda disponible para que cualquiera de los dos participantes envíe el primer mensaje mediante los contratos de CHAT-001/CHAT-002.
