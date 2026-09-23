---

description: "Task list for the implementation of the reservations and messaging MVP"

---

# Tasks: Módulo de Reservas y Mensajería MVP

**Input**: Design documents from `/Users/hugoolmo63/Documents/projects/Toolyo/specs/008-modulo-reservas/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/booking-router.md`; messaging contracts from `specs/007-modulo-mensajeria/contracts/messaging-events.md`.

**Tests**: Included because the feature specification explicitly requires unit and integration tests for booking transactions and Socket.io persistence/emission behavior.

**Implementation root**: `/Users/hugoolmo63/Documents/projects/Toolyo/development/`

## Phase 1: Capa de Datos (Prisma Schema & Migrations)

**Goal**: Crear el modelo persistente de reservas y mensajería, sus enums, relaciones, índices, migración y fixtures reproducibles.

**Independent validation**: `npx prisma validate`, `npx prisma generate`, `npx prisma migrate dev` en una base PostgreSQL de desarrollo y ejecución del seed sin violaciones de FK o constraints.

- [X] T001 [P] Revisar el schema actual y documentar en `development/prisma/schema.prisma` los puntos de integración de `Booking` con `User`, `Listing` y `Conversation`, verificando que no se dupliquen relaciones existentes.
- [X] T002 [P] Añadir las dependencias `socket.io` y `socket.io-client` con versiones compatibles con Node.js 20 en `development/package.json` y actualizar `development/package-lock.json` mediante npm.
- [X] T003 Definir los enums `BookingStatus`, `MessageType` y `AttachmentType` en `development/prisma/schema.prisma`, incluyendo estados `pending`, `accepted`, `rejected`, `cancelled`, `active` y `completed`, y documentando los valores de texto, imagen y adjunto.
- [X] T004 Definir los modelos `Conversation`, `ConversationParticipant`, `Message` y `MessageAttachment` en `development/prisma/schema.prisma`, incluyendo `createdAt`, `updatedAt`, `deletedAt`, relaciones a `User`, claves compuestas, índices de historial y `onDelete` explícito.
- [X] T005 Definir los modelos `Booking` y `BookingStatusHistory` en `development/prisma/schema.prisma` con `listingId`, `renterId`, `ownerId`, `conversationId`, fechas, estados anterior/nuevo, actor, motivo, timestamps, snapshot financiero, idempotencia y relación única con `Conversation`.
- [X] T006 Resolver la dirección física de la FK entre `Booking` y `Conversation` en `development/prisma/schema.prisma` y `development/prisma/migrations/`, evitando un ciclo de inserción y garantizando que la operación transaccional pueda crear la conversación y la reserva sin registros huérfanos.
- [X] T007 Añadir constraints e índices para idempotencia, disponibilidad y listados en `development/prisma/schema.prisma`, incluyendo unicidad de `renterId + idempotencyKey`, índices por listing/estado/fechas, renter/owner y cursor de mensajes.
- [X] T008 Ejecutar `npx prisma format`, `npx prisma validate` y `npx prisma generate` desde `/Users/hugoolmo63/Documents/projects/Toolyo/development/`, corrigiendo relaciones, tipos `Decimal`, fechas `@db.Date` y timestamps `@db.Timestamptz(6)` hasta que el schema sea válido.
- [X] T009 Generar la migración `development/prisma/migrations/<timestamp>_add_bookings_and_messaging/migration.sql` con `npx prisma migrate dev --name add_bookings_and_messaging`, revisar SQL a SQL y confirmar que no modifica destructivamente migraciones existentes.
- [X] T010 [P] Crear o actualizar factories de usuarios, listings, bookings y conversaciones en `development/tests/fixtures/booking.fixtures.ts` y `development/tests/fixtures/messaging.fixtures.ts` con datos sintéticos, fechas deterministas y overrides para renter/owner.
- [X] T011 [P] Actualizar `development/prisma/seed.ts` para insertar un listing publicado, owner, renter, reserva de prueba en `pending`, conversación inicial, dos participantes y mensajes/adjuntos mínimos coherentes con los enums.
- [X] T012 Ejecutar `npx prisma migrate dev`, `npx prisma validate` y `npx prisma db seed` en un PostgreSQL de desarrollo, y corregir `development/prisma/schema.prisma`, la migración o `development/prisma/seed.ts` hasta que la carga sea repetible y no produzca duplicados.

**Checkpoint**: Prisma genera el cliente, la migración aplica sobre una base limpia y el seed crea una reserva enlazada a una conversación con sus dos participantes.

---

## Phase 2: Lógica Core de Reservas (tRPC Router)

**Goal**: Implementar validación de fechas/disponibilidad, cálculo financiero, transacciones de reserva + conversación y los procedimientos `booking.request`, `booking.accept`, `booking.reject` y `booking.list`.

**Independent validation**: Las pruebas unitarias pasan para fechas/solapamientos/finanzas y las pruebas de integración verifican autorización, atomicidad, idempotencia y transiciones contra PostgreSQL real.

- [X] T013 [P] [US1] Crear schemas Zod para `booking.request`, `booking.accept`, `booking.reject` y `booking.list` en `development/src/features/bookings/shared/booking.schema.ts`, validando fechas `YYYY-MM-DD`, límites de texto, `idempotencyKey`, filtros y cursores.
- [X] T014 [P] [US1] Implementar el helper puro de intervalo y solapamiento en `development/src/features/bookings/domain/date-range.ts`, usando `[startDate, endDate)`, rechazando rangos vacíos/pasados y permitiendo que una reserva termine el día que empieza otra.
- [X] T015 [P] [US1] Implementar el helper puro de desglose financiero en `development/src/features/bookings/domain/financial-breakdown.ts`, calculando `totalDays`, `subtotal`, `serviceFee` y `totalPrice` con precisión decimal, EUR y redondeo documentado.
- [X] T016 [P] [US1] Crear errores de dominio de reservas para validación, disponibilidad, transición inválida, autorización, idempotencia y recurso inexistente en `development/src/features/bookings/domain/booking-errors.ts`, mapeables por tRPC sin exponer detalles internos.
- [X] T017 [US1] Implementar `bookingService.request` en `development/src/features/bookings/application/booking.service.ts`, derivando renter desde la sesión, cargando owner/precio del listing, validando disponibilidad y calculando el snapshot financiero sin aceptar importes del cliente.
- [X] T018 [US1] Implementar la creación transaccional de `Booking`, `Conversation` y dos `ConversationParticipant` en `development/src/features/bookings/application/booking.service.ts` y `development/src/features/messaging/infrastructure/messaging.repository.ts`, haciendo que los reintentos con la misma clave devuelvan el resultado existente.
- [X] T019 [US1] Implementar `bookingService.accept` y `bookingService.reject` en `development/src/features/bookings/application/booking.service.ts`, validando owner, estado `pending`, motivo opcional y revalidación de solapamientos dentro de una transacción que también inserte `BookingStatusHistory`.
- [X] T020 [US1] Implementar `bookingService.list` y `bookingService.getById` en `development/src/features/bookings/application/booking.service.ts` y `development/src/features/bookings/infrastructure/booking.repository.ts`, filtrando por renter/owner, estado, listing y fechas, con cursor estable `createdAt DESC, id DESC`, autorización por recurso y `conversationId`.
- [X] T021 [US1] Crear el repositorio Prisma de reservas en `development/src/features/bookings/infrastructure/booking.repository.ts`, encapsulando queries, `deletedAt: null`, includes mínimos de listing/usuarios/conversación y condiciones de disponibilidad sin exponer Prisma al router.
- [X] T022 [US1] Crear `bookingRouter` en `development/src/server/api/routers/booking.router.ts` con procedimientos autenticados `request`, `accept`, `reject`, `list` y `getById`, y registrar `bookingRouter` en `development/src/server/api/root.ts`.
- [X] T023 [P] [US1] Escribir tests unitarios de fechas, solapamientos y estados en `development/tests/unit/bookings/date-range.test.ts` y `development/tests/unit/bookings/booking-status.test.ts`, cubriendo intervalos adyacentes, fechas inválidas, estados no permitidos y errores de dominio.
- [X] T024 [P] [US1] Escribir tests unitarios del desglose financiero y schemas Zod en `development/tests/unit/bookings/financial-breakdown.test.ts` y `development/tests/unit/bookings/booking.schema.test.ts`, cubriendo redondeo, service fee, totalDays, límites y payloads inválidos.
- [X] T025 [US1] Escribir tests de integración con PostgreSQL/Testcontainers para `booking.request` en `development/tests/integration/bookings/booking-request.integration.test.ts`, verificando Booking + Conversation + participantes atómicos, FK, snapshot financiero e idempotencia.
- [X] T026 [US1] Escribir tests de integración para `booking.accept`, `booking.reject`, `booking.list` y `booking.getById` en `development/tests/integration/bookings/booking-router.integration.test.ts`, cubriendo autorización por owner, aislamiento del detalle, transiciones inválidas, filtros, paginación y conflictos concurrentes.
- [X] T027 [US1] Ejecutar `npm run test`, `npm run test:integration` y `npx tsc --noEmit` desde `development/`, corrigiendo errores de tipos, migración, serialización de Decimal y mapeo de errores tRPC.

**Checkpoint**: Un renter puede solicitar una reserva y obtiene `conversationId`; el owner puede aceptarla/rechazarla; ambos pueden listar únicamente reservas autorizadas; no quedan registros parciales.

---

## Phase 3: Infraestructura y Mensajería Serverless (Mensajería MVP)

**Goal**: Añadir Socket.io autenticado, rooms privadas por conversación y lectura de mensajes/estado de lectura mediante tRPC, garantizando persistencia antes de emisión.

**Independent validation**: Dos clientes autenticados pueden unirse a `conversation:${id}` y recibir mensajes persistidos; un usuario externo no entra; al fallar/desconectarse el socket, el mensaje permanece recuperable por `listMessages`.

- [X] T028 [P] Crear los schemas y tipos compartidos de mensajería en `development/src/features/messaging/shared/messaging.schema.ts`, incluyendo `conversation:join`, `message:send`, `conversation:read`, `listMessages` y `markRead`, con límites de body, IDs y cursor.
- [X] T029 [P] Implementar el repositorio de mensajes en `development/src/features/messaging/infrastructure/messaging.repository.ts`, con `listMessages` por cursor, `createMessage`, `findByClientMessageId` y `markRead`, siempre filtrando membresía y `deletedAt`.
- [X] T030 Implementar `messagingService.listMessages` y `messagingService.markRead` en `development/src/features/messaging/application/messaging.service.ts`, validando que el usuario sea participante y que el `messageId` pertenezca a la conversación.
- [X] T031 Implementar el router tRPC de mensajería en `development/src/server/api/routers/messaging.router.ts` con `listMessages` y `markRead`, y registrarlo en `development/src/server/api/root.ts`.
- [X] T032 Implementar el adaptador de autenticación de Socket.io en `development/src/features/messaging/infrastructure/socket-auth.ts`, validando sesión/JWT, usuario activo, expiración y origen permitido sin aceptar `userId` del cliente.
- [X] T033 Implementar el servicios tRPC de mensajería en `development/src/server/socket/messaging-gateway.ts`, inicializando el servidor sobre el runtime Node elegido, gestionando handshake, errores con `requestId` y cierre seguro.
- [X] T034 Implementar rooms privados `conversation:${conversationId}` y autorización de membresía para `conversation:join` en `development/src/server/socket/messaging-gateway.ts`; impedir acceso a usuarios externos y documentar la estrategia multi-instancia futura.
- [X] T035 Implementar `message:send` en `development/src/server/socket/messaging-gateway.ts`, delegando persistencia al servicio, usando `clientMessageId` para deduplicación, emitiendo `message:created` solo después del commit y devolviendo ACK tipado.
- [X] T036 Implementar `conversation:read` y `conversation:read-updated` en `development/src/server/socket/messaging-gateway.ts`, delegando `markRead` al servicio y emitiendo únicamente a miembros autorizados.
- [X] T037 [P] Crear el bootstrap reutilizable del servidor Socket.io en `development/src/server/socket/index.ts`, incluyendo lifecycle y compatibilidad con un runtime Node persistente.
- [X] T038 [P] Escribir tests de integración del handshake, autorización y rooms en `development/tests/integration/messaging/socket-gateway.integration.test.ts`, cubriendo sesión inválida, usuario no miembro y aislamiento de conversaciones.
- [X] T039 [P] Escribir tests de integración para persistencia-before-broadcast en `development/tests/integration/messaging/socket-gateway.integration.test.ts`, verificando ACK, evento `message:created`, idempotencia y recuperación desde PostgreSQL.
- [X] T040 [P] Escribir tests de integración para `listMessages` y `markRead` en `development/tests/integration/messaging/messaging-router.integration.test.ts`, cubriendo cursor, orden estable, unread/read y aislamiento por participante.
- [X] T041 Ejecutar `npm run test:integration`, `npx tsc --noEmit` y pruebas con clientes Socket.io en `development/tests/integration/messaging/`, corrigiendo problemas de runtime, autenticación, ABAC y CORS.

**Checkpoint**: La conversación creada por `booking.request` puede usarse inmediatamente como room privado; mensajes aceptados quedan en PostgreSQL antes de notificarse y se recuperan después de reconexión.

---

## Phase 4: Adjuntos de Imagen (S3/R2) y Notificaciones

**Goal**: Permitir adjuntos de imagen mediante URLs prefirmadas y avisar por email/push cuando el destinatario no tenga una sesión WebSocket activa, sin bloquear el envío principal.

**Independent validation**: Un participante obtiene una URL prefirmada válida, confirma únicamente un objeto permitido, lo asocia a un mensaje y el destinatario offline recibe una notificación fallback idempotente.

- [X] T042 [P] Definir la configuración validada de almacenamiento y notificaciones en `development/src/env.mjs`, `development/src/features/messaging/shared/attachment.schema.ts` y `development/src/features/notifications/shared/notification.schema.ts`, sin incluir secretos en el repositorio.
- [X] T043 [P] Implementar el adaptador de almacenamiento S3/R2 en `development/src/server/integrations/storage/object-storage.provider.ts`, con interfaz tipada para URLs prefirmadas, expiración, claves internas y borrado lógico; no guardar bytes en PostgreSQL.
- [X] T044 [P] Implementar validación de MIME, tamaño, extensión, magic bytes, checksum y límites por mensaje en `development/src/features/messaging/application/attachment.service.ts`, rechazando uploads no autorizados o fuera de la allowlist.
- [X] T045 Implementar `createAttachmentUpload` en `development/src/server/api/routers/messaging.router.ts` y `development/src/features/messaging/application/attachment.service.ts`, validando membresía, cuota, tipo, tamaño y devolviendo `attachmentId` temporal más URL prefirmada.
- [X] T046 Implementar `confirmAttachment` en `development/src/server/api/routers/messaging.router.ts` y `development/src/features/messaging/application/attachment.service.ts`, verificando que el objeto existe, coincide con checksum/tamaño y solo puede ser usado por su creador y conversación.
- [X] T047 Extender `message:send` y `development/src/features/messaging/infrastructure/messaging.repository.ts` para asociar hasta cinco `MessageAttachment` confirmados en una transacción y publicar únicamente metadatos seguros en `message:created`.
- [X] T048 [P] Implementar el servicio de notificaciones en `development/src/features/notifications/application/notification.service.ts`, seleccionando push/email fallback cuando el destinatario no tenga socket activo, con preferencias, rate limit y payload sin contenido sensible innecesario.
- [X] T049 [P] Implementar el registro de presencia/conectividad en `development/src/features/messaging/infrastructure/presence.service.ts`, permitiendo que notificaciones distingan sesión WebSocket activa sin convertir Redis en fuente de verdad del mensaje.
- [X] T050 Integrar la notificación posterior al commit en `development/src/server/socket/messaging-gateway.ts`, asegurando que el fallo del proveedor externo no revierta el mensaje ni el ACK y que los reintentos idempotentes no notifiquen dos veces.
- [X] T051 [P] Escribir tests unitarios de validación de adjuntos y presencia en `development/tests/unit/messaging/attachment.service.test.ts`, cubriendo URLs, presencia multi-socket y fallback offline.
- [X] T052 [P] Escribir tests de integración de presigned upload y confirmación en `development/tests/integration/messaging/attachments.integration.test.ts`, usando un fake del proveedor externo y verificando persistencia de metadatos sin binarios.
- [X] T053 [P] Escribir tests de integración de fallback de notificaciones en `development/tests/integration/notifications/message-notification.integration.test.ts`, cubriendo socket activo y socket ausente.
- [X] T054 Ejecutar la validación completa de la Fase 4 desde `development/`: `npx prisma validate`, `npx prisma migrate status`, `npx tsc --noEmit`, tests unitarios/integración focalizados y `git diff --check`.

**Checkpoint**: El flujo completo permite solicitar una reserva, abrir su conversación, enviar texto o imagen validada y notificar al destinatario offline sin perder persistencia.

---

## Phase 5: Validación E2E, Rendimiento y Auditoría

**Goal**: Validar los criterios transversales de jornada completa, rendimiento de transiciones y trazabilidad de estados antes de iniciar la implementación.

**Independent validation**: Playwright completa al menos 19 de 20 sesiones; el benchmark confirma `p95 < 2s`; la auditoría conserva todas las transiciones dentro de la misma transacción.

- [ ] T055 [P] Escribir y habilitar la prueba E2E crítica en `development/tests/e2e/bookings-messaging.spec.ts`, cubriendo login de renter y owner, creación de reserva, creación de `Conversation`, entrada al room, envío de mensaje y recepción por el segundo usuario. El spec está creado, pero queda pendiente de habilitar cuando exista la UI de reservas/mensajería y el runtime Socket.io integrado.
- [ ] T056 Ejecutar `npx playwright test tests/e2e/bookings-messaging.spec.ts` desde `development/` con 20 sesiones aisladas, verificando que al menos 19 completan en el primer intento el flujo seleccionar fechas → solicitar reserva → obtener `conversationId` → abrir conversación.
- [X] T057 [P] Crear el benchmark de transiciones en `development/tests/performance/bookings/booking-transitions.performance.test.ts`, ejecutando al menos 100 operaciones autorizadas de `booking.accept` y `booking.reject` y midiendo p50, p95, p99, errores y conflictos falsos.
- [X] T058 Ejecutar el benchmark contra PostgreSQL de pruebas y documentar los resultados y el umbral `p95 < 2s` en `development/tests/performance/bookings/README.md`.
- [ ] T059 [P] Preparar fixtures y usuarios aislados para las 20 sesiones E2E en `development/tests/fixtures/bookings-e2e.fixtures.ts`, evitando estado mutable compartido y usando datos sintéticos reproducibles. Pendiente de ejecutar el flujo E2E cuando exista la UI de reservas/mensajería y el runtime Socket.io integrado.
- [X] T060 [P] Añadir el escenario de auditoría de transiciones a los fixtures de integración en `development/tests/fixtures/booking-status-history.fixtures.ts`, incluyendo `null → pending`, `pending → accepted` y `pending → rejected`.
- [X] T061 Verificar el historial de transiciones en `development/tests/integration/bookings/booking-status-history.integration.test.ts`, comprobando estado anterior/nuevo, actor, motivo, timestamps de servidor y atomicidad con la mutación de `Booking`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: no depende de otras fases; bloquea todas las demás porque define Prisma, migraciones, enums, seed y cliente generado.
- **Phase 2**: depende de Phase 1; implementa el MVP funcional de reservas y la creación transaccional de conversaciones.
- **Phase 3**: depende de Phase 1 y del `conversationId` producido por Phase 2; puede empezar sobre fixtures de conversación tras completar el schema, pero su validación end-to-end requiere `booking.request`.
- **Phase 4**: depende de Phase 3 para asociar adjuntos al envío de mensajes; el proveedor de almacenamiento y los schemas pueden prepararse en paralelo después de Phase 1.

### User Story / Capability Dependencies

- **US1 — Solicitar y persistir reserva**: tareas T013–T018 y T023–T025; depende de Phase 1 y es el MVP recomendado.
- **US2 — Resolver reserva**: tareas T019 y T026; depende de la entidad Booking y del servicio de Phase 2, pero puede probarse con fixtures creados por T010.
- **User Story 3 — Listar reserva y abrir conversación**: tareas T020–T022 y T026; depende de Booking + Conversation, incluye el detalle `booking.getById` y habilita la entrada al Módulo 5.
- **Mensajería MVP**: tareas T028–T041; depende de los modelos de Phase 1 y se integra con el `conversationId` de US1.
- **Adjuntos/notificaciones**: tareas T042–T054; depende de mensajería persistente y de un proveedor externo configurado en el entorno.
- **E2E, rendimiento y auditoría**: tareas T055–T061; dependen de la implementación de reservas/mensajería y validan los criterios SC-004, SC-006 y FR-013.

## Parallel Execution Examples

### Phase 1

```text
T001 schema audit
T002 dependency installation
T010 test factories
T011 seed fixtures
```

T003–T007 deben converger sobre `schema.prisma`; no ejecutarlos simultáneamente sobre el mismo archivo sin coordinación.

### Phase 2

```text
T013 booking schemas
T014 date-range helper
T015 financial-breakdown helper
T016 domain errors
T023 unit tests for dates/status
T024 unit tests for finance/schemas
```

Después de los helpers y schemas, T017–T022 deben ejecutarse en orden lógico; T025 y T026 pueden prepararse en paralelo una vez definidos los contratos.

### Phase 3

```text
T028 messaging schemas
T029 message repository
T032 socket authentication
T037 socket bootstrap
T038 handshake/room tests
T040 tRPC messaging tests
```

T035 y T036 dependen de T030, T032–T034 y del repositorio; T039 debe ejecutarse cuando exista el flujo `message:send`.

### Phase 4

```text
T042 configuration/schemas
T043 storage adapter
T044 attachment validation
T048 notification service
T049 presence service
T051 attachment unit tests
T053 notification integration tests
```

T045–T047 dependen de T043/T044 y T050 depende de T048/T049 y del envío persistente de Phase 3.

### E2E, benchmark y auditoría

```text
T055 critical E2E flow
T057 transition benchmark
T059 isolated E2E fixtures
T060 status-history fixtures
```

T056 depende de T055 y debe usar fixtures aislados de T059 cuando estén disponibles. T058 depende de T057. T061 depende de T005, T019, T026 y T060.

## Implementation Strategy

### MVP recomendado

1. Completar Phase 1.
2. Completar T013–T018, T021–T025 de Phase 2 para solicitar una reserva, crear la conversación y probar la transacción.
3. Completar T019–T027 para que el owner pueda resolver y ambos participantes puedan listar la reserva.
4. Validar el MVP de reservas y detenerse antes de adjuntos/notificaciones si se requiere una entrega incremental.

### Entrega incremental

1. **MVP de reservas**: Phase 1 + Phase 2; entrega `Booking`, aprobación manual y `Conversation` inicial.
2. **Mensajería MVP**: Phase 3; entrega rooms privados, historial y persistencia antes de emisión.
3. **Comunicación enriquecida**: Phase 4; entrega imágenes y fallback offline.

### Criterios de finalización por bloque

- Cada tarea completada conserva su checkbox, ID y ruta; no se marcan tareas no verificadas.
- Cada fase debe pasar su checkpoint antes de iniciar la siguiente integración.
- Los tests de integración usan PostgreSQL efímero/Testcontainers y fixtures aislados.
- Las operaciones que escriben Booking, Conversation, participantes o mensajes usan transacciones explícitas y registran errores con `requestId`/`userId`.
