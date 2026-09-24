# Data Model: Reviews y Reputación

## Review

Valoración de una parte de una reserva hacia la otra parte y, cuando aplica, hacia el producto.

La ventana de elegibilidad se calcula estrictamente desde `Booking.completedAt`. Este campo se establece una única vez cuando la reserva entra en estado `completed` y es inmutable después; la capa de dominio y PostgreSQL deben rechazar cualquier modificación posterior.

| Campo | Regla |
|---|---|
| `bookingId` | Reserva obligatoria y `completed`. |
| `authorId` / `revieweeId` | Participantes distintos de la reserva. |
| `listingId` | Obligatorio para renter → owner/producto. |
| `direction` | `renter_to_owner` o `owner_to_renter`. |
| `overallRating` | Entero 1–5. |
| `comment` | Texto opcional y moderable. |
| `status` | `hidden`, `published`, `under_review`, `removed`. |
| `submittedAt` / `publishedAt` | Trazabilidad de envío y publicación. |

Unicidad: `(bookingId, authorId, direction)`.

## ReviewCategoryScore

Puntuación 1–5 por categoría, con una puntuación por `(reviewId, category)`.

- Renter → owner: `communication`, `punctuality`, `product_condition`.
- Owner → renter: `communication`, `product_care`, `punctuality`.

## ReviewReport

Incluye `reviewId`, `reporterId`, motivo, descripción opcional, estado, resolución, moderador y timestamps. Un usuario no puede duplicar un reporte activo equivalente.

Crear un `ReviewReport` no cambia automáticamente la review a `hidden` ni la elimina. La review permanece visible mientras el reporte esté abierto. Un moderador autorizado puede marcarla `under_review` como flag de moderación; durante ese estado sigue visible hasta la resolución. La resolución la deja en `published` confirmada o `removed`.

## Transiciones

```text
hidden → published       (ambas reviews enviadas o ventana vencida)
published → under_review (flag aplicado por moderación; permanece visible)
under_review → removed   (moderación confirma incumplimiento)
under_review → published (moderación descarta reporte)
```

Al vencer los 14 días, una única review enviada se publica y participa en agregados; no se crea review para la parte ausente.

El job de vencimientos es idempotente: las ejecuciones repetidas solo procesan reviews aún elegibles y no crean duplicados ni realizan transiciones inválidas.

## Agregados

Listing y usuario muestran promedio general con una decimal, recuento y promedios por categoría. Solo cuentan reviews `published`.