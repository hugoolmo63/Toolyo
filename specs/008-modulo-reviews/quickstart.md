# Quickstart de validación — Reviews y Reputación

1. Preparar una reserva `completed` con renter y owner.
2. Enviar la review del renter dentro de 14 días y verificar estado oculto.
3. Enviar la review del owner y verificar publicación simultánea y agregados.
4. Repetir con una sola review y avanzar el reloj más de 14 días; verificar publicación y agregado de la review enviada sin review automática para la parte ausente.
5. Verificar rechazo de estados no `completed`, fuera de plazo, duplicados y usuarios no participantes.
6. Reportar una review, resolverla y comprobar visibilidad y trazabilidad.

## US1 — Review del renter

- `reviews.createRenterReview` solo acepta al renter de una reserva `completed` dentro de 14 días.
- La review se crea con estado persistente `hidden` mientras espera la segunda review.
- `reviews.getPendingForBooking` devuelve `pending` si no existe review y `hidden` junto con los datos propios si ya fue enviada; nunca expone la review del owner.
- Los duplicados, reservas no completadas, ventanas expiradas y usuarios no autorizados son rechazados.

Resultado focalizado validado: 2 archivos de integración y 6 tests pasan.

## US2 — Review del owner

- `reviews.createOwnerReview` solo acepta al owner de una reserva `completed` dentro de 14 días.
- Las categorías obligatorias son Comunicación, Puntualidad y Cuidado del producto.
- La review se persiste como `hidden` y queda pendiente del doble ciego.
- El renter no puede utilizar el procedimiento owner y los duplicados se rechazan.

Resultado focalizado validado: 3 archivos unitarios y 6 tests de integración pasan.

## Polish y validación final

- La primera review se guarda como `hidden` con `expiresAt = Booking.completedAt + 14 días`.
- La segunda review publica ambas reviews en una única transacción y comparte `publishedAt`.
- `publishExpiredReviews` publica de forma idempotente las reviews `hidden` cuyo `expiresAt` ya venció; no modifica reviews `under_review`.
- Las pruebas E2E de reviews se ejecutan con `E2E_REVIEWS_ENABLED=1` cuando existe un entorno seed con los fixtures documentados en los specs.
- La prueba de accesibilidad usa `axe-core` y verifica formularios, diálogo de reporte y estado de moderación.

### Resultado del benchmark T053

El benchmark ejecutado en `development/tests/performance/reviews/reviews.performance.test.ts` procesa 10.000 reviews publicadas y 50 peticiones concurrentes.

Resultados: ver `benchmark-results.json`; el último resultado fue **PASS**, con p95 por debajo de 500 ms y tasa de errores inferior al 0,1%.

### Comandos de cierre T055

```bash
cd development
npx prisma validate
npx tsc --noEmit
npm test -- --reporter=dot
npm run test:integration -- --reporter=dot
npx playwright test
```

En el entorno local utilizado para esta implementación, Playwright pudo descubrir los 8 escenarios configurados, pero el servidor Next.js no arrancó porque faltan las variables obligatorias de almacenamiento (`STORAGE_PUBLIC_BASE_URL`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID` y `STORAGE_SECRET_ACCESS_KEY`). Los tests E2E de reviews requieren además `E2E_REVIEWS_ENABLED=1` y fixtures seed de reviews; se omiten de forma explícita cuando ese entorno no está disponible.

```bash
cd development
npx prisma validate
npm test
npm run test:integration
npx tsc --noEmit
```