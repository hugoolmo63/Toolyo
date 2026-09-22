# Feature Specification: Vista Pública del Perfil de Usuario

**Feature Branch**: `006-public-user-profile`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Crear la vista pública del perfil de usuario (PROF-002) en app/users/[id]/page.tsx para Next.js 14. Cabecera con foto, nombre, fecha de registro, rating, transacciones totales, insignias Registrado, Verificado y Superarrendador, botón Contactar, mapa aproximado con círculo de 750 m de radio, rejilla de listings activos usando ListingCard, reseñas y privacidad 100% pública."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conocer la reputación de un usuario (Priority: P1)

Como visitante, quiero consultar el perfil público de un usuario para evaluar su antigüedad, reputación, experiencia y nivel de confianza antes de contactar o alquilar uno de sus productos.

**Why this priority**: La información de confianza es el objetivo principal de PROF-002 y permite tomar decisiones informadas dentro del marketplace.

**Independent Test**: Abrir `/users/[id]` para un usuario activo con datos públicos y comprobar que la cabecera muestra identidad, fecha de registro, rating, transacciones, insignias y el botón Contactar.

**Acceptance Scenarios**:

1. **Given** un usuario activo y no eliminado, **When** un visitante abre `/users/[id]`, **Then** ve foto/avatar, nombre visible, fecha de registro, rating, transacciones totales e insignias públicas aplicables.
2. **Given** un usuario con distintos estados de confianza, **When** se muestra su perfil, **Then** las insignias Registrado, Verificado y Superarrendador aparecen únicamente cuando sus condiciones están satisfechas por datos del servidor.
3. **Given** un visitante sin sesión, **When** pulsa Contactar, **Then** se le dirige al flujo de contacto o inicio de sesión sin mostrar el email, teléfono u otros datos privados del usuario.

---

### User Story 2 - Consultar la zona habitual sin conocer la dirección exacta (Priority: P1)

Como visitante, quiero ver la zona aproximada donde opera habitualmente el usuario para entender su ámbito geográfico sin que se revele su dirección exacta.

**Why this priority**: La ubicación ayuda a valorar la conveniencia del alquiler, pero debe equilibrarse con la privacidad y la seguridad personal.

**Independent Test**: Abrir un perfil con ubicación habitual y comprobar que el mapa está centrado en la zona, muestra un círculo de aproximadamente 750 metros de radio y no presenta una dirección exacta.

**Acceptance Scenarios**:

1. **Given** un perfil con coordenadas habituales válidas, **When** se carga la sección de ubicación, **Then** se muestra un mapa centrado en esa zona con un círculo transparente de aproximadamente 750 metros de radio.
2. **Given** un perfil sin ubicación o con coordenadas inválidas, **When** se carga la vista pública, **Then** la página omite el mapa o muestra un estado vacío comprensible sin fallar.
3. **Given** cualquier perfil público, **When** se inspecciona la información visible, **Then** no se muestra una dirección exacta ni una coordenada con precisión suficiente para identificar un domicilio.

---

### User Story 3 - Explorar anuncios y reseñas (Priority: P1)

Como visitante, quiero revisar los listings activos y las reseñas recibidas para valorar la experiencia real del usuario y acceder a sus productos.

**Why this priority**: Los anuncios y las reseñas aportan evidencia concreta que complementa los datos agregados de la cabecera.

**Independent Test**: Abrir un perfil con listings y reseñas, comprobar que los anuncios aparecen en una rejilla navegable y que cada reseña muestra autor/identidad pública, valoración y comentario.

**Acceptance Scenarios**:

1. **Given** un usuario con listings publicados y activos, **When** se abre su perfil, **Then** los listings aparecen en una rejilla de tarjetas reutilizable y cada tarjeta enlaza al detalle correspondiente.
2. **Given** un usuario con listings en borrador, pausados, eliminados o no publicados, **When** se abre su perfil, **Then** esos listings no aparecen.
3. **Given** un usuario con reseñas recibidas, **When** se abre su perfil, **Then** se muestran sus valoraciones y comentarios en orden descendente de fecha, sin datos privados del autor ni del usuario reseñado.
4. **Given** un usuario sin listings o sin reseñas, **When** se abre su perfil, **Then** se muestran estados vacíos útiles y la página continúa siendo navegable.

### Edge Cases

- El identificador no corresponde a un usuario, o el usuario está suspendido, eliminado o no activo: responder con una página 404/no disponible sin filtrar información interna.
- El usuario no tiene nombre, foto, rating, transacciones, insignias, listings, ubicación o reseñas: usar fallbacks y estados vacíos, sin ocultar toda la página.
- Una reseña contiene texto vacío, contenido moderado o un autor ya eliminado: conservar la valoración válida y mostrar el estado de contenido no disponible.
- El mapa no puede cargar tiles o no es compatible con el navegador: mostrar el texto de zona aproximada o un fallback accesible, sin bloquear listings ni reseñas.
- Un visitante pulsa Contactar sin sesión: pedir autenticación o conservar el destino de contacto sin revelar información privada.
- Una URL de avatar o imagen de listing no carga: mostrar placeholder accesible con texto alternativo adecuado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (PROF-002)**: El sistema MUST exponer una vista pública en `/users/[id]` para usuarios activos y no eliminados.
- **FR-002**: La cabecera MUST mostrar foto/avatar, nombre visible, fecha de registro, rating promedio y número total de transacciones.
- **FR-003 (PROF-006)**: La vista MUST mostrar la insignia **Registrado** cuando la cuenta cumpla los criterios públicos de registro definidos por el negocio.
- **FR-004**: La vista MUST mostrar la insignia **Verificado** únicamente cuando exista una verificación vigente confirmada por el servidor.
- **FR-005 (PROF-007)**: La vista MUST mostrar la insignia **Superarrendador** únicamente cuando el usuario cumpla los criterios públicos de nivel definidos por el negocio; el cliente no puede concederla.
- **FR-006**: La vista MUST incluir un botón **Contactar** visible y accesible; su acción MUST iniciar el flujo de contacto o autenticación sin exponer datos privados.
- **FR-007**: La sección de ubicación MUST mostrar un mapa centrado en las coordenadas habituales del usuario cuando existan, usando un círculo transparente de aproximadamente 750 metros de radio para representar una zona y no una dirección exacta.
- **FR-008**: La vista MUST ocultar la ubicación exacta, email, teléfono, credenciales, sesiones, información KYC, eventos de seguridad y cualquier otro dato privado.
- **FR-009**: La sección de anuncios MUST mostrar una rejilla de cards de los listings activos y publicados del usuario, reutilizando el patrón visual de `ListingCard` existente.
- **FR-010**: Cada card de listing MUST permitir navegar al detalle público del producto y mostrar únicamente información pública del anuncio.
- **FR-011**: La sección de reseñas MUST mostrar comentarios y valoraciones recibidas, junto con su fecha pública y datos mínimos de identidad permitidos.
- **FR-012**: Las reseñas MUST ordenarse de la más reciente a la más antigua y excluir reseñas eliminadas, ocultas o pendientes de moderación pública.
- **FR-013**: La vista MUST proporcionar estados vacíos, placeholders y fallbacks accesibles para ausencia o fallo de avatar, mapa, listings y reseñas.
- **FR-014**: Los datos y badges públicos MUST derivarse del servidor y la respuesta MUST excluir campos no incluidos explícitamente en la proyección pública.
- **FR-015**: La página MUST ser navegable sin autenticación y no MUST contener controles de edición del perfil ni acciones privadas.

### Key Entities

- **Public User Profile**: Proyección pública de un usuario activo con foto, nombre, fecha de registro, reputación agregada, badges y zona habitual aproximada.
- **Listing Card**: Representación resumida de un listing publicado y activo, enlazada a su detalle público.
- **Review**: Valoración y comentario recibido por el usuario, con autor y fecha en formato público y sujeto a moderación/visibilidad.
- **Trust Badge**: Insignia pública derivada de reglas de cuenta, verificación y rendimiento; no es editable por el cliente.
- **Approximate Location Zone**: Área circular de aproximadamente 750 metros de radio centrada en la zona habitual, sin mostrar el domicilio exacto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de las cargas de perfiles públicos válidos muestran cabecera, listings y estado de reseñas en un máximo de 2 segundos bajo condiciones normales.
- **SC-002**: El 100% de los perfiles públicos oculta email, teléfono, dirección exacta, credenciales, sesiones, KYC y eventos de seguridad.
- **SC-003**: El 100% de los listings visibles en un perfil público son activos y publicados pertenecientes al usuario consultado.
- **SC-004**: El 100% de las ubicaciones públicas se representa como zona aproximada con un radio objetivo de 750 metros y nunca como dirección exacta.
- **SC-005**: Al menos el 95% de los visitantes de prueba puede localizar nombre, reputación, listings y reseñas en el primer intento sin autenticarse.
- **SC-006**: El 100% de los perfiles sin listings, reseñas o ubicación muestra un estado vacío comprensible y no produce un error visible.

## Assumptions

- La ruta pública utiliza el identificador actual del usuario y no introduce un nombre de usuario adicional.
- La fecha de registro es una fecha pública de baja sensibilidad y se muestra con formato localizado, sin exponer timestamps internos innecesarios.
- Los criterios exactos de Superarrendador se configurarán como reglas de negocio del dominio y se evaluarán en servidor; mientras no estén disponibles, la insignia permanecerá oculta.
- La insignia Registrado representa una cuenta activa que completó los requisitos públicos mínimos de alta; no concede permisos adicionales.
- Las reseñas pueden depender de un módulo de reviews existente o futuro; cuando no existan datos, se mostrará un estado vacío en lugar de datos inventados.
- “Contactar” es un punto de entrada al flujo de mensajería y puede solicitar autenticación antes de continuar.
- La zona aproximada se obtiene de la ubicación habitual almacenada y se redondea/representa con suficiente imprecisión para proteger la privacidad.
- La vista pública reutiliza la navegación y el tema visual público existentes, incluyendo soporte responsive y accesibilidad de teclado.