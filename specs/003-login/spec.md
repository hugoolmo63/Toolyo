# Feature Specification: Inicio de Sesión y Gestión de Sesión

**Feature Branch**: `03-login`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Crear la feature de login (inicio de sesión) con generación de token de sesión, reutilizando la infraestructura de cuenta y verificación establecida en 002-registration. Debe cubrir el login por email/contraseña, la creación y validación de la sesión, la protección de rutas autenticadas, el logout y la integración con el estado de onboarding existente. La pantalla de login comparte la misma página unificada que el registro, con tabs para alternar entre 'Iniciar sesión' y 'Crear cuenta'."

### Trazabilidad con la especificación funcional

| Requisito fuente | Cobertura en esta feature |
|---|---|
| AUTH-001 (parcial — login de cuentas ya creadas) | User Story 1; FR-001 a FR-005 |
| Fase 1 MVP — "Auth: Registro/login básico" (`docs/04-especificaciones-funcionales.md` §6) | User Story 1 y 2 |
| FR-005 de 002-registration — "proteger los flujos de registro, login y OTP con límites" | User Story 1; FR-004 |
| `constitution/SECURITY.md` — autenticación, sesiones seguras, revocación | User Story 2; FR-005 a FR-008 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar sesión con email y contraseña (Priority: P1)

Como usuario registrado quiero iniciar sesión con mi email y contraseña para acceder a mi cuenta, ver mi estado de onboarding y utilizar las funciones disponibles según mis verificaciones.

**Why this priority**: El login es la puerta de entrada recurrente a la plataforma. Sin él, las cuentas creadas en `002-registration` no pueden acceder a un área autenticada ni completar el onboarding pendiente (verificar teléfono, KYC).

**Independent Test**: Un usuario con cuenta activa puede introducir su email y contraseña, recibe una sesión válida y es redirigido a su destino según su estado de onboarding; las credenciales incorrectas no revelan qué campo falló ni crean sesión.

**Acceptance Scenarios**:

1. **Given** un usuario con cuenta creada y email verificado, **When** introduce su email y contraseña correctos, **Then** se crea una sesión, se establece una cookie HttpOnly/Secure/SameSite y es redirigido a su área autenticada o al siguiente paso de onboarding pendiente.
2. **Given** un usuario con cuenta creada pero email no verificado, **When** introduce credenciales correctas, **Then** se crea una sesión limitada y es redirigido a `/verify` para completar la verificación pendiente sin acceder a funciones privilegiadas.
3. **Given** un email o contraseña incorrectos, **When** el usuario intenta iniciar sesión, **Then** recibe un mensaje genérico "Credenciales no válidas" sin indicar si el email existe o si fue la contraseña la que falló, y no se crea sesión.
4. **Given** una cuenta con estado `suspended`, **When** el usuario intenta iniciar sesión, **Then** se rechaza el intento con un mensaje que indica que la cuenta está suspendida y cómo contactar soporte, sin crear sesión.
5. **Given** una cuenta con estado `deleted` o `deletion_requested`, **When** el usuario intenta iniciar sesión, **Then** se rechaza el intento con un mensaje genérico sin revelar que la cuenta fue eliminada.
6. **Given** múltiples intentos fallidos desde la misma IP o sobre la misma cuenta, **When** se supera el límite configurado, **Then** se aplica un bloqueo temporal, se muestra cuándo reintentar y se registra el evento de seguridad.

---

### User Story 2 - Cerrar sesión y proteger rutas autenticadas (Priority: P1)

Como usuario con sesión activa quiero poder cerrar sesión explícitamente y que las rutas que requieren autenticación me redirijan a login si no tengo sesión válida, para mantener el control de mi cuenta y evitar accesos no autorizados.

**Why this priority**: La revocación explícita y la protección de rutas son requisitos de seguridad no negociables (`constitution/SECURITY.md`). Sin logout y sin protección de rutas, la sesión es insegura y el área autenticada es accesible sin credenciales.

**Independent Test**: Un usuario con sesión puede cerrarla y, tras hacerlo, cualquier ruta autenticada le redirige a login; una sesión revocada no permite acceder a procedimientos autenticados.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión activa, **When** pulsa "Cerrar sesión", **Then** la sesión se invalida, la cookie se elimina y es redirigido a la página pública o de login.
2. **Given** un visitante sin sesión, **When** intenta acceder a una ruta que requiere autenticación, **Then** es redirigido a `/auth?tab=login&callback=<destino>` conservando el destino original para volver tras autenticarse.
3. **Given** una sesión expirada o inválida, **When** el cliente realiza una petición a un procedimiento autenticado, **Then** se rechaza con un error de no autorizado y el cliente puede redirigir a login.
4. **Given** un usuario que cierra sesión en un dispositivo, **When** intenta usar un token de sesión previamente válido en otro contexto, **Then** el token ya no es válido si la estrategia de sesión está respaldada por un almacén revocable.

---

### User Story 3 - Consultar estado de sesión y onboarding desde la UI (Priority: P2)

Como usuario con sesión activa quiero ver mi estado de verificación y onboarding al iniciar sesión para saber qué pasos me faltan y continuarlos sin perder el contexto.

**Why this priority**: Mejora la experiencia post-login conectando con el onboarding de `002-registration`, pero el login básico funciona sin ella. Es prioritaria pero no bloquea el MVP de autenticación.

**Independent Test**: Tras iniciar sesión, el usuario ve su estado de email, teléfono e identidad y puede navegar al paso pendiente correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario que acaba de iniciar sesión con email verificado pero teléfono pendiente, **When** llega a su área autenticada, **Then** ve su estado de onboarding con un enlace claro a `/verify` para completar el teléfono.
2. **Given** un usuario con email y teléfono verificados pero KYC no iniciado, **When** llega a su área autenticada, **Then** ve la opción de iniciar KYC y las capacidades disponibles según su nivel de verificación.
3. **Given** un usuario con toda la verificación completa, **When** inicia sesión, **Then** accede directamente a su dashboard sin prompts de onboarding.

---

### Edge Cases

- La contraseña nunca debe aparecer en logs, respuestas, analítica ni mensajes de error.
- El token de sesión nunca debe exponerse al código de cliente JavaScript; vive solo en una cookie HttpOnly.
- Un intento de login con un email no registrado debe producir la misma respuesta genérica que un intento con contraseña incorrecta, para no enumerar cuentas.
- Un usuario que marca "recuérdame" debe obtener una sesión con duración extendida; sin "recuérdame", la sesión expira al cerrar el navegador o tras el TTL configurado.
- La pérdida de conexión durante el login debe permitir reintentar sin crear sesiones duplicadas.
- Un token de sesión manipulado o firmado incorrectamente debe ser rechazado sin revelar detalles internos.
- El logout debe ser idempotente: cerrar sesión sin sesión activa no produce error.
- Un usuario con cuenta `pending` que aún no ha verificado el email puede iniciar sesión limitada para completar verificación, pero no acceder a funciones que requieren email verificado.
- El login debe respetar el rate limiting por IP y por cuenta, compartiendo o complementando los límites definidos en `002-registration` sin duplicar configuración.
- Un cambio de contraseña o un evento sensible posterior al login debe poder invalidar sesiones existentes según la estrategia de revocación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer un formulario de inicio de sesión con email y contraseña en la misma pantalla unificada que el registro, accesible desde la página pública y desde cualquier ruta que requiera autenticación cuando el usuario no tenga sesión. La pantalla unificada MUST permitir alternar entre "Iniciar sesión" y "Crear cuenta" mediante tabs sin perder el contexto visual ni navegar a otra URL.
- **FR-002**: El sistema MUST verificar la credencial comparando el hash almacenado con un algoritmo resistente y sin revelar en la respuesta qué campo fue incorrecto.
- **FR-003**: El sistema MUST crear una sesión tras un login exitoso mediante un token opaco o JWT firmado, almacenado exclusivamente en una cookie HttpOnly, Secure en producción y SameSite adecuado, nunca accesible desde JavaScript de cliente.
- **FR-004**: El sistema MUST aplicar rate limiting por IP y por cuenta sobre los intentos de login, registrando los bloqueos como eventos de seguridad sin incluir la contraseña ni el email completo.
- **FR-005**: El sistema MUST rechazar el login para cuentas en estado `suspended`, `deleted` o `deletion_requested` con mensajes que no enumeren la existencia ni el motivo exacto más allá de lo necesario para orientar al usuario.
- **FR-006**: El sistema MUST permitir cerrar sesión de forma explícita, invalidando el token de sesión y eliminando la cookie, de forma idempotente.
- **FR-007**: El sistema MUST proteger las rutas y procedimientos autenticados rechazando o redirigiendo cualquier petición sin sesión válida a la pantalla unificada de autenticación, conservando el destino original para volver tras login cuando proceda.
- **FR-008**: El sistema MUST poder invalidar sesiones existentes tras un evento sensible (cambio de contraseña, suspensión de cuenta) según la estrategia de revocación, sin requerir logout manual en cada dispositivo.
- **FR-009**: El sistema MUST distinguir entre una sesión plena (email verificado) y una sesión limitada (email pendiente) para redirigir al onboarding correspondiente sin conceder capacidades condicionadas.
- **FR-010**: El sistema MUST ofrecer una opción de "recuérdame" que extienda la duración de la sesión, con un TTL por defecto razonable cuando no se marca.
- **FR-011**: El sistema MUST registrar eventos de seguridad de login exitoso, fallido, bloqueo y logout con datos mínimos y sin secretos, complementando los eventos definidos en `002-registration`.
- **FR-012**: La interfaz MUST aplicar el tema `profesional-seguro`, labels explícitos, foco visible, navegación por teclado, mensajes de error junto al campo y alternativas no cromáticas, conforme a `constitution/DESIGN.md` y `constitution/FRONTEND.md`.
- **FR-013**: El sistema MUST integrarse con el contexto de sesión existente en tRPC para que los procedimientos `authedProcedure` funcionen correctamente, sin introducir una segunda estrategia de sesión paralela.
- **FR-014**: El sistema MUST redirigir tras el login al destino original solicitado o al siguiente paso de onboarding pendiente, sin enviar al usuario a una página genérica cuando venía de una ruta concreta. La pantalla unificada MUST recibir el destino original como parámetro y devolverlo tras autenticación exitosa.

### Key Entities *(include if feature involves data)*

- **Session**: Representación de una sesión activa asociada a un usuario, con identificador opaco, estado (activa/revocada/expirada), fecha de creación, expiración y referencia al usuario. Si la estrategia es JWT sin almacén, el estado de revocación se gestiona mediante una lista de invalidación o invalidación por evento sensible.
- **SecurityEvent** (reutiliza la entidad de `002-registration`): Registra login exitoso, login fallido, bloqueo por rate limit, logout y revocación de sesión, sin incluir contraseña, token ni email completo.
- **User** (reutiliza la entidad de `002-registration`): Fuente del estado de cuenta (`pending`, `active`, `suspended`, `deleted`) que condiciona el resultado del login.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de los usuarios con credenciales correctas completan el login en menos de 10 segundos desde que pulsan enviar.
- **SC-002**: El 100% de los intentos con credenciales incorrectas recibe el mismo mensaje genérico sin distinguir si falló el email o la contraseña.
- **SC-003**: El 100% de las rutas y procedimientos autenticados rechaza o redirige correctamente a un visitante sin sesión válida.
- **SC-004**: El 100% de los logouts invalida la sesión y elimina la cookie, y un logout sin sesión previa no produce error.
- **SC-005**: El 100% de los eventos de login, logout, bloqueo y revocación queda auditable en `SecurityEvent` sin contraseñas, tokens ni emails completos.
- **SC-006**: Tras superar el límite de intentos fallidos, el 100% de los intentos adicionales dentro de la ventana de bloqueo se rechaza y muestra cuándo reintentar.
- **SC-007**: En pruebas de teclado y lector de pantalla, el 100% de los controles del formulario de login tiene nombre accesible, orden lógico, foco visible y mensajes de error anunciados.
- **SC-008**: Un usuario con email no verificado que inicia sesión es redirigido a verificación en el 100% de los casos sin acceder a funciones que requieren email verificado.

## Assumptions

- La feature se implementa en la aplicación web existente bajo `/development`, reutilizando los modelos `User`, `PasswordCredential`, `VerificationState` y `SecurityEvent` creados en `002-registration`.
- La estrategia de sesión será una sola, alineada con la decisión de `research.md` de `002-registration`: sesión respaldada por DB o JWT con revocación equivalente, nunca dos estrategias en paralelo.
- El login por SSO (Google, Apple, Facebook) queda fuera de esta feature; `002-registration` ya definió el contrato `startSso`/`completeSso` y esta feature se centra en email/contraseña. El SSO se habilitará en una feature posterior cuando los proveedores estén configurados.
- La recuperación de contraseña y el cambio de credenciales quedan fuera de esta feature; esta feature debe dejar los puntos de extensión seguros (invalidación de sesión) pero no implementar el flujo completo de recuperación.
- El rate limiting reutiliza la infraestructura de `rate-limit.service.ts` de `002-registration` con buckets específicos para login, sin duplicar la configuración centralizada.
- Los documentos legales ya fueron aceptados en el registro; el login no requiere re-aceptación salvo que se publique una nueva versión obligatoria, lo cual queda fuera de esta feature.
- La pantalla de autenticación es unificada: una sola página (`/auth`) con tabs para alternar entre "Iniciar sesión" y "Crear cuenta", reutilizando el formulario de registro existente de `002-registration`. La ruta `/register` existente se redirige a `/auth?tab=register` para mantener compatibilidad con enlaces y bookmarks.
- El panel de arte lateral (`.auth-art`) se mantiene en la pantalla unificada, cambiando el mensaje según el tab activo pero conservando el layout `auth-page` definido en `globals.css`.
- El middleware de sesión se implementa en el contexto tRPC y/o middleware de Next.js, respetando la separación Server/Client Component de `constitution/FRONTEND.md`.
- Las reglas visuales definitivas proceden de `constitution/DESIGN.md`; no se añade modo oscuro ni una segunda dirección estética en esta feature.
- La verificación de cuenta (`accountStatus`) sigue las reglas definidas en `002-registration`: `pending` permite sesión limitada para onboarding, `active` permite sesión plena, `suspended`/`deleted` bloquean el login.
