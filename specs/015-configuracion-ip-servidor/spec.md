# Feature Specification: Configuración de IP del servidor en aplicaciones móviles

**Feature Branch**: `015-configuracion-ip-servidor`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Como usuario me gustaría poder configurar la IP del servidor en el caso de las distribuciones para Android y iPhone exclusivamente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurar el servidor en una aplicación móvil (Priority: P1)

Como usuario de la aplicación distribuida para Android o iPhone, quiero indicar la dirección del servidor al que debe conectarse la aplicación, de forma que pueda utilizarla con el servidor correspondiente a mi entorno.

**Why this priority**: Sin una dirección configurable, las distribuciones móviles no pueden conectarse de forma flexible a servidores locales, de pruebas o de producción.

**Independent Test**: Instalar la aplicación en un dispositivo Android y en un iPhone, introducir una dirección de servidor válida, guardar la configuración y comprobar que la aplicación intenta conectarse a esa dirección.

**Acceptance Scenarios**:

1. **Given** una aplicación móvil sin una dirección de servidor configurada, **When** el usuario abre la configuración de conexión, **Then** puede visualizar el valor actual y editarlo.
2. **Given** que el usuario introduce una dirección válida y la guarda, **When** la aplicación realiza la siguiente conexión, **Then** utiliza la dirección guardada y confirma que la configuración se aplicó correctamente.
3. **Given** que el usuario cierra y vuelve a abrir la aplicación, **When** consulta la configuración, **Then** la dirección guardada permanece disponible.

---

### User Story 2 - Corregir una configuración inválida (Priority: P2)

Como usuario móvil, quiero recibir una indicación clara cuando la dirección introducida no sea válida o no esté disponible, para poder corregirla sin perder el acceso a la aplicación.

**Why this priority**: Una configuración incorrecta es esperable en entornos móviles y debe poder resolverse sin asistencia técnica.

**Independent Test**: Introducir valores vacíos, con formato incorrecto y direcciones no accesibles; verificar que la aplicación informa del problema, conserva la configuración funcional anterior y permite reintentar.

**Acceptance Scenarios**:

1. **Given** una dirección vacía o con formato no permitido, **When** el usuario intenta guardarla, **Then** la aplicación muestra un mensaje de validación y no reemplaza la configuración válida anterior.
2. **Given** una dirección con formato válido pero cuyo servidor no responde, **When** el usuario intenta conectarse, **Then** la aplicación informa que no puede alcanzar el servidor y permite modificar la dirección.
3. **Given** que el usuario quiere recuperar la configuración inicial, **When** selecciona restablecer configuración, **Then** la aplicación elimina el valor personalizado y vuelve al valor predeterminado definido para la distribución móvil.

---

### User Story 3 - Mantener sin cambios otras distribuciones (Priority: P3)

Como responsable del producto, quiero que esta configuración esté disponible exclusivamente en las distribuciones para Android y iPhone, de forma que los usuarios de otras plataformas mantengan su comportamiento actual.

**Why this priority**: El alcance solicitado se limita a las aplicaciones móviles y no debe introducir cambios inesperados en otros clientes.

**Independent Test**: Revisar una distribución móvil y una distribución no móvil; comprobar que solo las aplicaciones Android e iPhone ofrecen la opción de cambiar la dirección del servidor.

**Acceptance Scenarios**:

1. **Given** una aplicación Android o iPhone, **When** el usuario accede a sus opciones de conexión, **Then** encuentra la opción para consultar, editar y restablecer la dirección del servidor.
2. **Given** una distribución que no es Android ni iPhone, **When** el usuario accede a sus opciones de conexión, **Then** no se muestra la opción de configurar manualmente la dirección del servidor y su comportamiento actual no cambia.

---

### Edge Cases

- La dirección contiene espacios, un esquema no permitido, un puerto fuera de rango o caracteres inválidos.
- El usuario intenta guardar una dirección vacía después de haber configurado una dirección funcional.
- El servidor configurado deja de estar disponible después de haber sido validado.
- La aplicación se actualiza o se reinicia mientras existe una dirección personalizada.
- El usuario restablece la configuración y no existe conectividad con el servidor predeterminado.
- La dirección apunta a un destino que no cumple las condiciones de conexión segura requeridas por la aplicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Las distribuciones para Android y iPhone MUST permitir al usuario consultar la dirección actual del servidor.
- **FR-002**: Las distribuciones para Android y iPhone MUST permitir al usuario introducir, editar y guardar una dirección de servidor personalizada.
- **FR-003**: El sistema MUST validar que la dirección introducida tenga un formato permitido antes de guardarla.
- **FR-004**: El sistema MUST conservar la dirección configurada de forma que siga disponible después de cerrar y volver a abrir la aplicación.
- **FR-005**: La aplicación MUST utilizar la dirección guardada para sus conexiones posteriores en las distribuciones móviles compatibles.
- **FR-006**: El sistema MUST mostrar un mensaje comprensible cuando la dirección no sea válida o el servidor no esté disponible, sin ocultar la causa general del fallo.
- **FR-007**: El sistema MUST conservar la última dirección funcional cuando una nueva dirección no supere la validación o no pueda utilizarse.
- **FR-008**: Las distribuciones para Android y iPhone MUST permitir restablecer la dirección personalizada al valor predeterminado de la distribución.
- **FR-009**: Las distribuciones que no sean Android ni iPhone MUST conservar el comportamiento actual y no MUST exponer la configuración manual de la dirección del servidor.
- **FR-010**: La aplicación MUST aplicar las mismas reglas de conexión segura y protección de datos existentes a las direcciones personalizadas.

### Key Entities *(include if feature involves data)*

- **Configuración de conexión móvil**: Preferencia del usuario que representa la dirección actual del servidor, su origen (predeterminada o personalizada) y el estado de validación más reciente.
- **Dirección de servidor**: Valor que identifica el destino de conexión, incluyendo la información de red permitida por las reglas del producto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de los usuarios de Android e iPhone que tienen una dirección válida pueden configurarla y guardar el cambio en menos de 60 segundos.
- **SC-002**: El 100% de las aplicaciones Android e iPhone utiliza la dirección guardada después de reiniciarse, salvo que el usuario la restablezca o la sustituya.
- **SC-003**: El 100% de los valores vacíos o con formato no permitido se rechaza antes de reemplazar una configuración válida.
- **SC-004**: Al menos el 90% de los usuarios que introducen una dirección inválida puede identificar el problema y corregirlo sin reinstalar la aplicación ni solicitar asistencia.
- **SC-005**: El 100% de las distribuciones que no sean Android ni iPhone mantiene su comportamiento actual y no muestra controles para configurar manualmente la dirección del servidor.

## Assumptions

- La aplicación ya dispone de un valor predeterminado de servidor para cada distribución móvil.
- La interfaz móvil se incluye dentro del paquete nativo y puede abrir la pantalla de configuración sin depender de la disponibilidad del servidor remoto; la dirección configurable se utiliza para peticiones de API y datos.
- El usuario que configura la dirección tiene autorización para utilizar el servidor indicado; la funcionalidad no administra servidores ni modifica su configuración.
- La configuración aplica al dispositivo y a la instalación actual, no se sincroniza automáticamente entre dispositivos.
- La dirección puede incluir el puerto cuando el entorno lo requiera, siempre que cumpla las reglas de validación y conexión segura del producto.
- La funcionalidad se limita a Android y iPhone; no se amplía a clientes web, escritorio u otras plataformas en esta versión.
