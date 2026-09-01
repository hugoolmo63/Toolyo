# Contract: Inicio de Sesión y Sesión

Los routers tRPC son delgados: validan con Zod, requieren el procedimiento adecuado y delegan en servicios. Los payloads de salida nunca contienen hashes, contraseñas, tokens de sesión ni objetos Prisma crudos.

## Procedimientos de aplicación

### `auth.loginWithPassword`

**Acceso**: público.

**Entrada**:

```ts
{
  email: string;       // se normaliza antes de buscar
  password: string;    // mínimo 12 caracteres (validado por Zod)
  rememberMe?: boolean; // extiende la sesión a 30 días si true
  callback?: string;    // ruta interna de retorno, validada contra open redirect
}
```

**Salida**: `{ userId, accountStatus, emailVerificationStatus, redirectTo }`.

- `redirectTo` es `callback` si es una ruta interna segura, o `/verify` si el email no está verificado, o `/dashboard` por defecto.
- `accountStatus` es `pending` o `active`. Nunca `suspended` ni `deleted` (esos se rechazan).

**Reglas**: normalizar email; aplicar rate limit por IP y por email; buscar `User` por `emailNormalized`; si no existe o el hash no coincide, devolver error genérico `invalid_credentials` sin distinguir cuál falló; si `accountStatus` es `suspended`/`deleted`/`deletion_requested`, rechazar con `account_suspended` (mensaje genérico para `deleted`); si todo es válido, crear `Session` con token opaco, establecer cookie HttpOnly/Secure/SameSite=Lax, registrar `SecurityEvent` de éxito y devolver el destino; en fallo, registrar `SecurityEvent` de fallo sin email completo ni contraseña.

**Errores públicos**: `invalid_credentials` (401), `account_suspended` (403), `rate_limited` (429 con `retryAfterSeconds`).

### `auth.logout`

**Acceso**: `authedProcedure` (requiere sesión válida). También acepta sesión nula sin error (idempotente).

**Entrada**: ninguna.

**Salida**: `{ success: true }`.

**Reglas**: marcar `Session.revokedAt = now()` (o eliminar la fila); eliminar la cookie con `maxAge: 0`; registrar `SecurityEvent` de logout; si no hay sesión, responder `{ success: true }` sin modificar nada.

### `auth.getSession`

**Acceso**: público (devuelve null si no hay sesión).

**Entrada**: ninguna (lee la cookie del contexto).

**Salida**: `{ userId, email, accountStatus, emailVerificationStatus, capabilities } | null`.

**Reglas**: cargar la sesión desde el contexto tRPC (ya resuelta en `createTRPCContext`); si es null, devolver null; si es válida, devolver los claims mínimos del usuario y sus capacidades derivadas; nunca devolver el token, el hash ni datos sensibles.

### `auth.getOnboardingStatus` (existente en `002-registration`)

**Acceso**: `authedProcedure`.

**Sin cambios**: ya devuelve estados de verificación y capacidades. Esta feature solo asegura que `ctx.session` esté poblado para que funcione.

## Contexto tRPC

### `createTRPCContext`

**Cambios**: leer la cookie `toolyo_session` de los headers del request; buscar `Session` por token donde `revokedAt IS NULL` AND `expiresAt > now()`; si existe, cargar `User` y poblar `ctx.session = { userId, role }`; si no, `ctx.session = null`.

**Firma actualizada**:

```ts
export interface TRPCContext {
  prisma: PrismaClient;
  session: { userId: string; role: "user" | "admin" } | null;
}

export async function createTRPCContext(opts: { prisma: PrismaClient; request?: Request }): Promise<TRPCContext>
```

El route handler `app/api/trpc/[trpc]/route.ts` pasa `req` al contexto.

## Middleware de Next.js

### `middleware.ts`

**Rutas protegidas**: `/dashboard`, `/profile`, y todo el route group `(app)` salvo excepciones.

**Comportamiento**: si la cookie `toolyo_session` no existe, redirigir a `/auth?tab=login&callback=<ruta-solicitada>`. La validación del token se hace en el contexto tRPC y en el Server Component del dashboard; el middleware solo comprueba existencia de la cookie para evitar render de páginas protegidas sin sesión.

**Excepciones**: `/auth`, `/register` (redirige a `/auth?tab=register`), `/verify`, `/kyc`, `/legal/*`, rutas públicas y API.

## Cookies

| Cookie | Valor | Atributos |
|--------|-------|-----------|
| `toolyo_session` | token opaco (base64url, 43 chars) | `HttpOnly`, `Secure` (producción), `SameSite=Lax`, `Path=/`, `Max-Age=3600` (sin rememberMe) o `Max-Age=2592000` (con rememberMe) |

- Nunca se establece desde Client Components; siempre desde el servidor (route handler, Server Component o Server Action).
- El logout la elimina con `Max-Age=0`.

## Pantalla unificada de autenticación

### Ruta `/auth`

**Server Component** que renderiza el layout `auth-page` + `auth-art` + `auth-panel` y delega en un Client Component `AuthTabs` que alterna entre los formularios de login y registro.

**Query params**:
- `tab`: `"login"` (default) o `"register"` — determina el tab activo al cargar.
- `callback`: ruta interna de retorno tras login (validada contra open redirect).

### Componente `AuthTabs`

**Client Component** que:
- Muestra dos tabs: "Iniciar sesión" y "Crear cuenta".
- Renderiza `LoginForm` cuando el tab activo es `login`.
- Renderiza `RegistrationForm` (reutilizado de `002-registration`) cuando el tab activo es `register`.
- Cambia el contenido del panel de arte lateral (`.auth-art`) según el tab activo.
- Sincroniza el tab activo con el query param `?tab=` usando `next/navigation` para mantener URL compartible y bookmarkable.

### Redirección de `/register`

La ruta `/register` existente se redirige a `/auth?tab=register` para mantener compatibilidad con enlaces y bookmarks. La página `/auth` con `tab=register` renderiza el mismo `RegistrationForm` que ya funciona, sin cambios en su lógica.

## Errores públicos

Usar mensajes genéricos para no enumerar cuentas. Distinguir solo lo necesario para que la persona corrija su formulario:

- `invalid_credentials` (401): "Email o contraseña no válidos."
- `account_suspended` (403): "Esta cuenta está suspendida. Contacta con soporte para más información."
- `rate_limited` (429): "Demasiados intentos. Inténtalo de nuevo en {retryAfterSeconds} segundos."
- `unauthorized` (401): "Debes iniciar sesión para acceder a esta página."
