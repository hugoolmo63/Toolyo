# Feature Specification: Catálogo de Componentes Visuales y UI Kits

**Feature Branch**: `00-visual-components-ui-kit`

**Created**: 2026-08-24

**Status**: Approved

**Input**: User description: "Definir el catálogo de componentes visuales (UI Kit/Design System) y establecer el estilo base de la plataforma para unificarnos antes de prototipar pantallas. Analizar las especificaciones funcionales e identificar los componentes del MVP. Crear cuatro propuestas de estilos visuales independientes y una sección de elección de estilo con status pending_approval."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Revisar un catálogo común de componentes MVP (Priority: P1)

Como equipo de producto y diseño, queremos disponer de un catálogo único de componentes visuales derivados del alcance MVP para prototipar pantallas coherentes y poder revisar cada componente antes de implementarlo.

**Why this priority**: Sin un vocabulario visual compartido, las pantallas de autenticación, listings, reservas, chat y administración pueden divergir en comportamiento, estados y accesibilidad.

**Independent Test**: Un revisor puede recorrer el catálogo y localizar los componentes necesarios para registro, creación y búsqueda de listings, reserva, chat, review y backoffice, incluyendo sus estados principales y uso previsto.

**Acceptance Scenarios**:

1. **Given** el catálogo abierto, **When** el revisor busca un flujo del MVP, **Then** encuentra los componentes de entrada, navegación, feedback y acción necesarios para completar ese flujo.
2. **Given** un componente interactivo documentado, **When** el revisor consulta su ficha, **Then** puede identificar su estado normal, foco, deshabilitado, carga, error y éxito cuando sean aplicables.
3. **Given** una pantalla con varios componentes, **When** el equipo compara sus fichas, **Then** sus colores, tipografías, radios, bordes y elevación provienen de reglas comunes de la propuesta elegida.

### User Story 2 - Comparar cuatro direcciones visuales (Priority: P1)

Como equipo de producto, queremos comparar cuatro UI Kits independientes para elegir una dirección visual que transmita confianza, facilidad de uso y el carácter de alquiler entre particulares de la plataforma.

**Why this priority**: La decisión de estilo afecta a toda la experiencia y debe tomarse antes de prototipar para evitar retrabajo visual y decisiones contradictorias.

**Independent Test**: Un revisor puede comparar las cuatro propuestas usando los mismos criterios: paleta, tipografía, forma, elevación y tratamiento de botones, formularios, badges, tarjetas, modales y chat.

**Acceptance Scenarios**:

1. **Given** las cuatro propuestas, **When** el equipo las compara, **Then** cada una tiene una identidad diferenciada y especifica primario, secundario, error y éxito.
2. **Given** un componente clave como una tarjeta de listing o una caja de chat, **When** se revisa en cada propuesta, **Then** su aspecto puede describirse sin depender de una implementación concreta.
3. **Given** la sección de elección de estilo, **When** nadie ha aprobado todavía una opción, **Then** el selector conserva `status: pending_approval` y no presenta una opción como definitiva.

### User Story 3 - Preparar la decisión y el handoff (Priority: P2)

Como responsable de producto, quiero registrar la opción seleccionada y los criterios de decisión para que el equipo pueda avanzar a prototipos con una referencia aprobada.

**Why this priority**: El registro explícito evita que una preferencia informal se convierta accidentalmente en la base del producto y facilita revisar la decisión con las partes interesadas.

**Independent Test**: Una persona autorizada puede marcar una única opción, añadir la fecha y observaciones de la decisión, y comprobar que el estado deja de estar pendiente.

**Acceptance Scenarios**:

1. **Given** cuatro opciones disponibles y `pending_approval`, **When** la persona responsable marca una opción, **Then** queda identificada como seleccionada y las otras tres permanecen sin seleccionar.
2. **Given** una opción seleccionada, **When** el equipo consulta el documento, **Then** ve el estado de aprobación, la opción elegida, la fecha y las notas de decisión.

### Edge Cases

- El color de error o éxito no debe ser el único indicador: los estados también muestran texto, iconografía o estructura reconocible.
- Los nombres largos de productos, usuarios y categorías deben truncarse o pasar a una segunda línea sin romper tarjetas, badges ni botones.
- Un listing sin foto, sin rating, sin badge o perteneciente a un usuario no verificado debe conservar una composición estable y explicar la ausencia de datos.
- Un formulario con errores múltiples debe mostrar el error junto al campo afectado y un resumen comprensible sin desplazar de forma inesperada la acción principal.
- Un chat vacío, con mensaje largo, con imagen adjunta o con estado de envío fallido debe seguir siendo legible y ofrecer una acción de recuperación.
- Los componentes deben mantener contraste, foco visible y objetivos táctiles utilizables en desktop y móvil.

## Requirements *(mandatory)*

### Alcance del catálogo MVP

El catálogo cubre los flujos de registro y verificación email/teléfono, perfil básico, creación y gestión de listings con hasta cinco fotos, búsqueda por ubicación y categoría, detalle de producto, solicitud de reserva con aprobación manual, chat básico, review inmediata y panel administrativo básico. Pagos automatizados, seguros integrados y calendarios complejos quedan fuera del MVP, aunque el sistema visual debe permitir extenderlos después.

### Functional Requirements

- **FR-001**: El catálogo MUST definir tokens visuales comunes para color, tipografía, espaciado, bordes, radios, sombras, foco, estados y capas, de forma que una propuesta elegida pueda aplicarse de manera consistente.
- **FR-002**: El catálogo MUST incluir botones de acción primaria, secundaria, terciaria, destructiva, icon-only y estados normal, hover, focus, pressed, disabled y loading.
- **FR-003**: El catálogo MUST incluir inputs de texto, email, contraseña, búsqueda, precio, ubicación y textarea, con label, ayuda, contador cuando aplique, placeholder, foco, error, éxito y disabled.
- **FR-004**: El catálogo MUST incluir selector de categoría con búsqueda, jerarquía de categorías y estado sin resultados, además de selectores de ubicación y ordenación.
- **FR-005**: El catálogo MUST incluir selector de fechas y calendario de disponibilidad para la futura experiencia de reserva, diferenciando disponible, seleccionado, bloqueado, no disponible, hoy, rango y error de disponibilidad.
- **FR-006**: El catálogo MUST incluir badges de usuario y producto, como Verificado, Registrado, Superarrendador, Popular, Nuevo, Fast responder, En revisión, Publicado, Pausado, Rechazado y Reserva pendiente.
- **FR-007**: El catálogo MUST incluir tarjetas de catálogo/listing con imagen principal o estado vacío, título, precio diario, ubicación/distancia, rating, número de reviews, arrendador, avatar, badges, favorito y estados de carga y error.
- **FR-008**: El catálogo MUST incluir componentes de detalle de producto para galería, miniaturas, zoom/fullscreen, descripción, características, precios, perfil del arrendador, seguro informativo, reviews, productos similares y acciones Contactar y Reservar.
- **FR-009**: El catálogo MUST incluir modales y diálogos para confirmación, cancelación, eliminación, aviso de usuario no verificado, preview de listing, formulario de review y mensajes de error o éxito, con cierre, foco y acción principal definidos.
- **FR-010**: El catálogo MUST incluir cajas de chat para conversación, composer de mensaje, adjuntar imagen, respuesta rápida, timestamp, estados enviado/pendiente/fallido, indicador de usuario verificado, moderación y conversación vacía.
- **FR-011**: El catálogo MUST incluir feedback y navegación del MVP: toast/alert, banner contextual, tooltip, avatar, rating de estrellas, progress stepper del wizard, tabs, breadcrumbs, paginación/infinite scroll, menú, sidebar y estados empty/loading/skeleton/error.
- **FR-012**: Cada componente MUST documentar propósito, contenido mínimo, variantes, estados, comportamiento responsive, reglas de accesibilidad y ejemplos de uso en los flujos MVP.
- **FR-013**: Las cuatro propuestas MUST ser independientes y definir paleta primaria, secundaria, error y éxito, tipografía con tamaños de encabezado y cuerpo, bordes, sombras, radios y aspecto de los componentes clave.
- **FR-014**: La propuesta elegida MUST poder identificarse mediante un único selector con `status`, `selected_option`, `approved_by`, `approved_at` y `decision_notes`; antes de la aprobación, `status` MUST ser `pending_approval` y `selected_option` MUST ser `null`.
- **FR-015**: Todos los estados de color MUST tener una alternativa no cromática y las combinaciones de texto y superficie MUST mantener contraste suficiente para lectura y foco visibles.

### Propuestas de estilo visual / UI Kits

#### Opción 1: Clean / Minimal

- **Dirección**: Precisa, luminosa y silenciosa; prioriza escaneabilidad y sensación de producto fácil de usar.
- **Paleta**: Primario `#165DFF` (azul acción), secundario `#E8EEF8` (azul niebla), superficie `#FFFFFF`, fondo `#F7F9FC`, texto `#172033`, error `#D92D20` sobre `#FEF3F2`, éxito `#16803C` sobre `#ECFDF3`, warning `#B54708` sobre `#FFFAEB`.
- **Tipografía**: Encabezados `Manrope` 700, cuerpo `Source Sans 3` 400/600. H1 36/44 px, H2 28/36 px, H3 20/28 px, cuerpo 16/24 px, texto auxiliar 14/20 px, etiqueta 12/16 px.
- **Forma**: Bordes de 1 px `#D7DEEA`, radios 6 px en controles y 10 px en tarjetas/modales, sombras cortas y suaves `0 4px 16px rgba(23,32,51,.08)`.
- **Componentes clave**: Botón primario azul compacto con radio 6; input blanco con foco azul de 2 px; badge como cápsula discreta; tarjeta de listing blanca con imagen 4:3, metadatos densos y favorito en esquina; modal centrado con borde fino; chat en superficie azul muy pálida con burbuja propia y ajena diferenciadas por tono, no solo color.

#### Opción 2: Cálido / Sostenible

- **Dirección**: Cercana, humana y responsable; conecta el intercambio local con reutilización y confianza.
- **Paleta**: Primario `#176B5B` (verde bosque), secundario `#E7B75C` (mostaza suave), superficie `#FFFDF7`, fondo `#F3F0E8`, texto `#26342E`, error `#B42318` sobre `#FEE4E2`, éxito `#16794C` sobre `#E8F5E9`, warning `#9A6700` sobre `#FFF4CE`.
- **Tipografía**: Encabezados `DM Sans` 700, cuerpo `Nunito Sans` 400/600. H1 38/46 px, H2 30/38 px, H3 22/30 px, cuerpo 16/25 px, texto auxiliar 14/21 px, etiqueta 12/17 px.
- **Forma**: Bordes de 1 px `#D9D2C2`, radios 10 px en controles y 14 px en tarjetas, sombra cálida `0 6px 18px rgba(61,54,39,.10)`; evita exceso de ornamento.
- **Componentes clave**: Botón primario verde con etiqueta clara y acento mostaza para foco/acción secundaria; inputs con fondo marfil; badges de confianza con icono; tarjetas de listing con imagen amplia, etiqueta de zona y copy humano; modal con cabecera cálida; chat con burbujas verde bosque y marfil, separadores suaves y avatar visible.

#### Opción 3: Profesional / Seguro

- **Dirección**: Sobria, robusta y transparente; hace visible la confianza, la verificación y el estado de cada transacción.
- **Paleta**: Primario `#173B6C` (azul seguridad), secundario `#0F766E` (teal confianza), superficie `#FFFFFF`, fondo `#F4F6F8`, texto `#1F2937`, error `#B42318` sobre `#FEF3F2`, éxito `#067647` sobre `#ECFDF3`, warning `#B54708` sobre `#FFFAEB`.
- **Tipografía**: Encabezados `IBM Plex Sans` 600/700, cuerpo `IBM Plex Sans` 400/500. H1 34/42 px, H2 26/34 px, H3 20/28 px, cuerpo 16/24 px, texto auxiliar 14/20 px, etiqueta 12/16 px.
- **Forma**: Bordes de 1 px `#C9D2DF`, radios 4 px en controles y 8 px en tarjetas/modales, sombras mínimas `0 2px 8px rgba(31,41,55,.10)`; separadores y estados aportan estructura.
- **Componentes clave**: Botón primario azul con altura consistente y estados explícitos; inputs con label persistente y validación inline; badge Verificado con icono de check y texto; tarjeta con banda de estado, precio y datos de arrendador muy legibles; modal de confirmación con jerarquía fuerte; chat tipo panel con marca temporal y estado de entrega claramente visible.

#### Opción 4: Vibrante / Comunitario

- **Dirección**: Enérgica, optimista y memorable; favorece descubrimiento y participación sin sacrificar legibilidad.
- **Paleta**: Primario `#E85D3F` (coral), secundario `#146C94` (azul océano), acento `#F2C94C` (amarillo), superficie `#FFFFFF`, fondo `#FFF8F1`, texto `#202A35`, error `#B42318` sobre `#FEE4E2`, éxito `#087443` sobre `#EAF8F0`, warning `#9A6700` sobre `#FFF4CE`.
- **Tipografía**: Encabezados `Space Grotesk` 600/700, cuerpo `Atkinson Hyperlegible` 400/700. H1 40/48 px, H2 30/38 px, H3 22/30 px, cuerpo 16/25 px, texto auxiliar 14/21 px, etiqueta 12/17 px.
- **Forma**: Bordes de 2 px `#263746`, radios 8 px en controles y 12 px en tarjetas, sombra definida `3px 4px 0 #263746`; contraste entre superficies y acentos, sin gradientes en contenido informativo.
- **Componentes clave**: Botón primario coral con sombra sólida y pressed visible; inputs con borde oscuro y foco amarillo; badges coloridos acompañados de texto/icono; tarjetas con imagen dominante, precio en coral y favorito azul; modal blanco con marco marcado; chat con burbujas coral/azul y composer amarillo pálido.

### Key Entities *(include if feature involves data)*

- **Componente UI**: Elemento reutilizable con propósito, anatomía, variantes, estados, contenido y reglas de accesibilidad.
- **Token visual**: Valor compartido de color, tipografía, espaciado, radio, borde, sombra o foco que mantiene coherencia entre componentes.
- **UI Kit**: Propuesta completa de dirección visual compuesta por paleta, tipografía, forma, elevación y tratamiento de componentes.
- **Opción de estilo**: Una de las cuatro propuestas comparables, identificada por nombre, descripción y reglas visuales.
- **Decisión de estilo**: Registro de la opción seleccionada, estado de aprobación, persona responsable, fecha y notas.

## Elección de Estilo

```yaml
status: approved
selected_option: profesional-seguro
approved_by: both
approved_at: 2026-08-24
decision_notes: "Seleccionado el estilo profesional-seguro para transmitir máxima confianza en pagos, KYC y seguros del marketplace P2P."
```

La aprobación debe seleccionar exactamente una opción entre `clean-minimal`, `calido-sostenible`, `profesional-seguro` y `vibrante-comunitario`. Hasta entonces, las cuatro propuestas permanecen abiertas para revisión y ninguna debe tratarse como el estilo base definitivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El equipo puede localizar la ficha y los estados de cualquier componente requerido por los siete flujos MVP en menos de 5 minutos.
- **SC-002**: El 100% de los componentes interactivos del catálogo documenta al menos los estados normal, focus, disabled y error o éxito cuando corresponda.
- **SC-003**: Las cuatro propuestas especifican todos los campos visuales solicitados y se pueden comparar mediante una revisión de 30 minutos sin decisiones implícitas.
- **SC-004**: Al menos 4 de 5 revisores pueden describir las diferencias entre las cuatro propuestas y recomendar una opción tras consultar el documento.
- **SC-005**: Una vez aprobada una opción, el equipo puede construir un prototipo de una pantalla de búsqueda, detalle, reserva y chat sin inventar colores, tipografías, radios ni estados básicos.
- **SC-006**: En una revisión responsive, ningún componente clave presenta texto cortado, controles solapados o foco no visible en las anchuras móvil y desktop definidas por el equipo.

## Assumptions

- El catálogo se utilizará como referencia de diseño y prototipado del MVP web, con adaptación responsive a móvil y desktop.
- Los nombres de tipografías son direcciones de diseño y deberán confirmarse por disponibilidad y licencia antes de incorporarse al producto.
- La accesibilidad se considera desde el catálogo: contraste, foco, etiquetas, mensajes de error y alternativas no cromáticas son requisitos de diseño.
- El MVP utiliza precio fijo por día, ubicación textual, aprobación manual de reservas, chat básico y reviews de publicación inmediata; los componentes preparados para Fase 2 no amplían el alcance funcional actual.
- La información real de listings, usuarios, ratings y reservas será proporcionada por los flujos de producto; esta spec define su representación visual, no su modelo técnico.
- La aprobación final corresponde al equipo de producto/diseño antes de iniciar los prototipos de pantallas y el PR a `main`.
