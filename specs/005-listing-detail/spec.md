# Feature Specification: Página de Detalle del Producto

**Feature Branch**: `005-listing-detail`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Crear la feature correspondiente a la sección 3.3 (Página de Detalle del Producto) de `docs/04-especificaciones-funcionales.md`. Cuando un visitante (logado o no) llega a la página de detalle de un listing desde un resultado de búsqueda, desde un pin del mapa o desde un enlace compartido, ve la ficha completa del producto: galería de imágenes con carrusel/zoom/fullscreen, título, descripción y características, calendario de disponibilidad interactivo, tabla de precios, perfil del arrendador, botones de Contactar y Reservar, sección de reviews, productos similares, información del seguro aplicable y reglas del arrendador. Debe cubrir DET-001 a DET-011."

### Trazabilidad con la especificación funcional

| Requisito fuente | Cobertura en esta feature |
|---|---|
| DET-001 — Galería de imágenes con carrusel, zoom, fullscreen | User Story 1; FR-001, FR-002 |
| DET-002 — Título, descripción completa, características | User Story 1; FR-003 |
| DET-003 — Calendario de disponibilidad interactivo (selección de fechas de recogida y devolución) | User Story 2; FR-004, FR-005 |
| DET-004 — Tabla de precios escalonados (días vs. precio/día vs. total) | User Story 2; FR-006 |
| DET-005 — Perfil del arrendador con foto, nombre, rating, tiempo de respuesta, número de transacciones | User Story 1; FR-007 |
| DET-006 — Botón de "Contactar" que abre chat con el arrendador | User Story 3; FR-008 |
| DET-007 — Botón de "Reservar" que inicia el flujo de checkout | User Story 3; FR-009 |
| DET-008 — Sección de reviews con puntuación media, distribución de estrellas y reviews individuales con fotos | User Story 1; FR-010 |
| DET-009 — Productos similares en la misma zona/categoría | User Story 1; FR-011 |
| DET-010 — Información del seguro aplicable y franquicia (si aplica) | User Story 1; FR-012 |
| DET-011 — Reglas del arrendador (política de cancelación, horarios de recogida/devolución) | User Story 1; FR-013 |
| `docs/04-especificaciones-funcionales.md` §3.3 — Página de Detalle del Producto | Toda la feature |
| `docs/04-especificaciones-funcionales.md` §10 — MVP (precio fijo, reviews inmediatas, chat básico, reservas manuales sin pago, seguros para Fase 2) | Alcance de esta feature |
| `constitution/DESIGN.md` — tema `profesional-seguro`, accesibilidad WCAG 2.1 AA | User Story 1; FR-014 |
| `constitution/FRONTEND.md` — Server-first, RSC por defecto, Client Components solo para interactividad | User Story 1, 2; FR-015 |
| `constitution/SECURITY.md` — protección de datos privados, no exposición de datos personales | User Story 1; FR-016 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la ficha completa de un producto (Priority: P1)

Como visitante (con o sin sesión) que llega a la página de detalle de un listing desde un resultado de búsqueda, un pin del mapa o un enlace compartido, quiero ver toda la información relevante del producto de un vistazo (galería, título, descripción, características, perfil del arrendador, reviews, productos similares, seguro aplicable y reglas) para decidir si me interesa alquilarlo sin tener que navegar a otras páginas ni identificarme.

**Why this priority**: Es la continuación natural del embudo de descubrimiento iniciado en `004-public-search`: la tarjeta lleva al detalle, y el detalle es donde el visitante evalúa el producto y al arrendador antes de contactar o reservar. Sin la ficha completa, la búsqueda pierde utilidad porque el visitante no tiene información suficiente para decidir. Cubre DET-001, DET-002, DET-005, DET-008, DET-009, DET-010 y DET-011, que son las secciones puramente informativas y por tanto las que pueden entregarse sin depender de los módulos de reservas (§4), chat (§5) o seguros (§7).

**Independent Test**: Un visitante sin sesión abre la URL de detalle de un listing publicado (`/listings/[slug]`) y ve la galería de imágenes, el título, la descripción, las características, el perfil público del arrendador, la sección de reviews (o un estado vacío si no hay), los productos similares, la información de seguro aplicable y las reglas del arrendador, sin ser redirigido a login ni ver errores técnicos.

**Acceptance Scenarios**:

1. **Given** un visitante que llega a la URL `/listings/[slug]` de un listing publicado, **When** carga la página, **Then** ve la ficha del producto sin ser redirigido a login ni requerir identificación, y la página responde con un estado 200.
2. **Given** la página de detalle de un listing con varias fotos, **When** se renderiza, **Then** se muestra una galería con carrusel navegable (anterior/siguiente), indicador de foto actual/total, y la posibilidad de abrir una vista a pantalla completa y hacer zoom sobre la imagen activa.
3. **Given** la página de detalle, **When** se renderiza la cabecera del producto, **Then** se muestran el título, la descripción completa y las características del producto en texto legible, sin truncado agresivo.
4. **Given** la página de detalle, **When** se renderiza el perfil del arrendador, **Then** se muestran su foto, nombre, rating, tiempo de respuesta (si disponible) y número de transacciones (si disponible), junto con el badge de verificado si aplica; nunca se muestran datos privados (email, teléfono, dirección exacta).
5. **Given** la página de detalle de un listing con reviews, **When** se renderiza la sección de reviews, **Then** se muestran la puntuación media, la distribución de estrellas (1-5) y las reviews individuales con autor, comentario y fotos si las tuviera.
6. **Given** la página de detalle de un listing sin reviews, **When** se renderiza la sección de reviews, **Then** se muestra un estado vacío claro ("Aún no hay reviews para este producto") sin errores ni secciones en blanco.
7. **Given** la página de detalle, **When** se renderiza la sección de productos similares, **Then** se muestran listings de la misma categoría y/o zona, cada uno enlazando a su propio detalle, sin duplicar el listing actual.
8. **Given** la página de detalle de un listing cuyo arrendador está verificado, **When** se renderiza la sección de seguro, **Then** se muestra la información del seguro aplicable y la franquicia (si la categoría la tiene) de forma informativa.
9. **Given** la página de detalle de un listing cuyo arrendador NO está verificado, **When** se renderiza la sección de seguro, **Then** se muestra un aviso informativo indicando que el alquiler no incluye seguro de plataforma porque el arrendador no ha verificado su identidad, sin bloquear la visualización.
10. **Given** la página de detalle, **When** se renderiza la sección de reglas, **Then** se muestran la política de cancelación y los horarios de recogida/devolución configurados por el arrendador (o valores por defecto claros si no los configuró).
11. **Given** un visitante que llega a la URL de un listing que no existe, fue eliminado o no está publicado, **When** carga la página, **Then** recibe una página 404 informativa, no un error 500 ni una ficha vacía.
12. **Given** un visitante que abre un enlace compartido de detalle, **When** carga la URL, **Then** la ficha se renderiza correctamente sin depender de que el visitante venga desde la búsqueda ni tenga estado previo en la URL.

---

### User Story 2 - Consultar disponibilidad y precios (Priority: P1)

Como visitante interesado en un producto quiero ver el calendario de disponibilidad del listing y seleccionar un rango de fechas (recogida y devolución) para comprobar qué días están libres y ver el precio total estimado según los días elegidos, antes de decidirme a contactar o reservar.

**Why this priority**: La disponibilidad y el precio son los dos datos que determinan si una reserva es viable. Cubre DET-003 y DET-004. Es prioritario porque sin calendario y precios el visitante no puede evaluar la viabilidad del alquiler y los botones de Reservar/Contactar pierden contexto.

**Independent Test**: Un visitante en la página de detalle selecciona un rango de fechas en el calendario y ve qué días están bloqueados, qué rango es válido, y el precio total estimado según los días seleccionados, sin necesidad de identificarse.

**Acceptance Scenarios**:

1. **Given** la página de detalle, **When** se renderiza el calendario, **Then** se muestran las fechas bloqueadas del listing (procedentes de `ListingAvailability`) marcadas visualmente como no disponibles, y el resto como disponibles.
2. **Given** el calendario renderizado, **When** el visitante selecciona una fecha de recogida y una fecha de devolución posterior, **Then** el rango se resalta visualmente y se muestra el número de días seleccionado.
3. **Given** un rango seleccionado que incluye fechas bloqueadas, **When** el visitante intenta seleccionarlo, **Then** el sistema impide la selección o la marca como inválida, e indica qué fecha del rango está bloqueada, sin permitir un rango inválido.
4. **Given** un rango válido seleccionado, **When** se calcula el precio, **Then** se muestra el desglose: días, precio por día aplicable y total estimado, conforme a la tabla de precios del listing.
5. **Given** la tabla de precios escalonados del listing, **When** se renderiza, **Then** se muestran los tramos (días vs. precio/día vs. total) de forma clara y legible.
6. **Given** un listing sin tramos de precios escalonados definidos (MVP: precio fijo por día), **When** se renderiza la tabla de precios, **Then** se muestra el precio por día y un total calculado linealmente para los días seleccionados, sin mostrar tramos vacíos.
7. **Given** un visitante que selecciona un rango y luego lo cambia, **When** actualiza la selección, **Then** el total y el resumen se recalculan sin recargar la página.

---

### User Story 3 - Iniciar contacto o reserva desde el detalle (Priority: P2)

Como visitante interesado en un producto quiero poder contactar al arrendador para hacerle una pregunta o iniciar una reserva directamente desde la ficha del producto, para avanzar hacia el alquiler sin tener que buscar otra vía de contacto.

**Why this priority**: Son las acciones de conversión del detalle (DET-006 y DET-007), pero su implementación completa depende de los módulos de chat (§5) y reservas/pagos (§4), que no están construidos en el MVP. Esta feature proporciona los **entry points** (botones) y el comportamiento de gating (login requerido, validación de rango seleccionado), y delega el flujo completo a las features futuras. Es P2 porque el detalle ya es útil sin estos botones funcionales (el visitante puede evaluar el producto), pero su ausión reduciría conversión.

**Independent Test**: Un visitante en la página de detalle pulsa "Contactar" o "Reservar"; si no está logado se le propone iniciar sesión de forma no bloqueante, y si lo está se le enruta al flujo correspondiente (o a un estado "próximamente" si el módulo destino aún no está disponible), sin que la página se rompa ni se le exija identificarse para ver la ficha.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión en la página de detalle, **When** pulsa "Contactar", **Then** se le propone iniciar sesión de forma no bloqueante (ej. redirección a login con callback de retorno o modal de login), sin perder el contexto del listing.
2. **Given** un visitante sin sesión en la página de detalle, **When** pulsa "Reservar", **Then** se le propone iniciar sesión de forma no bloqueante con callback de retorno al detalle.
3. **Given** un visitante logado en la página de detalle, **When** pulsa "Contactar", **Then** se le enruta a la futura página de mensajería (`/messages?listing=[slug]`) con el contexto del listing; mientras el módulo de chat (§5) no esté disponible, se muestra un estado informativo "Esta funcionalidad estará disponible próximamente" sin errores, y el visitante puede volver a la ficha.
4. **Given** un visitante logado en la página de detalle con un rango de fechas válido seleccionado, **When** pulsa "Reservar", **Then** se le enruta al futuro flujo de checkout (`/checkout?listing=[slug]&start=[fecha]&end=[fecha]`) con el listing y el rango pre-cargados; mientras el módulo de reservas/pagos (§4) no esté disponible, se muestra un estado informativo "Esta funcionalidad estará disponible próximamente" sin errores, y el visitante puede volver a la ficha.
5. **Given** un visitante logado que pulsa "Reservar" sin un rango de fechas seleccionado, **When** intenta reservar, **Then** se le indica que debe seleccionar un rango de fechas válido antes de continuar, sin avanzar al checkout.
6. **Given** un visitante que pulsa "Contactar" o "Reservar" y el módulo destino aún no está disponible, **When** se enruta al destino, **Then** se muestra un estado claro ("Esta funcionalidad estará disponible próximamente") sin errores técnicos, y el visitante puede volver a la ficha.
7. **Given** la página de detalle, **When** se renderizan los botones de acción, **Then** "Reservar" se presenta como acción principal y "Contactar" como acción secundaria, ambos con labels explícitos y foco visible.

---

### Edge Cases

- Un listing en estado distinto de `published` (borrador, en revisión, pausado, rechazado) o con `deletedAt` no nulo MUST devolver 404 en su URL de detalle; nunca debe mostrarse su ficha al público.
- Un listing cuyo arrendador tiene `accountStatus` suspendido o eliminado MUST devolver 404 en su URL de detalle.
- Un listing sin fotos MUST mostrar un placeholder accesible en la galería en lugar de un carrusel vacío o roto.
- Un listing sin descripción MUST ocultar la sección de descripción o mostrar un texto neutro, no un hueco vacío.
- Un listing sin `location`/`lat`/`lng` MUST seguir mostrando el resto de la ficha; la sección de productos similares puede basarse solo en categoría.
- Un visitante con conexión lenta MUST ver skeletons/placeholder de cada sección mientras carga, no una página en blanco.
- La galería MUST degradar con elegancia si una imagen no carga (placeholder con `alt`), sin romper el carrusel.
- El calendario MUST degradar con elegancia si no hay datos de `ListingAvailability` (se considera todo disponible) y MUST indicar visualmente que es informativo hasta confirmar reserva.
- La sección de reviews MUST mostrar un estado vacío útil cuando no hay reviews, no una sección oculta ni un error.
- La sección de productos similares MUST mostrar un estado vacío o omitirse si no hay listings similares, sin mostrar el listing actual ni listings no publicados.
- La información de seguro MUST ser informativa; esta feature no contrata ni gestiona reclamaciones de seguro (módulo §7, Fase 2).
- Las reglas del arrendador (cancelación, horarios) MUST mostrar valores por defecto claros cuando el arrendador no las configuró explícitamente.
- Los datos privados del arrendador (email, teléfono, dirección exacta, datos de pago) MUST nunca aparecer en la ficha pública; solo campos públicos (nombre, avatar, badge, rating, tiempo de respuesta, número de transacciones).
- Un visitante que vuelve a la ficha con el botón "Atrás" del navegador MUST recuperar el estado de selección de fechas si lo tenía (codificado en la URL o en estado de cliente persistente).
- La URL de detalle MUST ser canónica y compartible: dos visitas a la misma URL MUST mostrar la misma ficha independientemente de sesión o estado previo.
- Un listing con `isInstantBooking` activo y arrendador verificado MAY mostrar una indicación "Reserva instantánea disponible" en la ficha; la validación real de elegibilidad se hace en el flujo de reserva (§4).
- El contador de vistas (`viewCount`) MUST incrementarse al renderizar el detalle de un listing publicado, para alimentar la ordenación "Más popular" de la búsqueda; el mecanismo concreto (incremento en cada render, deduplicación por sesión/IP) se decide en el plan técnico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST servir una página de detalle pública en la URL `/listings/[slug]` para cada listing publicado, accesible sin sesión ni identificación, de forma que cualquier visitante pueda ver la ficha completa sin ser redirigido a login.
- **FR-002**: El sistema MUST mostrar una galería de imágenes del listing con carrusel navegable (anterior/siguiente), indicador de foto actual/total, vista a pantalla completa y zoom sobre la imagen activa, degradando con elegancia si una imagen no carga o si el listing no tiene fotos.
- **FR-003**: El sistema MUST mostrar el título, la descripción completa y las características del producto en texto legible, sin truncado agresivo, omitiendo secciones sin contenido en lugar de mostrar huecos vacíos.
- **FR-004**: El sistema MUST mostrar un calendario de disponibilidad interactivo que marque las fechas bloqueadas del listing (procedentes de `ListingAvailability`) como no disponibles y permita al visitante seleccionar un rango de fechas (recogida y devolución), impidiendo o marcando como inválida cualquier selección que incluya fechas bloqueadas.
- **FR-005**: El sistema MUST recalcular sin recargar la página el número de días y el precio total estimado cuando el visitante cambia el rango de fechas seleccionado, reflejando el rango en la URL para que sea compartible y restaurable.
- **FR-006**: El sistema MUST mostrar una tabla de precios del listing derivada por defecto desde `pricePerDay` (sin persistir tramos custom): tramos informativos para 1, 3 y 7 días calculados linealmente desde `pricePerDay`, con un descuento automático creciente por tramo (ej. 0% a 1 día, ~5% a 3 días, ~10% a 7 días — porcentajes concretos en el plan técnico) para reflejar el comportamiento esperado de "más días, menor precio/día". Para un rango seleccionado, MUST mostrar el tramo aplicable, el precio por día efectivo y el total estimado. La persistencia de tramos custom (`ListingPriceTier`) queda diferida a la feature de listings (§2); esta feature solo renderiza los tramos derivados.
- **FR-007**: El sistema MUST mostrar el perfil público del arrendador con foto, nombre, rating, tiempo de respuesta (si disponible), número de transacciones (si disponible) y badge de verificado si aplica, sin exponer datos privados (email, teléfono, dirección exacta, datos de pago).
- **FR-008**: El sistema MUST ofrecer un botón "Contactar" que inicie el flujo de chat con el arrendador; si el visitante no está logado, MUST proponer iniciar sesión de forma no bloqueante con callback de retorno al detalle; el flujo de chat completo se delega al módulo de mensajería (§5).
- **FR-009**: El sistema MUST ofrecer un botón "Reservar" que inicie el flujo de checkout con el listing y el rango de fechas pre-cargados; si el visitante no está logado, MUST proponer iniciar sesión de forma no bloqueante con callback; si no hay rango válido seleccionado, MUST indicar que se seleccione antes de continuar; el flujo de checkout completo se delega al módulo de reservas y pagos (§4).
- **FR-010**: El sistema MUST mostrar una sección de reviews con la puntuación media, la distribución de estrellas (1-5) y las reviews individuales con autor, comentario y fotos si las tuviera; cuando no haya reviews, MUST mostrar un estado vacío útil. La creación de reviews se delega al módulo de reviews (§6); esta feature solo renderiza.
- **FR-011**: El sistema MUST mostrar productos similares al listing actual (misma categoría y/o misma zona), cada uno enlazando a su propio detalle, excluyendo el listing actual y los no publicados, con un estado vacío u omisión cuando no haya similares.
- **FR-012**: El sistema MUST mostrar información informativa del seguro aplicable y la franquicia (si la categoría la tiene) cuando el arrendador está verificado, y un aviso informativo cuando no lo está indicando que el alquiler no incluye seguro de plataforma, sin contratar ni gestionar reclamaciones (módulo §7, Fase 2).
- **FR-013**: El sistema MUST mostrar las reglas del arrendador: política de cancelación (Flexible/Moderada/Estricta) y horarios de recogida/devolución, mostrando valores por defecto claros cuando el arrendador no las configuró explícitamente.
- **FR-014**: La interfaz MUST aplicar el tema `profesional-seguro`, labels explícitos, foco visible, navegación por teclado (carrusel, calendario, botones, galería fullscreen), alternativas no cromáticas y `alt` en imágenes, conforme a `constitution/DESIGN.md` y `constitution/FRONTEND.md`.
- **FR-015**: El sistema MUST servir la ficha priorizando Server Components para el renderizado inicial (datos del listing, descripción, perfil, reviews, similares, reglas, seguro) y reservando Client Components para la interactividad imprescindible (carrusel, zoom, fullscreen, calendario con selección, recálculo de precio), conforme a `constitution/FRONTEND.md`.
- **FR-016**: El sistema MUST exponer exclusivamente campos públicos del arrendador y del listing en la ficha; nunca MUST exponer datos privados (email, teléfono, dirección exacta, datos de pago) en la respuesta, en logs ni en el render, conforme a `constitution/SECURITY.md`.
- **FR-017**: El sistema MUST devolver una página 404 informativa cuando se acceda a la URL de un listing inexistente, eliminado, no publicado o cuyo arrendador esté suspendido/eliminado, sin filtrar el motivo interno (borrador vs. rechazado vs. eliminado).
- **FR-018**: El sistema MUST incrementar el contador de vistas (`viewCount`) del listing al renderizar su detalle público, para alimentar la ordenación "Más popular" de la búsqueda; el mecanismo de deduplicación se decide en el plan técnico.

### Key Entities *(include if feature involves data)*

- **Listing** (reutiliza la entidad de `004-public-search`): Fuente de la ficha. Solo se sirve en el detalle público si `status = published` AND `deletedAt IS NULL` AND `owner.accountStatus = active`. Se exponen los campos públicos (título, slug, descripción, precio, ubicación aproximada, ciudad, rating, reviews, fotos, categoría, `isInstantBooking`).
- **ListingPhoto** (reutiliza la entidad de `004-public-search`): Alimenta la galería de imágenes, ordenadas por `order`.
- **ListingAvailability** (reutiliza la entidad de `004-public-search`): Alimenta el calendario de disponibilidad (fechas bloqueadas).
- **User / VerificationState** (reutiliza la entidad de `002-registration`): Perfil público del arrendador (nombre, avatar, badge verificado, rating, tiempo de respuesta, número de transacciones). Solo campos públicos.
- **Category** (reutiliza la entidad del scaffold existente): Usada para productos similares (misma categoría) y para mostrar la categoría del listing.
- **Review** (entidad futura del módulo §6): Esta feature solo **lee** reviews para renderizar la sección; si el modelo no existe aún, se muestra estado vacío. No se crea ni se modifica reviews aquí.
- **ListingPriceTier** (entidad candidata a introducir en esta feature o en §2): Tramos de precios escalonados. Ver [NEEDS CLARIFICATION] en FR-006.
- **ListingRules** (campos candidatos: `cancellationPolicy`, `pickupReturnHours`): Reglas del arrendador. Ver [NEEDS CLARIFICATION] implícito en FR-013 sobre si se extiende el modelo ahora o se usan defaults.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los visitantes que abren la URL `/listings/[slug]` de un listing publicado ven la ficha completa sin ser redirigidos a login ni requerir identificación.
- **SC-002**: El 100% de las fichas de detalle muestra la galería, el título, la descripción, el perfil del arrendador, la sección de reviews (o estado vacío), los productos similares (o estado vacío), la información de seguro y las reglas, sin secciones en blanco ni errores técnicos.
- **SC-003**: El 100% de los visitantes puede navegar la galería (anterior/siguiente, fullscreen, zoom) usando teclado y ratón, con foco visible y `alt` en todas las imágenes.
- **SC-004**: El 100% de los visitantes puede seleccionar un rango de fechas en el calendario y ver el número de días y el precio total estimado sin recargar la página, y el rango se refleja en la URL para ser compartible y restaurable.
- **SC-005**: El 100% de las selecciones de rango que incluyen fechas bloqueadas es impedido o marcado como inválido, sin permitir un rango inválido silenciosamente.
- **SC-006**: El 100% de los listings no publicados, eliminados o con arrendador suspendido/eliminado devuelve una página 404 informativa al acceder a su URL de detalle.
- **SC-007**: El 100% de las fichas públicas excluye datos privados del arrendador (email, teléfono, dirección exacta, datos de pago) en la respuesta, en logs y en el render.
- **SC-008**: Al menos el 90% de las páginas de detalle carga su contenido principal (galería, título, descripción, perfil, precio) en menos de 2 segundos en condiciones de red normales.
- **SC-009**: En pruebas de teclado y lector de pantalla, el 100% de los controles del detalle (carrusel, zoom, fullscreen, calendario, botones Contactar/Reservar, productos similares) tiene nombre accesible, orden lógico, foco visible y mensajes de estado anunciados.
- **SC-010**: El 100% de los visitantes sin sesión que pulsan "Contactar" o "Reservar" recibe una propuesta no bloqueante de iniciar sesión con callback de retorno al detalle, sin perder el contexto del listing.
- **SC-011**: El 100% de las fichas muestra un estado vacío útil cuando no hay reviews, no hay productos similares o no hay fotos, sin errores ni secciones ocultas sin explicación.
- **SC-012**: El contador de vistas de los listings publicados se incrementa al renderizar su detalle, de forma que la ordenación "Más popular" de la búsqueda refleja las vistas reales.

## Assumptions

- La feature se implementa en la aplicación web existente bajo `/development`, reutilizando los modelos `Listing`, `ListingPhoto`, `ListingAvailability` introducidos en `004-public-search`, y `User`/`VerificationState` de `002-registration`.
- La URL de detalle es `/listings/[slug]`, consistente con el enlace que ya genera `result-card.tsx` (`/listings/${listing.slug}`) en `004-public-search`.
- La ficha es pública (no requiere sesión para ver); solo las acciones "Contactar" y "Reservar" requieren sesión, y se proponen de forma no bloqueante.
- El alcance de esta feature se alinea con el MVP definido en `docs/04-especificaciones-funcionales.md` §10: precio fijo por día (sin escalonado en MVP), reviews post-alquiler inmediatas (sin doble ciego), chat básico y reservas manuales sin pago automatizado. Los seguros integrados y los flujos completos de checkout/chat se dejan para Fase 2 o para sus módulos respectivos (§4, §5, §7).
- Los módulos de chat (§5), reservas/pagos (§4), reviews (§6) y seguros (§7) NO están construidos en el estado actual del proyecto. Esta feature renderiza las secciones que dependen de ellos con los datos disponibles y muestra estados vacíos/placeholder informativos cuando no hay datos; los botones "Contactar" y "Reservar" actúan como **entry points** con gating de login y delegan el flujo completo a las features futuras.
- El modelo `Review` no existe aún; esta feature solo lee reviews si existieran, y muestra un estado vacío en caso contrario. La introducción del modelo `Review` y su flujo de creación pertenecen al módulo de reviews (§6).
- Los tramos de precios escalonados (`ListingPriceTier`) y los campos de reglas del arrendador (`cancellationPolicy`, `pickupReturnHours`) no existen en el modelo actual; la decisión de introducirlos en esta feature o deferirlos a la feature de listings (§2) se resuelve en el [NEEDS CLARIFICATION] de FR-006 y FR-013.
- El tiempo de respuesta y el número de transacciones del arrendador pueden no estar disponibles como campos desnormalizados en el modelo `User` actual; esta feature los muestra si existen y los omite con un estado neutro si no.
- La dirección exacta del listing nunca se muestra; se muestra la ciudad y, como mucho, una dirección aproximada (`addressText`) configurada por el arrendador para preservar su privacidad, conforme a `constitution/SECURITY.md`.
- El calendario de disponibilidad es informativo en esta feature: valida contra `ListingAvailability` pero la confirmación real de la reserva se hace en el módulo de reservas (§4).
- El incremento del contador de vistas (`viewCount`) se realiza al renderizar el detalle de un listing publicado; el mecanismo de deduplicación (por sesión, por IP, por render) se decide en el plan técnico para evitar inflación artificial.
- Las reglas visuales definitivas proceden de `constitution/DESIGN.md`; no se añade modo oscuro ni una segunda dirección estética en esta feature.
- La accesibilidad sigue `constitution/DESIGN.md` y `constitution/FRONTEND.md`: todo control interactivo (carrusel, zoom, fullscreen, calendario, botones) debe ser usable con teclado y lector de pantalla.
- La página de detalle vive bajo el layout público `(public)` definido en `004-public-search`, reutilizando el header mínimo sin nav de usuario logado bloqueante.
