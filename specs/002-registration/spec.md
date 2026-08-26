# Feature Specification: Registro y Verificación de Usuario

**Feature Branch**: `01-registration`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "01-registration. Definir la especificación completa del flujo de Registro de Usuario (Sección 1.1 de 04-especificaciones-funcionales.md), incluyendo AUTH-001 a AUTH-005, aplicando el estilo profesional-seguro, respetando la estructura /development y las normas de constitution/."

### Trazabilidad con la especificación funcional

| Requisito fuente | Cobertura en esta feature |
|---|---|
| AUTH-001 | User Story 1; FR-001 a FR-004 |
| AUTH-002 | User Story 2; FR-007 y FR-009 |
| AUTH-003 | User Story 2; FR-008 y FR-009 |
| AUTH-004 | User Story 3; FR-010 a FR-013 |
| AUTH-005 | User Story 4; FR-014 a FR-016 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear una cuenta (Priority: P1)

Como visitante quiero registrarme con email y contraseña o con un proveedor SSO para crear una cuenta de Toolyo y poder explorar y utilizar las funciones disponibles para usuarios registrados.

**Why this priority**: El registro es la puerta de entrada a publicar listings, solicitar alquileres, comunicarse y gestionar la identidad del usuario.

**Independent Test**: Una persona puede completar un registro válido con email y contraseña, o iniciar el registro mediante un proveedor SSO disponible, y termina en un estado de cuenta pendiente de verificaciones cuando corresponda.

**Acceptance Scenarios**:

1. **Given** un visitante con un email no registrado, **When** introduce un email válido, una contraseña de al menos 12 caracteres y acepta los documentos legales, **Then** se crea una cuenta pendiente de verificación y se muestra el siguiente paso sin revelar información sensible.
2. **Given** un visitante que elige Google, Apple o Facebook, **When** el proveedor devuelve una identidad válida y el visitante acepta los documentos legales, **Then** se crea o vincula una cuenta sin pedir una contraseña local.
3. **Given** un email ya asociado a una cuenta, **When** el visitante intenta registrarse, **Then** se muestra un mensaje genérico que no confirma innecesariamente si el email existe y se ofrece continuar con inicio de sesión o recuperación.
4. **Given** datos inválidos o una contraseña demasiado corta, **When** el visitante intenta enviar el formulario, **Then** se muestran errores junto a los campos, se conserva el contenido no sensible y no se crea la cuenta.

### User Story 2 - Verificar email y teléfono (Priority: P1)

Como usuario registrado quiero verificar mi email y mi número de teléfono mediante códigos OTP para demostrar que controlo ambos canales y desbloquear las funciones que requieren una cuenta verificada.

**Why this priority**: Email y teléfono son controles básicos de recuperación, comunicación y confianza antes de publicar o solicitar una reserva.

**Independent Test**: Con una cuenta creada, el usuario puede solicitar cada código, introducirlo correctamente y observar el estado verificado; los códigos inválidos, caducados o reintentados en exceso se rechazan de forma segura.

**Acceptance Scenarios**:

1. **Given** una cuenta pendiente de verificación de email, **When** el usuario solicita un código, **Then** recibe un OTP de un solo uso con una caducidad visible y puede introducirlo sin que el código aparezca en la URL o en la interfaz.
2. **Given** un OTP de email válido y no usado, **When** el usuario lo introduce dentro de su periodo de validez, **Then** el email pasa a `verified` y el usuario recibe confirmación accesible.
3. **Given** un OTP incorrecto, caducado o ya utilizado, **When** el usuario lo introduce, **Then** el sistema lo rechaza, no cambia el estado y comunica cuántos intentos quedan sin revelar secretos.
4. **Given** demasiadas solicitudes o intentos desde una cuenta, usuario o dirección IP, **When** se solicita otro código, **Then** se aplica un límite temporal, se muestra cuándo reintentar y se registra el evento de seguridad.
5. **Given** un usuario con email verificado pero teléfono pendiente, **When** solicita verificación SMS y confirma el OTP válido, **Then** el teléfono pasa a `verified` y el perfil muestra el progreso correcto.
6. **Given** un número inválido, no admitido o ya vinculado de forma incompatible, **When** el usuario solicita SMS, **Then** el sistema no envía un mensaje y muestra una corrección accionable sin exponer datos de otra cuenta.

### User Story 3 - Solicitar verificación de identidad (Priority: P2)

Como usuario que quiere aumentar la confianza de su perfil quiero solicitar verificación KYC con DNI/NIE y selfie en vivo para obtener el badge público y poder acceder, cuando cumpla las condiciones, al seguro de plataforma y a las reservas instantáneas.

**Why this priority**: La verificación de identidad es importante para confianza y funciones avanzadas, pero el MVP permite el uso básico sin KYC y requiere controlar especialmente los datos sensibles.

**Independent Test**: Un usuario con email y teléfono verificados puede iniciar, completar, cancelar o reintentar una solicitud KYC y ve un estado claro sin que la plataforma exponga documentos ni conceda privilegios antes de la aprobación.

**Acceptance Scenarios**:

1. **Given** un usuario con verificaciones básicas completas, **When** inicia KYC, **Then** recibe una explicación de finalidad, datos solicitados, proveedor o responsable aplicable, retención y resultado posible antes de continuar.
2. **Given** una comprobación KYC aprobada, **When** el resultado se confirma, **Then** el estado pasa a `identity_verified`, aparece el badge Verificado y se habilitan únicamente las capacidades permitidas por las reglas de negocio.
3. **Given** una comprobación KYC pendiente, **When** el usuario vuelve a su perfil, **Then** observa `identity_pending`, no recibe badge de aprobado y no puede activar reservas instantáneas ni seguro de plataforma.
4. **Given** una comprobación KYC rechazada o inconclusa, **When** el resultado se comunica, **Then** se muestra un motivo general accionable, se permite corregir o reintentar si procede y no se revelan detalles antifraude innecesarios.
5. **Given** un usuario que cancela o no completa KYC, **When** vuelve a la plataforma, **Then** conserva su cuenta básica y puede seguir usando las funciones no condicionadas a identidad verificada.

### User Story 4 - Aceptar documentos legales (Priority: P1)

Como usuario quiero revisar y aceptar los Términos y Condiciones y la Política de Privacidad durante el registro para saber cómo funciona el servicio y cómo se tratarán mis datos.

**Why this priority**: El consentimiento y la información legal son requisitos de entrada y condicionan la creación legítima de la cuenta.

**Independent Test**: El formulario impide completar el registro sin aceptación explícita y conserva evidencia de la versión aceptada, fecha y finalidad sin mezclarla con comunicaciones comerciales.

**Acceptance Scenarios**:

1. **Given** los documentos legales disponibles, **When** el usuario abre sus enlaces desde el formulario, **Then** puede leerlos sin perder los datos introducidos ni el contexto del registro.
2. **Given** que uno de los consentimientos obligatorios no está marcado, **When** el usuario intenta registrarse, **Then** el envío se bloquea y se identifica exactamente qué aceptación falta.
3. **Given** que el usuario acepta ambos documentos, **When** el registro termina, **Then** queda registrada la versión, fecha y finalidad de cada aceptación obligatoria.
4. **Given** una casilla opcional de comunicaciones comerciales, **When** el usuario no la marca, **Then** la cuenta se crea sin suscripción comercial ni inferencia de consentimiento.

### Edge Cases

- El código OTP no debe aparecer en logs, URLs, analítica, mensajes de error ni respuestas visibles al cliente.
- El usuario puede pedir reenvío, pero el sistema debe aplicar límites por IP, cuenta, email y teléfono para evitar abuso y costes de SMS.
- Dos solicitudes de registro simultáneas con el mismo email deben producir una sola cuenta válida y un resultado coherente.
- Un email o teléfono con mayúsculas, espacios o formato internacional equivalente debe normalizarse sin cambiar la identidad de otra persona.
- El usuario debe poder volver atrás en onboarding sin perder los datos no sensibles ni repetir indefinidamente un paso ya verificado.
- La pérdida de conexión durante OTP o KYC debe permitir reintentar sin crear estados parcialmente privilegiados.
- El cambio de email o teléfono después del registro debe iniciar una nueva verificación y no reutilizar automáticamente la anterior.
- Un proveedor SSO que cancela, devuelve error o usa un email no verificado no debe crear una cuenta privilegiada.
- Los documentos KYC no deben almacenarse en la base de datos propia ni quedar accesibles para perfiles no autorizados salvo necesidad legal documentada.
- El diseño debe funcionar con teclado y lector de pantalla, mantener foco visible y no usar color como única señal de error o verificación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer registro con email y contraseña y permitir iniciar el registro mediante Google, Apple y Facebook cuando cada proveedor esté habilitado.
- **FR-002**: El sistema MUST validar formato de email, normalizarlo de forma consistente y rechazar contraseñas de menos de 12 caracteres antes de crear la cuenta.
- **FR-003**: El sistema MUST almacenar las contraseñas mediante un algoritmo de hash resistente y nunca conservarlas en texto plano, logs, analítica o respuestas.
- **FR-004**: El sistema MUST evitar la enumeración de cuentas mostrando respuestas equivalentes cuando un email ya existe durante registro, recuperación o solicitudes relacionadas.
- **FR-005**: El sistema MUST proteger los flujos de registro, login y OTP con límites por IP y por cuenta o identificador de contacto, registrando los bloqueos relevantes como eventos de seguridad.
- **FR-006**: El sistema MUST crear la cuenta con un estado explícito de verificaciones y no conceder capacidades condicionadas a email, teléfono o identidad hasta que cada estado requerido sea `verified`.
- **FR-007**: El sistema MUST enviar un código OTP de email de un solo uso, con caducidad limitada, invalidación tras uso y límite de intentos fallidos.
- **FR-008**: El sistema MUST enviar un código OTP de SMS de un solo uso, con caducidad limitada, invalidación tras uso y límite de intentos y reenvíos.
- **FR-009**: El sistema MUST mostrar al usuario el estado de email y teléfono como `pending`, `verified` o `blocked/retry_required`, con instrucciones de recuperación comprensibles.
- **FR-010**: El sistema MUST ofrecer KYC como flujo opcional para usuarios básicos y exigir email y teléfono verificados antes de iniciarlo.
- **FR-011**: El sistema MUST solicitar consentimiento informado antes de recoger DNI/NIE o selfie, explicando finalidad, responsable/proveedor, retención, derechos y resultado del proceso en lenguaje comprensible.
- **FR-012**: El sistema MUST representar KYC con estados `not_started`, `pending`, `verified`, `rejected` y `retry_required`, y MUST bloquear badge, seguro de plataforma y reservas instantáneas salvo estado `verified` y reglas de negocio cumplidas.
- **FR-013**: El sistema MUST minimizar la información KYC propia al resultado, referencia del proceso, estado, fechas y códigos generales de resultado, salvo que exista una obligación legal documentada para conservar documentos.
- **FR-014**: El sistema MUST permitir completar el registro únicamente después de aceptar explícitamente Términos y Condiciones y Política de Privacidad vigentes.
- **FR-015**: El sistema MUST registrar para cada aceptación obligatoria la versión del documento, fecha/hora, finalidad y cuenta asociada, sin tratar una aceptación comercial opcional como requisito.
- **FR-016**: El sistema MUST permitir consultar los documentos legales desde el formulario sin perder el progreso y MUST proporcionar una forma de solicitar acceso, rectificación, exportación o eliminación de datos conforme a la política aplicable.
- **FR-017**: La interfaz MUST aplicar el tema `profesional-seguro`: tokens de diseño oficiales, tipografía y radios definidos en `constitution/DESIGN.md`, jerarquía clara, feedback de estados y sin colores hardcodeados fuera de los tokens.
- **FR-018**: La interfaz MUST proporcionar labels explícitos, mensajes de error junto al campo, foco visible, navegación por teclado, soporte de lector de pantalla y alternativa textual o estructural para cada estado de color.
- **FR-019**: El sistema MUST registrar eventos de seguridad de registro, cambios de credenciales, verificaciones, rechazos y límites superados con datos mínimos y sin OTP, contraseñas, documentos o secretos.
- **FR-020**: El flujo MUST vivir dentro de la aplicación web de `/development`, respetando la separación entre Server Components y Client Components, validación compartida y rutas/servicios definidos por la arquitectura existente.

### Key Entities *(include if feature involves data)*

- **User**: Cuenta de usuario con email normalizado, teléfono normalizado, credenciales o identidad SSO, estado de cuenta, nivel de confianza y marcas de auditoría.
- **VerificationState**: Estado independiente para email, teléfono e identidad; incluye estado, fecha de solicitud, fecha de verificación y código general de resultado, nunca el OTP en claro.
- **OtpChallenge**: Desafío temporal asociado a un canal de contacto, con hash del código, expiración, intentos, reenvíos, estado consumido/bloqueado y contexto de seguridad.
- **IdentityVerification**: Solicitud KYC con estado, referencia externa, fechas y motivo general de resultado; no incluye por defecto DNI, selfie ni imágenes documentales.
- **LegalDocument**: Documento versionado de Términos o Privacidad, con identificador, versión, idioma, vigencia y contenido publicado.
- **LegalAcceptance**: Evidencia de aceptación de un documento por una cuenta, con versión, fecha/hora, finalidad y referencia de sesión o contexto mínimo necesario.
- **SecurityEvent**: Evento auditable de autenticación, OTP, cambio de credenciales, verificación, bloqueo o acceso sensible, con timestamp, resultado y correlación sin secretos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de las personas que comienzan un registro válido pueden llegar a una cuenta creada en menos de 3 minutos sin asistencia.
- **SC-002**: El 95% de los OTP válidos se procesa correctamente dentro de su periodo de vigencia y los OTP inválidos, caducados o reutilizados nunca cambian el estado de verificación.
- **SC-003**: El 100% de las cuentas nuevas conserva evidencia de aceptación de las dos obligaciones legales con versión y fecha, y ninguna cuenta se crea sin ambas aceptaciones.
- **SC-004**: El 100% de los eventos de rate limit y cambios de estado de verificación queda auditable sin incluir contraseñas, OTP ni documentos de identidad.
- **SC-005**: Ninguna cuenta en estado KYC `pending`, `rejected` o `retry_required` recibe badge de identidad verificada ni capacidades condicionadas a identidad aprobada.
- **SC-006**: En pruebas de teclado y lector de pantalla, el 100% de los controles del flujo tiene nombre accesible, orden lógico y foco visible.
- **SC-007**: El flujo mantiene una tasa de error de validación recuperable superior al 95%: una persona puede corregir un campo sin perder el resto de datos no sensibles.
- **SC-008**: El registro y la verificación funcionan en los navegadores soportados en móvil y desktop sin que los mensajes, botones o estados se solapen en las anchuras definidas por el equipo.

## Assumptions

- La feature se implementa en la aplicación web existente bajo `/development`; la app móvil queda fuera de esta entrega, aunque consumirá los mismos estados y contratos en el futuro.
- El MVP requiere email y contraseña como camino principal y deja SSO habilitado solo para proveedores configurados y revisados; no se implementa un proveedor ficticio.
- Los códigos OTP tienen caducidad y límites concretos que se fijarán en el plan técnico con criterios de seguridad y costes del proveedor, no en la UI ni mediante valores mágicos dispersos.
- KYC es opcional para explorar, publicar y solicitar reservas básicas; las reservas instantáneas y el seguro de plataforma siguen sujetos a verificación de identidad aprobada y a reglas legales/operativas posteriores.
- Un proveedor especializado puede custodiar documentos KYC; Toolyo conservará el mínimo resultado necesario y una referencia auditable salvo obligación legal contraria.
- La identidad legal del responsable del tratamiento, los encargados, las bases legales y los plazos exactos de conservación se confirmarán antes de producción en la documentación RGPD correspondiente.
- Email, SMS, SSO y KYC son integraciones externas que deberán tener adaptadores, secretos fuera del repositorio, timeouts, reintentos seguros e idempotencia donde aplique.
- Las reglas visuales definitivas proceden de `constitution/DESIGN.md`; no se añade modo oscuro ni una segunda dirección estética en esta feature.
- Los cambios de credenciales, borrado de cuenta y recuperación completa pueden requerir historias posteriores, pero esta feature debe dejar sus estados y puntos de entrada seguros y no bloquearlos accidentalmente.
