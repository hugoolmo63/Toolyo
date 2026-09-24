# Contrato tRPC: `reviewRouter`

## `review.submit`

Input: `bookingId`, `overallRating` de 1 a 5, `categoryScores` de 1 a 5 y `comment` opcional.

Solo participantes de una reserva `completed` dentro de 14 días pueden enviar. La dirección se deriva del actor y no se permiten duplicados.

Output: `reviewId`, estado (`hidden` o `published`), motivo de publicación y `publishedAt`.

## Consultas públicas y privadas

- `review.getForParticipant({ bookingId })`: estado propio sin romper el doble ciego.
- `review.getListingReputation({ listingId })`: promedio, recuento y categorías publicadas.
- `review.getUserReputation({ userId })`: promedio, recuento y categorías publicadas.

## Moderación

- `review.report({ reviewId, reason, description? })`: crea un reporte activo sin duplicados; no cambia automáticamente la review a `hidden` ni la elimina, y la review permanece visible mientras el reporte esté abierto.
- `review.resolveReport({ reportId, decision, resolution })`: procedimiento restringido a moderación y trazable. El moderador puede marcar la review `under_review` como flag manteniéndola visible; al resolver debe dejarla `published` confirmada o `removed`.

## Ventana temporal e idempotencia

- `review.submit` calcula los 14 días exclusivamente desde `Booking.completedAt`.
- `Booking.completedAt` se establece una vez al entrar en `completed` y no puede modificarse después.
- El job de expiración puede ejecutarse repetidamente; cada review se publica como máximo una vez.