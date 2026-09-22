# Feature Specification: Gestión de productos para alquiler

**Feature Branch**: `006-gestion-productos-alquiler`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "como usuario identificado quisiera poder publicar coasas para su alquiler. Una vez identificado, podre acceder a mi panel de productos gestionarlos, los que tengo en alquiler, modificarlos, consultarlos, crear nuevo, eliminar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el panel de productos publicados (Priority: P1)

Como usuario identificado que ofrece productos en alquiler, quiero acceder a un panel con los productos que tengo publicados o gestionados para consultar rápidamente su información y estado.

**Why this priority**: El panel es el punto de entrada necesario para gestionar el inventario de alquiler y permite al propietario conocer qué productos están disponibles para los interesados.

**Independent Test**: Un usuario identificado con uno o más productos entra en su panel y puede ver únicamente sus productos, sus datos principales y su estado de publicación; un usuario sin productos ve un estado vacío útil.

**Acceptance Scenarios**:

1. **Given** un usuario identificado con productos de alquiler, **When** accede a su panel de productos, **Then** ve una lista de los productos que le pertenecen con nombre, imagen principal, categoría, precio de alquiler y estado.
2. **Given** un usuario identificado sin productos, **When** accede al panel, **Then** ve un mensaje indicando que todavía no tiene productos publicados y una acción clara para crear el primero.
3. **Given** un usuario identificado, **When** consulta su panel, **Then** no ve productos pertenecientes a otros usuarios.
4. **Given** un usuario no identificado, **When** intenta acceder al panel de productos, **Then** se le solicita identificarse y no se muestran datos privados ni productos del panel.

---

### User Story 2 - Publicar un nuevo producto para alquiler (Priority: P1)

Como usuario identificado, quiero crear y publicar un producto indicando la información necesaria para que otras personas puedan conocerlo y solicitar su alquiler.

**Why this priority**: La creación de productos es la capacidad principal que permite ampliar la oferta de alquiler de la plataforma.

**Independent Test**: Un usuario identificado completa el formulario con datos válidos, confirma la publicación y comprueba que el producto aparece en su panel con el estado correspondiente y con la información que proporcionó.

**Acceptance Scenarios**:

1. **Given** un usuario identificado en el panel, **When** selecciona crear producto, **Then** puede introducir como mínimo título, descripción, categoría, precio de alquiler, ubicación aproximada, imágenes y condiciones básicas de alquiler.
2. **Given** un formulario con todos los datos obligatorios válidos, **When** el usuario confirma, **Then** se crea un único producto asociado a su cuenta y aparece en su panel.
3. **Given** un formulario con datos obligatorios ausentes o inválidos, **When** el usuario intenta publicar, **Then** se indican los campos que debe corregir y no se crea el producto.
4. **Given** un usuario que abandona el formulario antes de confirmarlo, **When** vuelve al panel, **Then** no aparece un producto incompleto como publicado.

---

### User Story 3 - Modificar y consultar un producto propio (Priority: P1)

Como usuario identificado, quiero abrir un producto propio y modificar sus datos para mantener actualizada la oferta de alquiler.

**Why this priority**: La información de un producto puede cambiar; poder corregirla evita publicaciones desactualizadas y mantiene la confianza de quienes alquilan.

**Independent Test**: El propietario abre uno de sus productos, consulta todos sus datos editables, cambia un valor permitido, guarda y comprueba que el cambio se refleja en el panel y en la consulta del producto.

**Acceptance Scenarios**:

1. **Given** un usuario identificado que posee un producto, **When** selecciona consultarlo, **Then** ve sus datos completos, estado y acciones disponibles para gestionarlo.
2. **Given** el propietario en la edición de un producto, **When** cambia datos válidos y guarda, **Then** se conserva la modificación y se muestra una confirmación clara.
3. **Given** el propietario editando un producto, **When** introduce datos inválidos, **Then** recibe mensajes asociados a los campos afectados y se conservan los datos anteriores hasta guardar una versión válida.
4. **Given** un usuario que intenta editar un producto ajeno o inexistente, **When** solicita su edición, **Then** la operación se rechaza sin revelar información del producto.

---

### User Story 4 - Retirar un producto del alquiler (Priority: P2)

Como usuario identificado, quiero eliminar o retirar un producto propio para que deje de ofrecerse cuando ya no deseo alquilarlo.

**Why this priority**: La retirada permite mantener un inventario fiable y evita que otras personas soliciten productos que ya no están disponibles.

**Independent Test**: El propietario inicia la eliminación de un producto, confirma explícitamente la acción y comprueba que deja de aparecer como producto disponible para el público y en sus productos activos.

**Acceptance Scenarios**:

1. **Given** un usuario identificado que posee un producto, **When** selecciona eliminarlo, **Then** se muestra una confirmación que identifica el producto y explica que dejará de estar disponible.
2. **Given** la confirmación de eliminación, **When** el usuario confirma, **Then** el producto deja de mostrarse como disponible para nuevos alquileres y no aparece en la lista de productos activos.
3. **Given** el diálogo de confirmación, **When** el usuario cancela, **Then** el producto permanece sin cambios.
4. **Given** un producto con un alquiler vigente o una solicitud pendiente, **When** el propietario intenta eliminarlo, **Then** se informa de la situación y se impide una eliminación que incumpla las obligaciones existentes.

### Edge Cases

- Un usuario que pierde su identificación durante cualquier operación no puede crear, editar ni eliminar productos; la operación se cancela sin exponer datos.
- Dos acciones consecutivas de publicación o guardado no deben crear duplicados ni sobrescribir cambios de forma silenciosa.
- Un producto sin imágenes válidas debe mostrar un estado visual alternativo y no romper el panel, pero no puede publicarse si la imagen es un requisito obligatorio.
- Un precio cero, negativo o con un formato no válido debe rechazarse con un mensaje comprensible.
- Un producto que fue retirado o eliminado no debe aparecer en los resultados públicos ni poder alquilarse, aunque exista un enlace antiguo.
- Si el producto tiene reservas o solicitudes activas, la retirada debe preservar la información necesaria para esas operaciones y no cancelar compromisos automáticamente.
- Si la lista contiene muchos productos, el usuario debe poder localizar sus productos sin que el panel se vuelva inutilizable.
- Los mensajes de error no deben incluir información de productos pertenecientes a otros usuarios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST exigir que el usuario esté identificado antes de permitirle acceder al panel privado de productos o ejecutar acciones de creación, consulta detallada, modificación y eliminación.
- **FR-002**: El sistema MUST mostrar en el panel únicamente los productos asociados al usuario identificado, incluyendo como mínimo título, imagen principal o estado alternativo, categoría, precio y estado de publicación.
- **FR-003**: El sistema MUST ofrecer un estado vacío comprensible y una acción para crear un producto cuando el usuario no tenga productos gestionables.
- **FR-004**: El sistema MUST permitir crear un producto con título, descripción, categoría, precio de alquiler, ubicación aproximada, imágenes y condiciones básicas de alquiler, indicando claramente qué datos son obligatorios.
- **FR-005**: El sistema MUST validar los datos obligatorios y sus formatos antes de crear o publicar un producto, y MUST mostrar los errores junto a los campos que deben corregirse.
- **FR-006**: El sistema MUST asociar cada producto creado exclusivamente con la cuenta del usuario que lo crea y MUST evitar la creación de duplicados por una misma confirmación repetida.
- **FR-007**: El sistema MUST permitir al propietario consultar la información completa de cada producto propio y su estado actual de publicación o disponibilidad.
- **FR-008**: El sistema MUST permitir al propietario modificar los datos editables de un producto propio y MUST mostrar una confirmación cuando los cambios se guarden correctamente.
- **FR-009**: El sistema MUST conservar la versión anterior de los datos si una modificación no supera la validación o no se guarda correctamente.
- **FR-010**: El sistema MUST impedir que un usuario consulte, modifique o elimine productos que no le pertenecen, sin revelar si esos productos existen.
- **FR-011**: El sistema MUST solicitar una confirmación explícita antes de retirar o eliminar un producto y MUST mantenerlo sin cambios si el usuario cancela.
- **FR-012**: El sistema MUST retirar el producto de la oferta pública y de los nuevos alquileres cuando el propietario confirme su eliminación, sin borrar la información necesaria para cumplir alquileres o solicitudes ya existentes.
- **FR-013**: El sistema MUST impedir la eliminación o retirada incompatible con alquileres vigentes o solicitudes pendientes y MUST explicar al propietario qué situación debe resolverse.
- **FR-014**: El sistema MUST impedir que productos retirados, eliminados o no publicados aparezcan como disponibles para nuevos usuarios mediante búsquedas o enlaces antiguos.
- **FR-015**: El sistema MUST mostrar mensajes de éxito, validación y error comprensibles, sin exponer información privada ni detalles de productos de otros usuarios.
- **FR-016**: El sistema MUST conservar los cambios confirmados y reflejarlos de forma consistente en el panel privado y en la consulta pública permitida del producto.
- **FR-017**: El panel MUST seguir siendo utilizable cuando el usuario gestione una cantidad elevada de productos, permitiendo localizar un producto sin tener que revisar una lista completa de una sola vez.

### Key Entities *(include if feature involves data)*

- **Producto de alquiler**: Bien ofrecido para alquiler, con título, descripción, categoría, precio, ubicación aproximada, imágenes, condiciones, estado y relación con su propietario.
- **Propietario**: Usuario identificado que crea y gestiona sus productos; solo puede administrar productos asociados a su propia cuenta.
- **Estado de publicación**: Situación del producto dentro del ciclo de gestión, como borrador, publicado, pausado o retirado, que determina si puede aparecer públicamente y recibir nuevos alquileres.
- **Solicitud o alquiler**: Relación entre un producto y una persona interesada o arrendataria, con un estado que puede limitar la retirada del producto mientras existan compromisos activos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de los usuarios identificados con productos puede localizar y abrir un producto concreto desde el panel en menos de 30 segundos durante una prueba de usabilidad.
- **SC-002**: Al menos el 90% de los usuarios identificados puede completar la publicación de un producto con datos válidos en menos de 5 minutos y sin asistencia externa.
- **SC-003**: El 100% de las operaciones de gestión verificadas rechaza el acceso a productos que pertenecen a otro usuario y no expone sus datos.
- **SC-004**: Al menos el 95% de las modificaciones válidas confirmadas se refleja en el panel y en la consulta pública correspondiente en menos de 5 segundos.
- **SC-005**: El 100% de los productos retirados deja de aparecer como disponible para nuevos alquileres y búsquedas públicas tras la confirmación de retirada.
- **SC-006**: Al menos el 90% de los usuarios de prueba entiende qué ocurrió después de crear, modificar, cancelar o retirar un producto, según una encuesta posterior a la tarea.

## Assumptions

- La plataforma ya dispone de un mecanismo de identificación de usuarios; esta feature no define el registro ni el inicio de sesión.
- La gestión se realiza inicialmente desde una experiencia web adaptable; las aplicaciones nativas quedan fuera del alcance.
- Un producto puede guardarse como borrador para completar los datos antes de publicarlo, pero solo los productos publicados aparecen en la oferta pública.
- La eliminación se interpreta como retirada lógica de la oferta, no como destrucción inmediata de la información necesaria para alquileres, solicitudes, auditoría o cumplimiento legal.
- La ubicación mostrada públicamente será aproximada para proteger la privacidad del propietario; la dirección exacta no forma parte de esta feature.
- Las reservas, pagos, mensajería, valoraciones y verificación de identidad existentes se reutilizan como dependencias y no se amplían aquí, salvo las reglas necesarias para proteger sus operaciones activas.
- Los requisitos detallados de campos, categorías, límites de imágenes y políticas de moderación se concretarán durante la planificación a partir de las reglas vigentes del proyecto.
