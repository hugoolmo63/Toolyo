# Quickstart de validación — Mensajería

## Prerrequisitos

- Node.js 20+, Docker y PostgreSQL de pruebas.
- Dependencias instaladas desde `/Users/hugoolmo63/Documents/projects/Toolyo/development/package-lock.json`.
- Variables `DATABASE_URL`, `SOCKET_IO_ORIGIN` y credenciales de almacenamiento configuradas en un entorno local; nunca usar secretos reales en fixtures.

## Validación estática y de unidad

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npm run db:generate
npm test -- --run tests/unit/messaging
npx tsc --noEmit
```

Esperado: schemas Zod rechazan body vacío, exceso de longitud, MIME no permitido e IDs ajenos; el servicio produce payloads compatibles con [contracts/messaging-events.md](contracts/messaging-events.md).

## Validación de persistencia y autorización

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npm run test:integration -- --run tests/integration/messaging
```

La suite debe comprobar: creación de conversación con dos miembros, rechazo de usuario externo, persistencia de mensaje antes del evento, deduplicación por `clientMessageId`, cursor estable y relación con `Booking`/`Listing`.

## Validación en tiempo real

Ejecutar el servidor de desarrollo y dos clientes autenticados (arrendador y arrendatario). Un cliente se une a la conversación, el otro emite `message:send`; ambos deben recibir `message:created` con el mismo `message.id`. Repetir con el receptor desconectado: al reconectar, `messaging.listMessages` debe devolver el mensaje persistido.

## Validación E2E

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npx playwright test tests/e2e/messaging.spec.ts
```

Escenario mínimo: login de dos usuarios → abrir conversación asociada a reserva → enviar texto → verificar recepción en segundo cliente → refrescar → verificar historial → intentar acceso con tercer usuario y esperar `FORBIDDEN`.

## Migración

```bash
cd /Users/hugoolmo63/Documents/projects/Toolyo/development
npx prisma migrate dev --name messaging_conversations_messages
npx prisma migrate status
```

Revisar el SQL antes de aplicar. Si `Booking` todavía no existe, no ejecutar una migración que declare una FK imposible: coordinarla con el módulo de reservas o crear primero la tabla base y después añadir la FK de mensajería.
