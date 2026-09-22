# Feature Specification: Módulo de Perfil de Usuario

**Feature Branch**: `004-user-profile`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Crear el Módulo de Perfil de Usuario con visualización pública de reputación y edición privada del perfil (PROF-001 y PROF-002)."

## Contexto y Objetivos

El módulo permite que cualquier visitante consulte una representación pública y segura de la reputación de un usuario, mientras que la persona autenticada puede mantener sus propios datos de perfil. La feature cubre **PROF-001** (perfil público) y **PROF-002** (edición privada del perfil), sin exponer credenciales ni datos de contacto privados.

## User Scenarios & Testing

### User Story 1 - Consultar un perfil público (Priority: P1)

Como visitante, quiero abrir `/users/[id]` y ver la identidad pública y reputación de un usuario para decidir si deseo interactuar con sus listings.

**Why this priority**: La reputación es información esencial para la confianza en el marketplace y debe estar disponible antes de iniciar una transacción.

**Independent Test**: Con un usuario activo y datos públicos sembrados, abrir `/users/[id]` sin sesión y comprobar que se muestran los datos permitidos y sus listings activos.

**Acceptance Scenarios**:

1. **Given** un usuario activo existente, **When** un visitante abre `/users/[id]`, **Then** ve avatar, `displayName`, bio, rating, número de transacciones, badges aplicables y listings activos.
2. **Given** un usuario inexistente, eliminado o suspendido, **When** se solicita su perfil público, **Then** el sistema devuelve un estado 404/no disponible sin revelar datos privados.
3. **Given** un usuario sin bio, avatar, rating, badges o listings, **When** se abre su perfil, **Then** se muestran estados vacíos consistentes y la página no falla.

---

### User Story 2 - Editar el perfil propio (Priority: P1)

Como usuario autenticado, quiero editar mi avatar, nombre visible, biografía y ubicación preferida desde `/profile` para mantener actualizada mi presentación.

**Why this priority**: La edición privada permite corregir o completar la información que alimenta la confianza del perfil público.

**Independent Test**: Iniciar sesión, visitar `/profile`, guardar cambios válidos y comprobar que los nuevos valores persisten y se reflejan en el perfil público cuando corresponda.

**Acceptance Scenarios**:

1. **Given** una sesión válida, **When** el usuario abre `/profile`, **Then** el formulario se inicializa con sus propios valores editables.
2. **Given** valores válidos para `avatarUrl`, `displayName`, `bio` y ubicación preferida, **When** el usuario guarda el formulario, **Then** el servidor valida, persiste los cambios y devuelve una confirmación sin incluir secretos.
3. **Given** una petición de actualización sin sesión o con un `userId` distinto al sujeto autenticado, **When** se intenta guardar, **Then** la operación se rechaza con 401/403 y no modifica ningún perfil.
4. **Given** una URL de avatar inválida o campos que superan sus límites, **When** se envía el formulario, **Then** se muestran errores de validación y no se persiste ningún campo parcialmente.

## Requisitos Funcionales

- **FR-001 (PROF-001)**: El sistema MUST exponer un perfil público en `/users/[id]` para usuarios activos y no eliminados.
- **FR-002**: El perfil público MUST mostrar únicamente avatar, `displayName`, bio, rating, número de transacciones, badges públicos y listings activos.
- **FR-003**: El sistema MUST mostrar los badges **Verificado** y **Respuesta rápida** únicamente cuando sus condiciones sean satisfechas por datos del servidor; nunca se aceptará un badge enviado por el cliente.
- **FR-004**: El perfil público MUST listar únicamente listings activos/publicados pertenecientes al usuario consultado, respetando las reglas de soft-delete y visibilidad existentes.
- **FR-005 (PROF-002)**: El sistema MUST ofrecer el formulario privado `/profile` para editar `avatarUrl`, `displayName`, `bio` y ubicación preferida.
- **FR-006**: Toda actualización de perfil MUST validarse en el servidor con límites de longitud, formato y normalización definidos por el contrato del módulo.
- **FR-007**: La edición MUST requerir autenticación y el servicio MUST autorizar la operación usando la identidad de la sesión, no un identificador confiado del formulario.
- **FR-008**: Una actualización inválida MUST ser atómica: no se guardarán cambios parciales.
- **FR-009**: Las respuestas públicas y de actualización MUST excluir email, teléfono, credenciales, tokens, sesiones, eventos de seguridad y cualquier otro dato privado.
- **FR-010**: El sistema MUST devolver un error controlado para perfiles inexistentes, inactivos o no visibles sin enumerar información adicional.

## Modelo de Datos (Prisma)

El modelo `User` existente ya contiene `avatarUrl`, `displayName`, `bio`, `ratingAverage`, `transactionCount`, `accountStatus`, `deletedAt` y la relación `listings`. La implementación debe verificar que esos campos se reutilicen sin duplicarlos.

La feature MUST extender `User` con:

| Campo | Tipo Prisma propuesto | Reglas |
|---|---|---|
| `preferredLocation` | `String? @db.VarChar(160)` | Ubicación aproximada elegida por el usuario; opcional, normalizada y nunca debe contener una dirección exacta requerida para una transacción. |

Reglas adicionales:

- `ratingAverage` y `transactionCount` son datos derivados del dominio y son de solo lectura para el formulario.
- El badge **Verificado** se deriva de `VerificationState`/verificación de identidad vigente, según las capacidades existentes; no se añade un booleano editable al usuario.
- El badge **Respuesta rápida** se deriva de `responseTimeHours` y del umbral definido por negocio; no se añade un badge persistido manipulable por el cliente.
- Los listings públicos se obtienen mediante la relación `User.listings`, filtrando por estado publicado/activo y `deletedAt IS NULL`.
- La extensión del schema requiere una migración Prisma revisable y compatible con usuarios existentes (`NULL` para registros previos).

## Seguridad

- La ruta `/profile` MUST estar protegida por el middleware de autenticación y la acción/router de actualización MUST repetir la comprobación en servidor.
- Solo el usuario autenticado puede editar su propio perfil (**RBAC / Middleware**). No se permite editar pasando el identificador de otro usuario.
- El perfil público no debe exponer email, teléfono, ubicación exacta, credenciales, sesiones, datos KYC, eventos de seguridad ni información de contacto no destinada a publicación.
- Las entradas deben validarse con Zod en el límite de la aplicación y volver a validarse en el servicio; las URLs de avatar deben aceptar únicamente formatos/protocolos permitidos.
- Los errores de autorización y de inexistencia no deben permitir enumerar perfiles privados.
- Los cambios de perfil no deben registrar en logs el contenido completo de la bio, URLs privadas ni otros datos personales innecesarios.

## Plan de Pruebas

- **Unitarios**: servicio de usuarios/perfil, schemas Zod, normalización, límites, cálculo de badges, mapeo público y rechazo de entradas inválidas.
- **Integración**: endpoints/actions o caller tRPC de perfil contra PostgreSQL real/efímero; lectura pública, listings activos, persistencia del campo de ubicación, atomicidad y autorización 401/403.
- **Seguridad**: comprobar que un usuario no puede actualizar otro `User` y que las respuestas no incluyen campos privados.
- **UI/E2E**: visita pública de `/users/[id]`, edición válida e inválida en `/profile`, y navegación con teclado/controles accesibles cuando la pantalla sea implementada.

## Success Criteria

- **SC-001**: Un perfil público válido muestra todos los campos públicos y solo los listings activos en una sola carga.
- **SC-002**: El 100% de las actualizaciones de perfil sin sesión o sobre otro usuario son rechazadas sin cambios en la base de datos.
- **SC-003**: Los valores válidos guardados en `/profile` se recuperan tras una nueva carga y se reflejan en el perfil público dentro de la siguiente lectura.
- **SC-004**: La suite unitaria cubre al menos el 80% de la lógica de negocio del módulo y la integración cubre los casos de autorización y persistencia.

## Assumptions

- Se reutiliza la autenticación y sesión respaldada por DB de `003-login`.
- La ruta pública `/users/[id]` usa el identificador público actual del modelo `User`; no se introduce un username adicional en esta feature.
- La ubicación preferida es una descripción aproximada para personalización/descubrimiento y no sustituye la dirección operativa de un listing.
- Los módulos que calculan reviews/transacciones pueden seguir siendo fuentes futuras; el perfil consume los campos agregados existentes sin permitir su edición.