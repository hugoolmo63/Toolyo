# Feature Specification: Reviews y Reputación

**Feature Branch**: `006-modulo-reviews`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Crear la especificación funcional del sistema de valoraciones bidireccional post-alquiler para arrendatarios, propietarios y comunidad, incluyendo elegibilidad por reserva completada, ventana de 14 días, doble ciego, puntuación por categorías y reporte de contenido inapropiado."

## Objetivo y Valor de Negocio

El sistema de reviews debe generar confianza en Toolyo mediante una reputación bidireccional, transparente y vinculada a alquileres reales. Después de completar un alquiler, el arrendatario y el propietario pueden valorar su experiencia mutua; la comunidad puede consultar puntuaciones agregadas para tomar decisiones informadas.

El sistema debe equilibrar tres objetivos:

1. Dar voz a ambas partes después de una operación real.
2. Evitar represalias o sesgos inmediatos mediante publicación doble ciega.
3. Proteger la calidad de la plataforma mediante reportes y moderación.

## Clarifications

### Session 2026-09-23

- Q: Cuando transcurran los 14 días y solo una de las partes haya enviado su review, ¿debe publicarse esa review individualmente o debe permanecer oculta hasta que ambas partes hayan respondido? → A: Publicar la review enviada al cumplirse los 14 días; la parte que no respondió no genera review y la valoración publicada participa en los agregados públicos.

## User Scenarios & Testing

### User Story 1 - Valorar la experiencia del propietario y el producto (Priority: P1)

Como arrendatario, quiero valorar la herramienta o equipamiento y la atención del propietario después de completar el alquiler, para compartir información útil con futuros arrendatarios.

**Why this priority**: La experiencia del arrendatario aporta señales directas sobre el estado del producto, la comunicación y el cumplimiento del propietario.

**Independent Test**: Con una reserva completada y dentro de los 14 días posteriores a su finalización, el arrendatario puede enviar una review con puntuación general, categorías y comentario opcional; la review queda pendiente de publicación doble ciega.

**Acceptance Scenarios**:

1. **Given** una reserva del usuario en estado `completed` y finalizada hace menos de 14 días, **When** el arrendatario envía su review, **Then** el sistema registra una valoración asociada a esa reserva y al propietario, con puntuación general y categorías válidas entre 1 y 5.
2. **Given** que el arrendatario ya ha enviado su review para una reserva, **When** intenta enviarla de nuevo, **Then** el sistema rechaza el duplicado y conserva la primera valoración.
3. **Given** que el propietario todavía no ha enviado su review, **When** el arrendatario consulta la valoración enviada, **Then** no puede ver el contenido de la review del propietario.

---

### User Story 2 - Valorar el trato del arrendatario (Priority: P1)

Como propietario, quiero valorar el trato, cuidado del producto y puntualidad del arrendatario después de completar el alquiler, para proteger la confianza de la comunidad.

**Why this priority**: La reputación del arrendatario es necesaria para que los propietarios acepten solicitudes y gestionen productos compartidos con menor riesgo.

**Independent Test**: Con una reserva completada y dentro de la ventana permitida, el propietario puede enviar una review dirigida al arrendatario con sus categorías aplicables; el contenido permanece oculto hasta que se cumpla la regla doble ciega.

**Acceptance Scenarios**:

1. **Given** una reserva `completed` finalizada hace menos de 14 días, **When** el propietario envía su review, **Then** el sistema registra una valoración dirigida al arrendatario con puntuación general y categorías de trato, cuidado y puntualidad.
2. **Given** que el propietario no forma parte de la reserva, **When** intenta valorar al arrendatario, **Then** el sistema rechaza la acción y no crea ninguna review.
3. **Given** que solo una de las partes ha enviado su review y todavía no han transcurrido los 14 días, **When** cualquiera consulta la reserva, **Then** el contenido de la review permanece oculto para la otra parte y para el público.

---

### User Story 3 - Consultar reputación agregada (Priority: P1)

Como miembro de la comunidad, quiero consultar la reputación agregada de un producto y de sus usuarios, para decidir con quién alquilar y qué producto elegir.

**Why this priority**: La visibilidad pública de la reputación convierte las valoraciones privadas en confianza utilizable durante la búsqueda y la decisión de alquiler.

**Independent Test**: Con reviews publicadas, consultar una ficha de producto y un perfil de usuario; verificar que aparecen las puntuaciones agregadas y las reviews que ya son visibles sin revelar contenido todavía protegido por doble ciego.

**Acceptance Scenarios**:

1. **Given** reviews publicadas asociadas a un producto, **When** un visitante consulta su ficha, **Then** ve la puntuación general agregada, el número de valoraciones y las categorías de producto aplicables.
2. **Given** reviews publicadas dirigidas a un usuario, **When** un visitante consulta su perfil, **Then** ve su puntuación agregada, el número de valoraciones y el contenido público permitido.
3. **Given** una review pendiente de publicación doble ciega o reportada en revisión, **When** un visitante consulta el producto o perfil, **Then** esa review no afecta a los agregados públicos ni aparece como contenido visible.

---

### User Story 4 - Reportar una review inapropiada (Priority: P2)

Como miembro de la comunidad, quiero reportar una review ofensiva, falsa o inapropiada, para que pueda ser revisada y proteger la calidad de la plataforma.

**Why this priority**: La moderación protege la confianza sin permitir que los reportes bloqueen la publicación legítima de reviews no controvertidas.

**Independent Test**: Con una review publicada, un usuario puede enviar un reporte con una categoría y descripción opcional; la review pasa a revisión y no se crea más de un reporte activo equivalente del mismo usuario.

**Acceptance Scenarios**:

1. **Given** una review visible, **When** un usuario la reporta seleccionando un motivo, **Then** el sistema registra el reporte y marca la review como pendiente de moderación sin eliminarla automáticamente.
2. **Given** que el mismo usuario ya reportó esa review por el mismo motivo, **When** vuelve a reportarla, **Then** el sistema evita duplicar el reporte activo.
3. **Given** una review reportada, **When** un moderador resuelve el caso, **Then** la review queda visible, oculta o eliminada según la decisión y el resultado queda trazable.

### Edge Cases

- Una reserva no `completed` no permite emitir ninguna review.
- Una review enviada después de 14 días naturales desde la finalización se rechaza, aunque la reserva siga visible.
- La ventana se calcula con días naturales y no con horas de actividad del usuario.
- Cada parte puede emitir como máximo una review por reserva y dirección.
- Un usuario no puede valorarse a sí mismo ni valorar una reserva en la que no participa.
- La review puede contener puntuación sin comentario; el comentario es opcional y debe respetar los límites de contenido definidos por producto.
- Las categorías aplicables dependen del rol de quien valora y del destinatario de la review.
- Si una parte envía su review y la otra no, los agregados públicos no deben revelar indirectamente la puntuación pendiente.
- Si ambas partes envían review antes de que transcurran 14 días, ambas se publican de forma simultánea.
- Cuando transcurren los 14 días, las reviews enviadas se publican aunque la otra parte no haya participado.
- Una review reportada no debe desaparecer automáticamente antes de una decisión de moderación, salvo que exista una regla de seguridad urgente.
- El autor de una review no puede modificar su puntuación después de publicarla en esta primera versión; cualquier corrección debe gestionarse mediante moderación.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST permitir que el arrendatario valore al propietario y el producto después de una reserva completada.
- **FR-002**: El sistema MUST permitir que el propietario valore al arrendatario después de una reserva completada.
- **FR-003**: El sistema MUST permitir emitir una review únicamente cuando la reserva relacionada esté en estado `completed`.
- **FR-004**: El sistema MUST aceptar reviews únicamente durante los 14 días naturales posteriores a la finalización del alquiler.
- **FR-005**: El sistema MUST impedir más de una review por autor, reserva y dirección de valoración.
- **FR-006**: El sistema MUST impedir que una persona valore una reserva en la que no participa o se valore a sí misma.
- **FR-007**: El sistema MUST registrar una puntuación general de 1 a 5 estrellas.
- **FR-008**: El sistema MUST registrar puntuaciones específicas de 1 a 5 para las categorías aplicables a cada dirección de valoración.
- **FR-009**: Para la valoración del propietario, el sistema MUST admitir como mínimo las categorías Comunicación, Puntualidad y Estado del producto.
- **FR-010**: Para la valoración del arrendatario, el sistema MUST admitir como mínimo las categorías Comunicación, Cuidado del producto y Puntualidad.
- **FR-011**: El sistema MUST permitir un comentario textual opcional asociado a la review.
- **FR-012**: El sistema MUST mantener las reviews de ambas partes ocultas entre sí y ocultas del público hasta que ambas se hayan enviado o finalice la ventana de 14 días.
- **FR-013**: Cuando ambas partes hayan enviado su review antes del vencimiento, el sistema MUST publicar ambas reviews simultáneamente.
- **FR-014**: Cuando venza la ventana de 14 días, el sistema MUST publicar las reviews válidas que hayan sido enviadas, aunque falte la review de la otra parte, y MUST incluirlas en los agregados públicos.
- **FR-015**: El sistema MUST excluir de la visibilidad pública y de los agregados cualquier review que aún esté protegida por doble ciego o pendiente de una decisión de moderación.
- **FR-016**: El sistema MUST mostrar en fichas de producto la puntuación general agregada, el número de reviews publicadas y las categorías de producto aplicables.
- **FR-017**: El sistema MUST mostrar en perfiles de usuario la puntuación general agregada, el número de reviews publicadas y el contenido público permitido.
- **FR-018**: El sistema MUST permitir reportar reviews publicadas por motivos de contenido ofensivo, inapropiado, falso o no relacionado con la operación.
- **FR-019**: El sistema MUST evitar más de un reporte activo equivalente del mismo usuario sobre la misma review.
- **FR-020**: El sistema MUST permitir que un moderador resuelva un reporte manteniendo trazabilidad de la decisión y del estado final de la review.
- **FR-021**: El sistema MUST preservar la independencia entre las reviews: una parte no puede editar, borrar ni condicionar la review de la otra.
- **FR-022**: El sistema MUST comunicar de forma clara por qué una review no está visible todavía cuando el autor o participante autorizado consulte su estado.

### Key Entities

- **Review**: valoración emitida por un participante de una reserva hacia la otra parte, con puntuación general, puntuaciones por categoría, comentario opcional, estado de publicación y timestamps.
- **Booking**: operación de alquiler que determina la elegibilidad, las partes participantes y la fecha de finalización que inicia la ventana de 14 días.
- **ReviewCategoryScore**: puntuación específica dentro de una categoría aplicable a la dirección de valoración.
- **ReviewReport**: reporte de una review por contenido inapropiado, ofensivo, falso o no relacionado, con estado y resolución.
- **User Reputation**: resultado agregado de reviews publicadas dirigidas a un usuario.
- **Listing Reputation**: resultado agregado de reviews publicadas sobre un producto.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El 100% de las reviews aceptadas por el sistema está asociada a una reserva `completed`, a un autor participante y a un destinatario distinto del autor.
- **SC-002**: El 100% de las reviews enviadas fuera de la ventana de 14 días se rechaza sin modificar reputaciones ni agregados públicos.
- **SC-003**: El 100% de las reviews duplicadas para la misma reserva y dirección se bloquea conservando una única valoración válida.
- **SC-004**: El 100% de las reviews de una operación permanece oculto entre las partes hasta que se cumpla la regla doble ciega definida.
- **SC-005**: Al menos el 95% de las reviews válidas puede completarse en menos de 2 minutos desde el inicio del formulario hasta la confirmación, medido sobre un mínimo de 20 sesiones de prueba.
- **SC-006**: El 100% de las fichas y perfiles con reputación publicada muestra una puntuación agregada y un recuento coherente con las reviews visibles.
- **SC-007**: El 100% de los reportes aceptados conserva un estado de resolución y un resultado de moderación consultable por los responsables autorizados.
- **SC-008**: Al menos el 90% de los usuarios de prueba entiende si una review está publicada u oculta y por qué, sin asistencia adicional.

## Assumptions

- La ventana de 14 días comienza al finalizar el alquiler y se calcula en días naturales según la fecha local de finalización de la reserva.
- `completed` es el único estado que habilita reviews; reservas `accepted`, `active`, `rejected` o `cancelled` no son elegibles.
- La primera versión usa puntuación general y categorías, pero no permite editar una review después de su publicación.
- Si solo una parte envía su review dentro de la ventana, esa review se publica al vencer los 14 días y cuenta para la reputación pública; la parte ausente no genera una review automática.
- El comentario es opcional y no es necesario para publicar una puntuación válida.
- Las reviews de producto son emitidas por el arrendatario hacia el propietario respecto al listing alquilado; las reviews de usuario son emitidas por el propietario hacia el arrendatario.
- La reputación pública se calcula únicamente con reviews publicadas y no reportadas en revisión.
- La plataforma contará con un rol de moderación autorizado para resolver reportes.
- La moderación automática, el análisis avanzado de fraude y la ponderación por recencia de `REV-007` quedan fuera del MVP; cualquier ponderación futura no debe alterar la regla de elegibilidad ni el doble ciego.
