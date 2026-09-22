# Feature Specification: Módulo de Reservas

**Feature Branch**: `008-modulo-reservas`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Crea la estructura de especificación en specs/008-modulo-reservas/ (plan.md, data-model.md, research.md, contracts/booking-router.md). Define el modelo Booking en data-model.md incluyendo campos de fechas, estado del ciclo de vida, desglose financiero y relaciones con Listing, User y Conversation. Especifica los endpoints tRPC necesarios para solicitar, aceptar, rechazar y listar reservas. Asegúrate de conectar la creación de una reserva con el inicio de una Conversation para habilitar la mensajería del Módulo 5."

## User Scenarios & Testing

### User Story 1 - Solicitar una reserva (Priority: P1)

Como arrendatario, quiero seleccionar un listing y un intervalo de fechas para enviar una solicitud de reserva con un precio calculado, de forma que el arrendador pueda revisarla.

**Why this priority**: Es el flujo principal que convierte el interés por un listing en una operación gestionable.

**Independent Test**: Con un usuario arrendatario, un listing publicado y fechas disponibles, crear una solicitud y verificar que queda pendiente, conserva el desglose financiero y crea una conversación con el arrendador.

**Acceptance Scenarios**:

1. **Given** un listing publicado, un arrendatario autenticado y un rango válido disponible, **When** solicita la reserva, **Then** se crea una reserva en estado `pending` con `startDate`, `endDate`, `totalDays` y desglose financiero calculados en servidor.
2. **Given** que la solicitud se crea correctamente, **When** termina la operación, **Then** existe una `Conversation` asociada a la reserva y contiene como participantes al arrendatario y al owner del listing.
3. **Given** una reserva pendiente ya existente para el mismo listing y fechas solapadas, **When** otro usuario solicita el mismo intervalo, **Then** la solicitud se rechaza por conflicto y no se crea una reserva ni una conversación duplicada.

---

### User Story 2 - Revisar y resolver una solicitud (Priority: P1)

Como arrendador, quiero aceptar o rechazar solicitudes de mis listings, de forma que pueda controlar la disponibilidad de mi producto.

**Why this priority**: El MVP requiere aprobación manual y la reserva no puede avanzar sin una decisión del owner.

**Independent Test**: Crear una reserva pendiente y ejecutar aceptación y rechazo con el owner; verificar autorización, transición de estado y rechazo de transiciones inválidas.

**Acceptance Scenarios**:

1. **Given** una reserva `pending` perteneciente a un listing del usuario autenticado, **When** el owner la acepta, **Then** pasa a `accepted` y se bloquea el intervalo para nuevas solicitudes incompatibles.
2. **Given** una reserva `pending` perteneciente a un listing del usuario autenticado, **When** el owner la rechaza con un motivo opcional, **Then** pasa a `rejected` y el intervalo vuelve a estar disponible.
3. **Given** una reserva que no es `pending` o que pertenece a otro listing, **When** un usuario intenta aceptarla o rechazarla, **Then** la operación falla sin modificar datos.

---

### User Story 3 - Consultar reservas y conversación (Priority: P1)

Como arrendatario o arrendador, quiero listar mis reservas y abrir la conversación vinculada para coordinar la entrega y devolución del producto.

**Why this priority**: La reserva y la comunicación son un único flujo operativo; ambas partes necesitan encontrar el estado y el hilo asociado.

**Independent Test**: Con reservas en varios estados, listar como arrendatario y como owner; comprobar que cada usuario solo ve sus reservas y que cada resultado incluye el identificador de conversación cuando existe.

**Acceptance Scenarios**:

1. **Given** reservas del usuario como arrendatario y/o owner, **When** consulta el listado con filtros opcionales, **Then** recibe únicamente reservas autorizadas, ordenadas por fecha de creación y con paginación estable.
2. **Given** una reserva con conversación asociada, **When** el usuario abre el detalle, **Then** puede obtener el `conversationId` para continuar la comunicación del Módulo 5.
3. **Given** un usuario no relacionado con la reserva, **When** solicita el detalle o listado filtrado por esa reserva, **Then** recibe `FORBIDDEN` o un resultado indistinguible de inexistente según la política de privacidad.

---

### Edge Cases

- `startDate` debe ser anterior a `endDate`; las fechas se interpretan como días de calendario y no como horas elegidas por el cliente.
- No se permiten fechas pasadas, salvo que una operación administrativa explícita lo autorice.
- El solapamiento se evalúa con intervalo semiabierto `[startDate, endDate)`, por lo que una devolución el mismo día que comienza otra reserva no genera conflicto.
- No se permiten solicitudes del owner sobre su propio listing.
- Listings no publicados, eliminados o suspendidos no admiten nuevas solicitudes.
- Un precio o total enviado por el cliente se ignora; el servidor recalcula usando el precio vigente del listing.
- Si falla la creación de la reserva o de la conversación, la transacción completa se revierte.
- Una reserva aceptada no puede volver a `pending`; cancelaciones y completados pertenecen a transiciones posteriores definidas por el dominio.
- Dos solicitudes concurrentes para el mismo intervalo deben resolverse sin doble aceptación ni doble bloqueo.
- La creación repetida con la misma clave de idempotencia debe devolver la reserva existente sin crear otra conversación.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un arrendatario autenticado solicitar una reserva indicando `listingId`, `startDate` y `endDate`.
- **FR-002**: El sistema MUST aceptar solicitudes únicamente para listings publicados, activos y no eliminados, y MUST impedir que el owner reserve su propio listing.
- **FR-003**: El sistema MUST validar que el rango contiene al menos un día, no está en el pasado y no se solapa con reservas incompatibles del mismo listing.
- **FR-004**: El sistema MUST calcular en servidor `pricePerDay`, `totalDays`, `subtotal`, `serviceFee` y `totalPrice`, ignorando cualquier importe calculado enviado por el cliente.
- **FR-005**: El sistema MUST crear la reserva inicialmente en estado `pending`, salvo que una futura política explícita de reserva instantánea autorice otra transición.
- **FR-006**: La creación de una reserva MUST crear o recuperar de forma idempotente una `Conversation` asociada a la reserva, con el arrendatario y el owner como participantes.
- **FR-007**: La reserva y la conversación inicial MUST crearse dentro de una única operación transaccional; si cualquiera falla, no debe quedar un registro parcial.
- **FR-008**: El owner del listing MUST poder aceptar una reserva `pending`; aceptar MUST impedir reservas aceptadas solapadas para el mismo listing.
- **FR-009**: El owner del listing MUST poder rechazar una reserva `pending`, registrando opcionalmente un motivo visible para el arrendatario.
- **FR-010**: El sistema MUST impedir aceptar o rechazar reservas que no estén `pending` o cuyo actor no tenga autorización sobre el listing.
- **FR-011**: El sistema MUST permitir listar reservas propias como arrendatario o como owner, con filtros por estado, listing y rango temporal, además de paginación, y consultar el detalle de una reserva propia mediante su identificador.
- **FR-012**: El listado y el detalle de cada reserva MUST exponer su `conversationId` únicamente a los usuarios autorizados para que puedan continuar en el Módulo 5.
- **FR-013**: El sistema MUST conservar cada transición de estado de una reserva con estado anterior, estado nuevo, actor, motivo opcional y timestamp de servidor; `lastTransitionById` no sustituye el historial completo.
- **FR-014**: Los procedimientos MUST validar entradas, autenticar al usuario y aplicar autorización por recurso; no deben aceptar `renterId`, `ownerId` ni importes como autoridad del cliente.
- **FR-015**: El sistema MUST devolver errores de dominio diferenciados para validación, conflicto de disponibilidad, autorización, recurso inexistente y transición inválida, sin exponer detalles internos.

### Key Entities

- **Booking**: solicitud y ciclo de vida de un alquiler; contiene fechas, estado, snapshot financiero y relaciones con listing, renter, owner y conversación.
- **Listing**: producto publicado que se puede alquilar; aporta el precio diario y su owner.
- **User**: usuario que participa como arrendatario (`renter`) u owner del listing.
- **Conversation**: hilo privado iniciado al crear la reserva; conecta al renter y al owner para mensajería contextual.
- **BookingStatus**: estado del ciclo de vida de la reserva: `pending`, `accepted`, `rejected`, `cancelled`, `active` y `completed`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El 100% de las solicitudes válidas crea una reserva pendiente con un desglose financiero reproducible a partir del precio diario y las fechas.
- **SC-002**: El 100% de las reservas creadas correctamente tiene una conversación asociada y exactamente los dos participantes iniciales esperados.
- **SC-003**: El sistema rechaza el 100% de las solicitudes con fechas inválidas, listing no disponible, owner como renter o solapamiento incompatible sin crear registros parciales.
- **SC-004**: En una prueba reproducible con al menos 100 operaciones autorizadas de aceptación y rechazo, al menos el 95% de las operaciones debe completarse en menos de 2 segundos, sin errores de autorización ni conflictos falsos.
- **SC-005**: El 100% de los usuarios solo puede listar y consultar reservas en las que participa como renter o owner.
- **SC-006**: En una prueba con 20 sesiones aisladas de renter y owner, al menos 19 sesiones deben completar en el primer intento el flujo de seleccionar fechas, solicitar la reserva, obtener el `conversationId` y abrir la conversación asociada sin asistencia manual.
- **SC-007**: Los reintentos de una misma solicitud idempotente no generan reservas ni conversaciones duplicadas.

## Assumptions

- El MVP usa aprobación manual: una nueva reserva queda `pending` y solo el owner puede resolverla.
- El precio se calcula con tarifa fija diaria del listing; `serviceFee` se expresa como importe monetario calculado por una regla configurable y queda congelado en la reserva.
- `totalDays` usa días de calendario con intervalo semiabierto `[startDate, endDate)`; por tanto, una reserva del 1 al 3 tiene 2 días.
- Los pagos automatizados, depósitos, seguros y reembolsos no forman parte de esta especificación.
- La autenticación existente del proyecto se reutiliza; las identificaciones de renter y owner se derivan de la sesión y de la relación del listing.
- El modelo `Conversation` y sus participantes pertenecen al Módulo 5. Esta feature define la integración necesaria, no duplica el modelo de mensajería.
- `Booking` aún no existe en el schema Prisma actual; la migración debe coordinarse con el diseño de `Conversation` y con los módulos de listings/usuarios.
- Las reservas canceladas, activas y completadas se incluyen en el enum para soportar el ciclo futuro; esta primera entrega implementa solicitud, aceptación, rechazo y listado.
