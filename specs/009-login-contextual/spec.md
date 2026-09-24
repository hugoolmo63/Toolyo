# Feature Specification: Login contextual no intrusivo

**Feature Branch**: `009-login-contextual`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "El login debería ser menos intrusivo, mucho más sutil desde el punto de vista de navegación. Además, una vez identificado podrás o cerrar sesión o ir a tu dashboard. Opción A: diálogo solo para login; el registro permanece en la página completa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identificarse sin abandonar la página (Priority: P1)

Como visitante anónimo que navega por el catálogo público, quiero identificarme mediante un diálogo superpuesto a la página actual para no perder el contexto de navegación (búsqueda, filtros, listing, fechas seleccionadas).

**Why this priority**: Es el núcleo de la feature — elimina la navegación forzada a la página `/auth` que hoy interrumpe la exploración y provoca abandono en los puntos de conversión (contactar, reservar, publicar).

**Independent Test**: Desde cualquier página pública, un usuario anónimo pulsa "Entrar", completa sus credenciales en el diálogo y, al identificarse, permanece en la misma página con la sesión iniciada y la UI actualizada.

**Acceptance Scenarios**:

1. **Given** un usuario anónimo en una página pública, **When** pulsa "Entrar" en el header, **Then** se abre un diálogo de identificación superpuesto sin cambiar de página ni de URL.
2. **Given** el diálogo de identificación abierto, **When** el usuario introduce credenciales válidas, **Then** el diálogo se cierra, la sesión queda iniciada y la página refleja el estado autenticado sin recarga completa ni redirección.
3. **Given** el diálogo de identificación abierto, **When** el usuario introduce credenciales inválidas, **Then** se muestra el error dentro del diálogo sin cerrarlo y el contexto de la página se conserva.
4. **Given** el diálogo de identificación abierto, **When** el usuario lo cancela (botón de cierre, tecla Escape o clic fuera), **Then** el diálogo se cierra limpiamente y ninguna acción protegida se ejecuta.
5. **Given** el diálogo de identificación abierto, **When** el usuario pulsa el enlace de registro, **Then** navega a la página completa de creación de cuenta.

---

### User Story 2 - Acceder a la cuenta desde cualquier página pública (Priority: P1)

Como usuario identificado, quiero ver mi estado de sesión en el header de cualquier página pública y desde ahí ir a mi panel o cerrar sesión, sin tener que navegar primero al panel.

**Why this priority**: Hoy el header público muestra siempre "Iniciar sesión / Crear cuenta" incluso con sesión activa, y el cierre de sesión solo existe dentro del panel. El usuario identificado necesita una salida y un acceso directo visibles en todo momento.

**Independent Test**: Un usuario identificado visita la home o un listing, ve el indicador de su sesión en el header, despliega el menú y puede ir a su panel o cerrar sesión; un usuario anónimo ve los accesos de entrada y registro.

**Acceptance Scenarios**:

1. **Given** un usuario anónimo, **When** visualiza el header de una página pública, **Then** ve un acceso para identificarse y un acceso para crear cuenta.
2. **Given** un usuario identificado, **When** visualiza el header de una página pública, **Then** ve un indicador de sesión (identidad del usuario) en lugar de los accesos de entrada/registro.
3. **Given** un usuario identificado, **When** despliega el menú de sesión del header, **Then** encuentra las opciones "Ir a mi panel" y "Cerrar sesión".
4. **Given** un usuario identificado en una página pública, **When** selecciona "Ir a mi panel", **Then** navega a su área de cliente.
5. **Given** un usuario identificado en una página pública, **When** selecciona "Cerrar sesión", **Then** la sesión termina, el header vuelve al estado anónimo y el usuario permanece en la página pública actual.
6. **Given** un usuario identificado dentro del área de cliente, **When** cierra sesión, **Then** sale de la zona privada y no puede volver a acceder sin identificarse de nuevo.

---

### User Story 3 - Completar una acción protegida tras identificarse (Priority: P2)

Como visitante anónimo que intenta contactar, reservar o realizar otra acción que requiere cuenta, quiero que se me pida identificación en el momento y poder continuar la acción sin perder lo que había seleccionado.

**Why this priority**: Es el flujo de conversión principal del marketplace. Preservar la selección (fechas de reserva, listing concreto) tras la identificación reduce fricción y abandono.

**Independent Test**: Un usuario anónimo en un listing con fechas seleccionadas pulsa "Reservar", se identifica en el diálogo, y al cerrarse sigue en el mismo listing con las fechas intactas, pudiendo completar la reserva.

**Acceptance Scenarios**:

1. **Given** un usuario anónimo en la ficha de un producto, **When** pulsa "Contactar" o "Reservar", **Then** se abre el diálogo de identificación en lugar de redirigir a otra página.
2. **Given** un usuario anónimo con un rango de fechas seleccionado en un listing, **When** se identifica correctamente desde el diálogo, **Then** permanece en el mismo listing conservando la selección de fechas.
3. **Given** un usuario que cancela el diálogo de identificación abierto desde una acción protegida, **When** el diálogo se cierra, **Then** permanece en la página y la acción protegida no se ejecuta.
4. **Given** un usuario identificado en la ficha de un producto, **When** pulsa "Contactar" o "Reservar", **Then** la acción continúa directamente sin mostrar el diálogo.

---

### User Story 4 - Acceso directo a rutas protegidas (Priority: P3)

Como usuario que accede por enlace directo, marcador o email a una zona privada sin sesión activa, quiero ser llevado a identificarme y volver automáticamente a mi destino original tras el login.

**Why this priority**: Es la red de seguridad para navegaciones directas que el diálogo no puede interceptar (entrada externa, recarga, cookie expirada). Mantiene el comportamiento actual pero corrigiendo el retorno al destino.

**Independent Test**: Sin sesión, se accede directamente a una URL del área privada; se solicita identificación en la página completa y, tras login correcto, el usuario llega a la URL original solicitada (no al panel por defecto).

**Acceptance Scenarios**:

1. **Given** un usuario sin sesión, **When** navega directamente a una ruta del área privada, **Then** se le redirige a la página de identificación conservando el destino original.
2. **Given** un usuario que llegó a la página de identificación desde una ruta protegida, **When** se identifica correctamente, **Then** es devuelto al destino original solicitado.
3. **Given** cualquier flujo de identificación que use retorno a destino, **When** el login se completa, **Then** el parámetro de retorno se interpreta de forma consistente en todos los puntos de entrada (header, acciones protegidas, redirección de rutas privadas).
4. **Given** un usuario ya identificado, **When** visita la página de identificación, **Then** se le redirige a su panel o destino en lugar de mostrar el formulario.

---

### Edge Cases

- ¿Qué ocurre si la sesión expira o es revocada mientras el usuario tiene una página abierta? El header debe reflejar el estado real en la siguiente interacción y las acciones protegidas deben volver a pedir identificación.
- ¿Qué ocurre si el usuario abre el diálogo, navega a registro y vuelve? El contexto original de la acción protegida se pierde al ser navegación completa (comportamiento aceptado; el registro es página completa por decisión de alcance).
- ¿Cómo se comporta el diálogo con el foco y teclado? Debe gestionar foco, cierre con Escape y no permitir interacción con el contenido de fondo mientras está abierto.
- ¿Qué ocurre si el usuario cierra sesión en otra pestaña del navegador? El estado puede quedar desactualizado hasta la siguiente interacción o recarga; las acciones protegidas deben revalidar.
- ¿Qué ocurre si el retorno a destino apunta a una URL externa o malformada? Debe ignorarse y usarse el destino por defecto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST presentar la identificación como un diálogo superpuesto a la página actual cuando el usuario la solicita desde páginas públicas o acciones protegidas, sin navegación de página.
- **FR-002**: El diálogo de identificación MUST incluir el formulario de email y contraseña existente (incluida la opción de sesión persistente), mostrar errores de validación y de credenciales dentro del propio diálogo, y ofrecer un enlace a la página completa de registro.
- **FR-003**: Tras una identificación exitosa desde el diálogo, el sistema MUST cerrarlo y actualizar el estado de sesión visible en la página actual sin recarga completa ni redirección.
- **FR-004**: Las acciones que requieren cuenta (contactar, reservar y futuras equivalentes) MUST abrir el diálogo de identificación para usuarios anónimos en lugar de redirigir a la página de autenticación.
- **FR-005**: Tras identificarse desde una acción protegida, el usuario MUST permanecer en el mismo contexto conservando el estado de la página (listing, fechas seleccionadas, filtros de búsqueda).
- **FR-006**: El header de las páginas públicas MUST reflejar el estado real de sesión: usuario anónimo → accesos de "Entrar" (abre diálogo) y "Crear cuenta" (página completa); usuario identificado → menú de sesión.
- **FR-007**: El menú de sesión del usuario identificado MUST ofrecer al menos dos acciones: "Ir a mi panel" y "Cerrar sesión".
- **FR-008**: Al cerrar sesión desde una página pública, el usuario MUST permanecer en ella con el header actualizado a estado anónimo; al cerrar sesión desde el área privada, el usuario MUST salir de la zona protegida.
- **FR-009**: La creación de cuenta MUST permanecer como página completa; el diálogo de identificación solo cubre el login.
- **FR-010**: La navegación directa a rutas protegidas sin sesión MUST seguir redirigiendo a la página de identificación, conservando el destino original para el retorno tras el login.
- **FR-011**: El sistema MUST usar un único parámetro de retorno a destino, interpretado de forma consistente por todos los puntos de entrada (diálogo, página de autenticación, acciones protegidas, redirección de rutas privadas), validando que sea una ruta interna segura.
- **FR-012**: El estado de sesión consultado en el cliente MUST ser coherente entre todos los componentes que lo consumen (header, acciones protegidas, diálogo) sin consultas contradictorias.
- **FR-013**: El diálogo de identificación MUST ser accesible: gestión de foco al abrir/cerrar, cierre con Escape, cierre al interactuar fuera del diálogo, y bloqueo de interacción con el contenido de fondo.
- **FR-014**: El diálogo de identificación MUST respetar el sistema visual del producto (tema, tokens, estilos de formulario existentes).

### Key Entities *(include if feature involves data)*

- **Sesión**: estado de identificación del usuario (existente, cookie opaca validada en servidor). La feature consume el estado; no modifica su modelo ni su ciclo de vida.
- **Destino de retorno (callback)**: ruta interna a la que volver tras identificarse desde un acceso directo a zona protegida. Debe validarse como ruta interna segura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede completar la identificación desde cualquier página pública sin que cambie la URL ni se abandone la página en el 100% de los casos.
- **SC-002**: El 100% de las acciones protegidas conservan el contexto del usuario (listing, fechas, filtros) tras la identificación; cero pérdidas de selección.
- **SC-003**: Un usuario identificado puede llegar a su panel o cerrar sesión en un máximo de 2 interacciones desde cualquier página.
- **SC-004**: El retorno al destino original tras login desde una ruta protegida funciona en el 100% de los puntos de entrada (hoy existe un caso donde siempre retorna al panel por inconsistencia del parámetro).
- **SC-005**: El diálogo de identificación se puede abrir, completar y cerrar usando solo teclado, y supera las verificaciones de accesibilidad del proyecto.

## Assumptions

- Se reutiliza íntegramente el sistema de autenticación existente (sesión por cookie opaca validada en servidor, formulario email/contraseña con sesión persistente). No se modifica el backend ni el modelo de sesión.
- El registro de cuenta permanece como página completa (decisión de alcance acordada, opción A); el diálogo enlaza a ella.
- La página de autenticación actual se mantiene como destino para accesos directos a rutas protegidas, enlaces de email y como fallback general.
- El estado de sesión ya puede consultarse desde el cliente; la feature lo consume de forma coherente entre componentes.
- El estilo visual del diálogo reutiliza los estilos de diálogo y formularios ya definidos en el sistema de diseño del producto.
- Cambios de sesión desde otras pestañas del navegador se reflejan en la siguiente interacción o recarga; no se requiere sincronización en tiempo real entre pestañas.
