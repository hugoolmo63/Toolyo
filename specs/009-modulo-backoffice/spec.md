# Feature Specification: Módulo Administrativo (Backoffice)

**Feature Branch**: `009-modulo-backoffice`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Crea el directorio specs/009-modulo-backoffice/ y genera el archivo spec.md con los requisitos del Módulo Administrativo (ADMIN-001 al ADMIN-008: Autenticación 2FA/RBAC, gestión de usuarios/KYC, aprobación de listings, mediación de disputas, moderación de reviews, reportes/analytics, gestión de categorías y CMS/FAQ). Genera también checklists/requirements.md para iniciar el flujo SpecKit."

## Clarifications

### Session 2026-09-24

- Q: ¿Qué mecanismo de segundo factor debe utilizar el MVP administrativo? → A: TOTP basado en RFC 6238, con QR para configurar Google Authenticator o Authy.
- Q: ¿Dónde y bajo qué controles debe exponerse la interfaz administrativa? → A: App Router de Next.js en `/admin`, protegido por middleware y RBAC con roles ADMIN y MODERATOR.
- Q: ¿Cómo debe registrarse la actividad administrativa? → A: Tabla `AdminAuditLog` y helper/middleware de tRPC para registrar automáticamente todas las acciones administrativas.
- Q: ¿Qué requisitos forman parte de la primera entrega del módulo? → A: ADMIN-001 (2FA/RBAC), ADMIN-002 (usuarios y KYC) y ADMIN-005 (moderación de reviews integrada con Módulo 006).

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Auth 2FA (ADMIN-001) y acceso RBAC (Priority: P1)

Como administrador autorizado, quiero acceder al backoffice mediante TOTP y permisos según mi rol, para operar únicamente las áreas que me corresponden.

**Why this priority**: Protege todas las operaciones sensibles del módulo y establece el control de menor privilegio.

**Independent Test**: Configurar TOTP mediante un QR, crear cuentas con roles ADMIN y MODERATOR, intentar acceder con y sin segundo factor y comprobar que cada una solo puede ejecutar acciones permitidas.

**Acceptance Scenarios**:

1. **Given** un administrador con credenciales válidas, **When** completa correctamente el segundo factor, **Then** obtiene acceso solo a las áreas permitidas por su rol.
2. **Given** un usuario sin rol administrativo o con segundo factor fallido, **When** intenta entrar, **Then** el acceso se deniega y el intento queda registrado.
3. **Given** un administrador que inicia el setup de 2FA, **When** solicita configurarlo, **Then** recibe un QR de un solo uso, puede validarlo con una aplicación TOTP compatible y no obtiene acceso administrativo hasta completar la activación.

---

### User Story 2 - Gestión de Usuarios (ADMIN-002) y Verificación KYC (ADMIN-003) (Priority: P1)

Como operador de confianza y seguridad, quiero consultar usuarios, revisar su estado KYC y aplicar acciones administrativas justificadas, para mantener una comunidad segura y conforme.

**Why this priority**: La gestión de identidad y KYC afecta directamente a la seguridad, confianza y capacidad de operar de los usuarios.

**Independent Test**: Consultar un usuario, revisar una solicitud KYC, aprobarla o rechazarla con motivo y comprobar que los datos sensibles solo son visibles para el rol autorizado.

**Acceptance Scenarios**:

1. **Given** una solicitud KYC pendiente, **When** un operador autorizado la aprueba o rechaza con motivo, **Then** cambia de estado, queda registrada la decisión y se notifica al usuario.
2. **Given** un operador sin permiso para datos restringidos, **When** intenta abrir documentos KYC, **Then** el acceso se deniega sin revelar el contenido.

---

### User Story 3 - Moderación de Reviews (ADMIN-005) (Priority: P1)

Como moderador, quiero revisar y resolver reportes sobre reviews desde el backoffice, para mantener contenido fiable y aplicar las reglas de moderación del Módulo 006.

**Why this priority**: La calidad del catálogo y de las opiniones sostiene la confianza de arrendadores y arrendatarios.

**Independent Test**: Procesar una review reportada, verificando permisos, decisión, motivo, visibilidad pública, integración con Módulo 006 y auditoría.

**Acceptance Scenarios**:

1. **Given** una review reportada gestionada por el Módulo 006, **When** un MODERATOR autorizado decide mantenerla u ocultarla, **Then** la decisión se refleja públicamente y queda asociada al reporte y al historial de auditoría.
2. **Given** un usuario con rol ADMIN pero sin permiso de moderación, **When** intenta modificar una review, **Then** la operación se deniega sin cambiar su visibilidad.

---

### User Story 4 - Auditoría y Trazabilidad Inmutable (Priority: P1)

Como administrador autorizado y responsable de cumplimiento, quiero que todas las acciones administrativas queden registradas en una auditoría inmutable, para reconstruir decisiones, detectar accesos indebidos y demostrar trazabilidad.

**Why this priority**: La auditoría es un control transversal de seguridad y cumplimiento para 2FA/RBAC, KYC y moderación.

**Independent Test**: Ejecutar acciones administrativas exitosas, denegadas, inválidas y fallidas; consultar el historial como ADMIN y comprobar que cada evento conserva actor, acción, recurso, resultado y fecha sin permitir modificación o borrado.

**Acceptance Scenarios**:

1. **Given** una acción administrativa autorizada, **When** finaliza correctamente, **Then** se persiste un `AdminAuditLog` con actor, procedimiento, recurso, resultado, fecha y contexto sanitizado.
2. **Given** una acción denegada, inválida o fallida, **When** se procesa, **Then** se registra el resultado correspondiente sin incluir secretos TOTP, hashes, documentos KYC ni PII restringida.
3. **Given** un registro existente, **When** cualquier actor intenta modificarlo o borrarlo desde la aplicación, **Then** la operación no está disponible y el registro permanece sin cambios.

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Un segundo factor caducado, reutilizado o bloqueado debe denegar el acceso sin revelar si las credenciales eran válidas.
- Un operador no puede aprobar su propio documento KYC ni moderar una review en la que participa si existe conflicto de interés.
- Las acciones repetidas sobre el mismo caso deben ser idempotentes o devolver el estado actual sin duplicar decisiones.
- Una review ocultada no debe desaparecer de los historiales ni romper referencias existentes con el Módulo 006.
- Los datos KYC y conversaciones privadas no deben aparecer en listados, exportaciones o métricas que no estén autorizados para datos restringidos.
- Cuando no hay resultados o una métrica no tiene datos suficientes, el backoffice debe mostrar un estado vacío explícito, no un valor engañoso.
- Si dos operadores actúan simultáneamente sobre un caso, solo una transición válida puede prevalecer y la otra debe recibir una respuesta clara.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **ADMIN-001**: El sistema MUST autenticar a los administradores con credenciales válidas y un segundo factor TOTP conforme a RFC 6238, ofrecer un QR durante el setup, mantener una sesión `PENDING_2FA` hasta verificar el código, bloquear intentos fallidos según una política de seguridad y registrar accesos exitosos, fallidos y cierres de sesión.
- **ADMIN-002**: El sistema MUST permitir buscar y consultar usuarios según permisos, mostrar su rol y estado de acceso, y mantener las proyecciones administrativas sin exponer secretos o datos restringidos. Este requisito pertenece al MVP.
- **ADMIN-003**: El sistema MUST permitir revisar el estado y los documentos KYC según autorización, aprobar o rechazar verificaciones con motivo, mantener el historial de decisiones y aplicar rollback si la auditoría obligatoria no puede persistirse. Este requisito pertenece al MVP.
- **ADMIN-004**: El sistema MUST definir la aprobación de listings como alcance posterior al MVP; no debe formar parte de los criterios de aceptación de la primera entrega.
- **ADMIN-005**: El sistema MUST permitir revisar reportes sobre reviews del Módulo 006, mantenerlas, ocultarlas o restaurarlas según permisos, informar el resultado aplicable y conservar la relación entre reporte, review, actor y decisión. Este requisito pertenece al MVP.
- **ADMIN-006**: El sistema MUST definir la mediación de disputas como alcance posterior al MVP; no debe formar parte de los criterios de aceptación de la primera entrega.
- **ADMIN-007**: El sistema MUST definir reportes y analytics como alcance posterior al MVP, incluyendo sus filtros, métricas agregadas y exportaciones en una fase posterior.
- **ADMIN-008**: El sistema MUST definir la gestión de categorías y CMS/FAQ como alcance posterior al MVP, incluyendo estados editoriales, historial y visibilidad pública.
- **FR-009**: El sistema MUST aplicar autorización por recurso además de por rol, proteger los datos KYC como restringidos, ocultar datos sensibles no necesarios y registrar accesos masivos o privilegiados.
- **FR-010**: El sistema MUST persistir en `AdminAuditLog` toda acción administrativa del MVP mediante un helper o middleware de tRPC, conservando actor, fecha, acción, recurso, resultado, motivo y contexto de la operación, sin permitir alteraciones no autorizadas.
- **FR-011**: El sistema MUST mostrar errores comprensibles sin revelar información sensible y garantizar que las transiciones administrativas inválidas, los conflictos de concurrencia y los reintentos no creen estados parciales ni decisiones duplicadas.
- **FR-012**: El sistema MUST permitir que cada usuario administrativo vea claramente su rol, permisos efectivos, estado de sesión y acciones pendientes dentro de las áreas autorizadas bajo `/admin`.

### Key Entities

- **Administrador y Rol**: identidad operativa, roles ADMIN o MODERATOR, permisos, estado TOTP y relación de acceso a cada área de `/admin`.
- **AdminAuditLog**: registro de cada acción administrativa, con actor, acción, recurso, resultado, motivo, fecha y contexto necesario para reconstruirla.
- **Usuario y Verificación KYC**: persona de la plataforma, estado de verificación, documentos restringidos, decisión, motivo y fechas.
- **Review y Reporte de moderación**: opinión publicada y señalamiento asociado con decisión, motivo y visibilidad.
- **Listing, Categoría, Disputa, Reporte/Analítica y Contenido CMS/FAQ**: entidades de fases posteriores; se documentan como dependencias de alcance y no como parte del MVP.
- **Evento de auditoría**: registro inmutable de actor, acción, recurso, resultado, motivo y momento.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: El 100% de los accesos administrativos exitosos exige TOTP RFC 6238 y permiso de rol; el 100% de los intentos denegados queda registrado sin exponer datos sensibles.
- **SC-002**: El 100% de las decisiones sobre KYC y reviews conserva actor, fecha, resultado y motivo cuando aplica, y puede reconstruirse desde `AdminAuditLog`.
- **SC-003**: El 100% de los documentos KYC y datos restringidos es inaccesible para roles sin permiso explícito, incluso mediante búsquedas, exportaciones o enlaces directos.
- **SC-004**: Al menos el 95% de 100 operaciones administrativas válidas de consulta o decisión completa debe tener un p95 inferior a 800 ms bajo condiciones representativas.
- **SC-005**: Al menos el 90% de operadores nuevos completa su primera tarea asignada (verificación KYC o moderación de review) sin asistencia en una prueba de 20 sesiones.
- **SC-006**: El 100% de las acciones administrativas del MVP genera un registro en `AdminAuditLog`, incluyendo actor, acción, recurso, resultado y fecha.
- **SC-007**: En una revisión de 50 casos concurrentes de KYC y moderación, no se producen decisiones duplicadas ni estados inválidos.

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- El MVP está destinado a personal interno y no expone el backoffice a usuarios finales.
- Se reutilizan las identidades y usuarios existentes de la plataforma; la feature no define un nuevo registro público.
- El segundo factor del MVP es TOTP conforme a RFC 6238, con QR de configuración compatible con Google Authenticator y Authy.
- Los roles iniciales del MVP son ADMIN y MODERATOR; se pueden extender sin cambiar el historial de auditoría.
- La interfaz administrativa usa Next.js App Router bajo `/admin`, con middleware y RBAC como controles de entrada complementarios a la autorización de recursos.
- `AdminAuditLog` se persiste como tabla de auditoría y el helper/middleware de tRPC cubre automáticamente las acciones administrativas.
- Los documentos KYC y datos personales se consideran restringidos; los reportes públicos solo contienen información agregada.
- Las políticas legales de retención, borrado y exportación de datos se aplican a los historiales y documentos sin que esta feature las reemplace.
- La primera entrega se limita a ADMIN-001 (2FA/RBAC), ADMIN-002 (usuarios), ADMIN-003 (KYC), ADMIN-005 (moderación de reviews integrada con Módulo 006) y la historia US4 de auditoría transversal. Listings, disputas, analytics, categorías y CMS/FAQ quedan para fases posteriores.
- Los pagos, reembolsos, resolución jurídica externa y automatización de decisiones quedan fuera del alcance inicial.
- Las notificaciones al usuario se apoyan en los canales existentes y deben comunicar decisiones sin incluir documentos KYC ni información interna.
