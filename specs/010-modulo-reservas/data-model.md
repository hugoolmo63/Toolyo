# Data Model: Booking

## Booking

`Booking` representa una solicitud y posterior operación de alquiler entre un renter y el owner de un listing.

### Campos

| Campo | Tipo Prisma propuesto | Reglas y propósito |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador no enumerable. |
| `listingId` | `String` | FK obligatoria a `Listing`; el listing determina owner y `pricePerDay`. |
| `renterId` | `String` | FK obligatoria a `User`; se deriva de la sesión. |
| `ownerId` | `String` | FK obligatoria a `User`; snapshot relacional del owner del listing para consultas y auditoría. Debe coincidir con `Listing.ownerId` al crear. |
| `conversationId` | `String @unique` | FK obligatoria a `Conversation` una vez creada; enlaza el flujo de reserva con mensajería. |
| `startDate` | `DateTime @db.Date` | Fecha inclusiva de inicio; no puede ser pasada en solicitudes normales. |
| `endDate` | `DateTime @db.Date` | Fecha exclusiva de fin; debe ser posterior a `startDate`. |
| `status` | `BookingStatus @default(pending)` | Estado del ciclo de vida. |
| `pricePerDay` | `Decimal @db.Decimal(19,4)` | Snapshot de la tarifa del listing en el momento de solicitud. |
| `totalDays` | `Int` | `endDate - startDate`, mínimo 1. |
| `subtotal` | `Decimal @db.Decimal(19,4)` | `pricePerDay * totalDays`. |
| `serviceFee` | `Decimal @db.Decimal(19,4)` | Comisión calculada por la política vigente y congelada en la reserva. |
| `totalPrice` | `Decimal @db.Decimal(19,4)` | `subtotal + serviceFee`. |
| `currencyCode` | `String @db.Char(3) @default("EUR")` | Moneda del snapshot financiero. |
| `idempotencyKey` | `String` | Clave del request; única por renter para reintentos seguros. |
| `rejectionReason` | `String? @db.Text` | Motivo opcional del owner al rechazar; visible a participantes. |
| `lastTransitionById` | `String?` | Usuario que ejecutó la última transición. |
| `createdAt` | `DateTime @default(now()) @db.Timestamptz(6)` | Auditoría. |
| `updatedAt` | `DateTime @updatedAt @db.Timestamptz(6)` | Auditoría. |
| `deletedAt` | `DateTime? @db.Timestamptz(6)` | Soft delete; no usar para ocultar una disputa o auditoría. |

### Relaciones

- `listing Listing @relation(fields: [listingId], references: [id], onDelete: Restrict)`: un listing puede tener muchas reservas.
- `renter User @relation("BookingRenter", fields: [renterId], references: [id], onDelete: Restrict)`: un usuario puede solicitar muchas reservas.
- `owner User @relation("BookingOwner", fields: [ownerId], references: [id], onDelete: Restrict)`: un owner puede gestionar muchas reservas.
- `conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Restrict)`: cada reserva tiene exactamente una conversación contextual.
- `statusHistory BookingStatusHistory[]`: historial completo de transiciones de estado.

La relación `Conversation.bookingId` del Módulo 5 puede representar la FK inversa. Debe elegirse una sola dirección física de FK para evitar un ciclo de creación: se recomienda que `Booking.conversationId` sea obligatorio/único y que `Conversation` exponga la relación inversa opcional; la conversación se crea primero dentro de la transacción y se actualiza el booking con su ID antes del commit, o se permite temporalmente nullable durante la misma transacción según las capacidades de la migración.

## BookingStatusHistory

`BookingStatusHistory` registra cada transición de estado de una reserva y proporciona la trazabilidad completa exigida por `FR-013`. `lastTransitionById` en `Booking` puede conservarse como denormalización para lecturas rápidas, pero no sustituye este historial.

### Campos

| Campo | Tipo Prisma propuesto | Reglas y propósito |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador no enumerable. |
| `bookingId` | `String` | FK a `Booking` con `onDelete: Restrict`. |
| `fromStatus` | `BookingStatus?` | `null` únicamente para la transición inicial de creación. |
| `toStatus` | `BookingStatus` | Estado resultante de la transición. |
| `changedById` | `String` | FK a `User`; actor que ejecutó la transición. |
| `reason` | `String? @db.Text` | Motivo opcional, especialmente para rechazos y cancelaciones. |
| `createdAt` | `DateTime @default(now()) @db.Timestamptz(6)` | Timestamp asignado por el servidor. |

### Relaciones e índices

- `booking Booking @relation(fields: [bookingId], references: [id], onDelete: Restrict)`.
- `changedBy User @relation(fields: [changedById], references: [id], onDelete: Restrict)`.
- `@@index([bookingId, createdAt])` para consultar la línea temporal de una reserva.
- `@@index([changedById, createdAt])` para auditoría por actor.

Cada creación de `Booking` debe insertar `null → pending`. Cada aceptación, rechazo o transición futura debe insertar una fila en `BookingStatusHistory` dentro de la misma transacción que modifica `Booking.status`.

## BookingStatus

```text
pending    → accepted
pending    → rejected
pending    → cancelled
accepted   → cancelled
accepted   → active
active     → completed
```

Estados:

- `pending`: solicitud enviada y pendiente de decisión del owner.
- `accepted`: owner aprobó la solicitud; el intervalo queda comprometido.
- `rejected`: owner rechazó la solicitud; no bloquea disponibilidad.
- `cancelled`: reserva cancelada por una parte autorizada según una política futura.
- `active`: alquiler en curso.
- `completed`: alquiler terminado; habilita procesos posteriores como reviews.

La primera entrega implementa creación en `pending`, `accepted`, `rejected` y listado. Las transiciones `cancelled`, `active` y `completed` quedan modeladas para no romper el contrato futuro, pero requieren reglas de cancelación/entrega separadas.

## Reglas financieras

1. `totalDays = endDate - startDate` en días de calendario.
2. `subtotal = pricePerDay * totalDays`.
3. `serviceFee` se calcula con la política vigente, con redondeo monetario definido antes de persistir.
4. `totalPrice = subtotal + serviceFee`.
5. Todos los importes se calculan y validan en servidor; ningún importe del cliente es confiable.
6. Los snapshots no se modifican si cambia el precio del listing.
7. No se usa `Float`; los importes usan `Decimal(19,4)`.

## Constraints e índices

- `@unique([renterId, idempotencyKey])` para reintentos idempotentes.
- `@@index([listingId, status, startDate, endDate])` para disponibilidad y conflictos.
- `@@index([renterId, createdAt])` y `@@index([ownerId, createdAt])` para listados por rol.
- `@@index([conversationId])` aunque sea unique, para planes de consulta explícitos si el proveedor lo requiere.
- Constraint lógica: `ownerId == listing.ownerId` y `renterId != ownerId`.
- Constraint lógica: `totalDays >= 1`, importes no negativos y `totalPrice == subtotal + serviceFee`.
- Para reservas `accepted`/`active`, no debe existir otra reserva compatible del mismo listing con intervalos solapados.

## Consistencia con Conversation

El procedimiento `booking.request` debe:

1. Autenticar al renter y cargar el listing con owner.
2. Validar fechas, disponibilidad e importes.
3. Crear una `Conversation` contextual y sus dos participantes, o recuperar la conversación de una solicitud idempotente previa.
4. Crear `Booking` referenciando esa conversación.
5. Confirmar todo en una transacción.
6. Devolver `bookingId`, `status` y `conversationId`.

No se debe emitir un evento de mensajería antes del commit. Tras el commit, el Módulo 5 puede abrir el room y los participantes pueden enviar mensajes.
