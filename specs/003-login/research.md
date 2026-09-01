# Research: Inicio de Sesión y Gestión de Sesión

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Estrategia de sesión

**Decisión**: Sesión opaca respaldada por base de datos (tabla `Session`) con token aleatorio de 32 bytes en cookie HttpOnly/Secure/SameSite=Lax. No usar JWT visible desde el cliente.

**Rationale**: `constitution/SECURITY.md` §2.1 exige sesiones cortas con cookies HttpOnly/Secure/SameSite y revocación tras logout y eventos sensibles. Un token opaco almacenado en DB permite revocación inmediata (eliminar la fila) sin lista de invalidación separada, y el payload del cliente nunca contiene claims — la cookie es solo un identificador opaco. El contexto tRPC carga la sesión desde DB en cada request, lo que garantiza que una sesión revocada deje de ser válida instantáneamente. `002-registration/research.md` ya decidió "una sola estrategia de sesión"; esta feature la concreta.

**Alternativas consideradas**:
- JWT con refresh rotation: descartado porque la revocación requiere una lista de invalidación (denylist) que reintroduce complejidad de estado, y el JWT expone claims al cliente aunque sean mínimos. La constitución permite JWT pero exige que el accesible desde el cliente contenga solo `sub`, `email`, `role` — un token opaco ni siquiera expone eso.
- Auth.js/NextAuth con adaptador Prisma: viable a futuro para OAuth, pero `002-registration` dejó el contrato SSO sin cablear y esta feature se centra en email/contraseña. Introducir Auth.js ahora añadiría configuración de adaptador, callbacks y estrategia sin beneficio para el login por password. El diseño deja el punto de extensión para integrar Auth.js cuando se active SSO.
- Sesión en memoria: descartado por multiinstancia y falta de persistencia.

## Verificación de credenciales

**Decisión**: Reutilizar `verifyPassword` de `src/server/auth/password.ts` (scrypt con salt aleatorio y `timingSafeEqual`). El login normaliza el email con `normalizeEmail` de `002-registration`, busca `User` por `emailNormalized`, verifica `PasswordCredential.passwordHash` y devuelve un error genérico si cualquiera de los pasos falla.

**Rationale**: `002-registration` ya implementó hash/verify con `scrypt` y `timingSafeEqual`. La constitución (`SECURITY.md` §2.3) pide Argon2id o bcrypt; scrypt es un derivado de la familia PBKDF aceptado por OWASP y el código existente ya está testeado. Migrar a Argon2id es una mejora futura que no bloquea esta feature.

**Alternativas consideradas**:
- Migrar a Argon2id ahora: descartado porque requiere añadir dependencia (`@node-rs/argon2` o `argon2`), rehashear contraseñas existentes y coordinar con `002-registration`. Se documenta como mejora futura.
- Comparación directa sin `timingSafeEqual`: descartado por timing attack.

## Rate limiting de login

**Decisión**: Reutilizar `consumeRateLimit` de `src/server/auth/rate-limit.service.ts` con dos buckets: `login:ip:<ip>` (5 intentos/minuto, alineado con `SECURITY.md` §5.2) y `login:email:<emailNormalized>` (5 intentos/minuto). Ambos buckets deben pasar para que el intento se procese.

**Rationale**: La constitución exige rate limiting por IP y por usuario. `002-registration` ya tiene la infraestructura de buckets en memoria con configuración centralizada. Usar dos buckets independientes evita que un atacante con múltiples IPs agote solo el bucket por email, y viceversa.

**Alternativas consideradas**:
- Solo bucket por IP: descartado porque un atacante con botnet puede probar muchas contraseñas sobre una cuenta.
- Solo bucket por email: descartado porque un atacante puede enumerar cuentas probando desde una IP.
- Redis como store: diferido a multiinstancia; `RATE_LIMIT_STORE=memory` es suficiente para desarrollo y monoinstancia, consistente con `002-registration`.

## Middleware de sesión y contexto tRPC

**Decisión**: Leer la cookie de sesión en el `createTRPCContext` (o en un middleware de Next.js para rutas `(app)`) y cargar la sesión desde DB. Si la cookie no existe, es inválida o la sesión está revocada, `ctx.session = null`. El `authedProcedure` existente ya lanza `UNAUTHORIZED` cuando `ctx.session` es null, por lo que funciona sin cambios una vez el contexto deje de hardcodear `null`.

**Rationale**: `trpc.ts` ya tiene `authedProcedure` preparado como punto de extensión. Esta feature solo necesita rellenar `ctx.session` desde la cookie en lugar de `null`. El route handler `app/api/trpc/[trpc]/route.ts` debe pasar los headers/cookies al contexto.

**Alternativas consideradas**:
- Middleware de Next.js exclusivo: útil para proteger rutas de página (Server Components) pero no suficiente para tRPC, que necesita el contexto. Se usa middleware para rutas `(app)` y contexto para tRPC.
- Cargar sesión en cada procedimiento: descartado por duplicación; el contexto la carga una vez por request.

## Protección de rutas y redirección post-login

**Decisión**: Middleware de Next.js (`middleware.ts`) protege el route group `(app)` redirigiendo a `/auth?tab=login&callback=<destino>` cuando no hay cookie de sesión válida. Tras un login exitoso, el servidor redirige a `callback` si existe y es una ruta interna segura, o al siguiente paso de onboarding, o al dashboard por defecto.

**Rationale**: `FR-007` exige proteger rutas autenticadas y conservar el destino original. El middleware de Next.js se ejecuta antes del render de la página y puede leer cookies. Validar que `callback` sea una ruta interna previene open redirect.

**Alternativas consideradas**:
- Protección solo en tRPC: insuficiente porque las páginas Server Component bajo `(app)` se renderizarían sin sesión antes de que tRPC rechace la llamada.
- Redirección solo cliente: descartada por parpadeo y falta de protección real.

## Logout

**Decisión**: Procedimiento tRPC `auth.logout` (o route handler) que elimina la fila `Session` de la DB y borra la cookie con `maxAge: 0`. Es idempotente: si no hay sesión, responde éxito sin error.

**Rationale**: `FR-006` exige logout idempotente. Eliminar la fila garantiza revocación inmediata incluso si la cookie no se borra (el token deja de ser válido).

## "Recuérdame"

**Decisión**: Checkbox opcional en el formulario de login. Si se marca, `maxAge` de la cookie es 30 días; si no, 1 hora (sesión corta, alineado con `SECURITY.md` §2.1 "15–60 min"). El TTL se almacena en `Session.expiresAt`.

**Rationale**: La constitución exige sesiones cortas por defecto. "Recuérdame" extiende la duración solo cuando el usuario lo pide explícitamente, patrón estándar en apps web.

## Eventos de seguridad

**Decisión**: Registrar en `SecurityEvent` (entidad de `002-registration`): `login_success`, `login_failure`, `login_blocked`, `logout`, `session_revoked`. Metadatos con allowlist: `userId` (si known), `ip`, `requestId`, `outcome`. Nunca contraseña, email completo ni token.

**Rationale**: `FR-011` y `SECURITY.md` §8.1 exigen logging de intentos de login fallidos, cambios de credenciales y rate limiting. `SecurityEvent` ya existe en el schema con `metadata Json?` y índices por `userId` y `eventType`.

## Testing

**Decisión**: Unitarios para `login.service` (mock Prisma, verificar password, rate limiting, estados de cuenta), integración con Testcontainers para `auth.router` (login real, logout, sesión válida/inválida, rate limit), y E2E con Playwright para el flujo `/auth → dashboard → logout` incluyendo alternancia de tabs. axe-core para accesibilidad del formulario y los tabs.

**Rationale**: Alineado con `constitution/TESTING.md`: unitarios para lógica pura, integración con DB real para routers, E2E para flujos críticos. `002-registration` ya usa el mismo patrón.

**Alternativas consideradas**: Mockear DB en integración, descartado por la constitución.
