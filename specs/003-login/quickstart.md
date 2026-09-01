# Quickstart: Inicio de Sesión y Gestión de Sesión

**Feature**: [spec.md](spec.md)

## Prerrequisitos

- `002-registration` completado (modelos `User`, `PasswordCredential`, `VerificationState`, `SecurityEvent` en DB).
- PostgreSQL levantado: `docker compose up -d db` desde `development/`.
- Dependencias instaladas: `npm ci` desde `development/`.
- `.env` configurado con `DATABASE_URL`, `AUTH_SECRET` y `AUTH_URL`.
- Al menos un usuario registrado y con email verificado (usar el flujo de `/register` → `/verify`).

## Setup

```bash
# Desde development/
npm run db:generate
npm run db:migrate     # aplica la migración que crea la tabla Session
npm run db:seed
npm run dev
```

## Validación manual del flujo

### 1. Login con credenciales correctas

1. Abre `http://localhost:3000/auth` (o `/auth?tab=login`).
2. Verifica que el tab "Iniciar sesión" está activo.
3. Introduce el email y contraseña del usuario registrado.
4. Pulsa "Iniciar sesión".
5. **Esperado**: redirección a `/dashboard` (o a `/verify` si el email no está verificado). La cookie `toolyo_session` aparece en el navegador con `HttpOnly` y `SameSite=Lax`.

### 2. Login con credenciales incorrectas

1. Abre `http://localhost:3000/auth`.
2. Introduce un email válido y una contraseña incorrecta.
3. **Esperado**: mensaje "Email o contraseña no válidos." sin indicar cuál falló. No se crea sesión ni cookie.

### 3. Login con email no registrado

1. En `http://localhost:3000/auth`, introduce un email que no tenga cuenta.
2. **Esperado**: mismo mensaje genérico "Email o contraseña no válidos." — no revela que el email no existe.

### 4. Rate limiting

1. Falla el login 6 veces seguidas desde la misma IP o sobre el mismo email.
2. **Esperado**: en el 6º intento, mensaje "Demasiados intentos. Inténtalo de nuevo en N segundos." con código `rate_limited`.

### 5. Protección de ruta autenticada

1. Sin sesión, navega a `http://localhost:3000/dashboard`.
2. **Esperado**: redirección a `/auth?tab=login&callback=/dashboard`.
3. Tras login exitoso, **esperado**: redirección a `/dashboard` (el callback se respeta).

### 6. Logout

1. Con sesión activa, pulsa "Cerrar sesión".
2. **Esperado**: redirección a `/auth?tab=login` o página pública. La cookie `toolyo_session` desaparece.
3. Navega a `/dashboard` de nuevo. **Esperado**: redirección a `/auth?tab=login&callback=/dashboard`.

### 7. Sesión limitada (email no verificado)

1. Registra un nuevo usuario pero no verifiques el email.
2. Inicia sesión con sus credenciales.
3. **Esperado**: redirección a `/verify`, no a `/dashboard`.

### 8. Pantalla unificada — alternar tabs

1. Abre `http://localhost:3000/auth`.
2. Pulsa el tab "Crear cuenta".
3. **Esperado**: la URL cambia a `/auth?tab=register` y se muestra el formulario de registro existente de `002-registration` sin recargar la página.
4. Pulsa el tab "Iniciar sesión".
5. **Esperado**: la URL cambia a `/auth?tab=login` y se muestra el formulario de login.

### 9. Compatibilidad de `/register`

1. Abre `http://localhost:3000/register` directamente.
2. **Esperado**: redirección a `/auth?tab=register` con el formulario de registro visible y funcional.

## Validación automática

```bash
# Unitarios (lógica pura de login, rate limiting, sesión)
npm test -- tests/unit/auth/login

# Integración (router + DB real con Testcontainers)
npm run test:integration -- tests/integration/auth/login

# Typecheck
npx tsc --noEmit
```

## Verificación de seguridad

- Buscar en logs que no aparezcan contraseñas, tokens de sesión ni emails completos.
- Verificar que la cookie `toolyo_session` tiene `HttpOnly` y `SameSite=Lax` (y `Secure` en producción).
- Verificar que tras logout, el token de sesión ya no es válido en DB (`revokedAt` o fila eliminada).
- Verificar que un usuario suspendido no puede iniciar sesión.

## Dependencias externas

- Ninguna nueva. Reutiliza `password.ts`, `rate-limit.service.ts`, `normalizeEmail` y `SecurityEvent` de `002-registration`.
- No requiere Redis, Auth.js ni proveedores externos para esta feature.
