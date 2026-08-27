# Research: Registro y Verificación

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-08-26

## Alcance MVP

**Decisión**: Implementar email/contraseña, sesiones seguras, email OTP, SMS OTP, consentimientos versionados y estados KYC con capacidades bloqueadas. SSO será configurable; Google es el primer proveedor candidato y Apple/Facebook quedan deshabilitados hasta completar configuración y revisión legal. KYC real requiere proveedor aprobado.

**Rationale**: El requisito fuente pide los cinco caminos, pero activar simultáneamente tres OAuth, dos canales OTP y KYC sin proveedores ni políticas de privacidad cerradas aumenta superficie de fallo. La spec permite proveedores “cuando estén habilitados” y uso básico sin KYC.

**Alternativas consideradas**:

- Activar todos los proveedores en el primer despliegue: descartado por scopes, secretos, emails privados de Apple, disponibilidad de email en Facebook y coste operativo.
- Posponer todo SSO: descartado porque AUTH-001 lo contempla; se deja el contrato y se habilita por configuración.
- Implementar KYC casero: descartado por custodia y riesgo de documentos de identidad.

## Sesión y autenticación

**Decisión**: Usar Auth.js/NextAuth para OAuth y cookies/sesiones, y `AuthService` propio para contraseña, onboarding, vinculaciones y estados. La estrategia concreta de sesión debe ser una sola: sesión respaldada por DB si el adaptador lo soporta, o JWT con refresh rotation equivalente, nunca ambas en paralelo.

**Rationale**: Auth.js conoce los flujos OAuth, mientras el dominio necesita controlar credenciales, verificación y capacidades. Una sola fuente de sesión evita revocaciones inconsistentes.

**Alternativas consideradas**: Implementar OAuth y sesiones manualmente, descartado por mayor riesgo; usar solo JWT sin revocación, descartado para cambios de credenciales y abuso.

## Contraseñas y OTP

**Decisión**: Argon2id para contraseñas; bcrypt como fallback condicionado por infraestructura. OTP aleatorio de 6 dígitos, almacenado como HMAC/hash, con caducidad de 10 minutos, un desafío activo por propósito/canal, máximo 5 intentos y límites centralizados de reenvío.

**Rationale**: Cumple la constitución de seguridad, evita secretos en DB/logs y permite consumir un desafío de forma atómica. Los valores son defaults de planificación y deben centralizarse en configuración.

**Alternativas consideradas**: OTP en claro, descartado; TOTP permanente, descartado porque email/SMS son desafíos temporales; enviar SMS dentro de la transacción de DB, descartado porque un timeout externo no debe dejar la cuenta a medias.

## SSO

**Decisión**: Authorization Code Flow con PKCE cuando el proveedor lo soporte; validar `state`, `nonce`, firma, issuer, audience y expiración. Identidad única por `provider` + `providerAccountId`; no vincular automáticamente por email coincidente.

**Rationale**: Reduce CSRF, confusión de identidad y account takeover. Los scopes deben ser mínimos y los errores deben ser genéricos.

**Alternativas consideradas**: Confiar en el email del proveedor, descartado; permitir auto-link por email, descartado sin reautenticación.

## KYC y privacidad

**Decisión**: El proveedor KYC custodiará DNI/selfie por defecto. Toolyo guardará estado, referencia externa, proveedor, timestamps, versión de términos KYC y código general de resultado. El webhook debe tener firma, idempotencia y transiciones válidas.

**Rationale**: Minimiza PII restringida y simplifica borrado, acceso y control administrativo. La base legal, retención exacta, responsable y encargados requieren confirmación legal antes de producción.

**Alternativas consideradas**: Guardar documentos en S3 propio, descartado salvo obligación legal documentada; aceptar el callback sin verificar firma, descartado.

## Consentimientos

**Decisión**: Separar aceptación de Términos, información/aceptación de Privacidad y marketing opcional. Guardar documento, versión, idioma, timestamp, finalidad y contexto mínimo. No inferir consentimiento comercial.

**Rationale**: Permite demostrar qué texto estaba vigente y evita mezclar obligación contractual con marketing.

**Alternativas consideradas**: Una única casilla “Acepto todo”, descartada por falta de granularidad y trazabilidad.

## Testing

**Decisión**: Unitarios para normalización, schemas, OTP y capacidades; integración con PostgreSQL real para constraints, transacciones y webhooks; Playwright para registro y verificaciones; axe-core para accesibilidad.

**Rationale**: Se alinea con `constitution/TESTING.md` y prueba la seguridad en los límites correctos sin testear internals de librerías.

**Alternativas consideradas**: Mockear DB en integración, descartado; E2E de cada proveedor desde el primer día, descartado por coste y dependencia externa.
