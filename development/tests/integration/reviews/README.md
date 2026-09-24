# Reviews foundational integration checkpoint

La fase foundational valida contra PostgreSQL real:

- `Review`, `ReviewCategoryScore` y `ReviewReport` con sus relaciones e índices.
- `Booking.completedAt` establecido al entrar en `completed`.
- Trigger `booking_completed_at_immutable`, que rechaza modificar `completedAt` después de completar una reserva.
- Seed y fixtures deterministas para reservas completadas.

Comandos:

```bash
cd development
npx prisma validate
npx prisma migrate status
npx prisma db seed
npm run test:integration -- tests/integration/bookings
```
