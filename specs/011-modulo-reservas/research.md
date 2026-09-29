# Research: Módulo de Reservas

## Decisión: aprobación manual como flujo MVP

**Decision**: toda solicitud comienza en `pending`; solo el owner del listing puede pasarla a `accepted` o `rejected`.

**Rationale**: coincide con la especificación funcional existente del MVP, que define aprobación manual y reserva instantánea únicamente como capacidad posterior para usuarios verificados.

**Alternatives considered**: aceptación automática para todos (reduce control del owner); reserva instantánea desde la primera versión (requiere reglas de verificación, disponibilidad y pagos más amplias).

## Decisión: almacenar snapshot financiero

**Decision**: persistir `pricePerDay`, `totalDays`, `subtotal`, `serviceFee` y `totalPrice` en `Booking`.

**Rationale**: el precio del listing puede cambiar después de una solicitud; el historial financiero debe ser reproducible y auditable. Se usa `Decimal` con precisión explícita y la moneda se fija en EUR en el MVP.

**Alternatives considered**: recalcular al leer (rompe históricos); almacenar solo el total (pierde transparencia y dificulta comprobaciones).

## Decisión: intervalo de fechas semiabierto

**Decision**: tratar la reserva como `[startDate, endDate)`, con `startDate` inclusiva y `endDate` exclusiva.

**Rationale**: permite que una reserva termine el mismo día en que comienza la siguiente y evita ambigüedad de horas en el MVP basado en días de calendario.

**Alternatives considered**: ambas fechas inclusivas (genera un día extra y conflictos innecesarios); timestamps definidos por cliente (más complejidad de zonas horarias y reglas de recogida).

## Decisión: creación transaccional de Conversation

**Decision**: `request` crea `Booking` y `Conversation` con sus participantes en la misma transacción, usando una clave idempotente para evitar duplicados.

**Rationale**: la reserva debe disponer inmediatamente de un canal de coordinación; una conversación huérfana o una reserva sin conversación rompe el flujo del Módulo 5. La transacción satisface la regla de consistencia y la idempotencia hace seguros los reintentos.

**Alternatives considered**: crear conversación mediante evento asíncrono (permite una ventana inconsistente); crearla al aceptar (el renter no puede coordinar antes de la aprobación).

## Decisión: tRPC por procedimiento de negocio

**Decision**: exponer procedimientos separados `request`, `accept`, `reject` y `list` bajo `booking`.

**Rationale**: mantiene contratos tipados con el stack existente y hace visibles las autorizaciones y estados permitidos de cada acción.

**Alternatives considered**: un procedimiento genérico `updateStatus` (permite transiciones no válidas y mezcla permisos); REST adicional (introduce una convención no usada por el backend actual).
