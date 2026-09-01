# Data Model: Inicio de Sesión y Gestión de Sesión

**Feature**: [spec.md](spec.md)
**Fecha**: 2026-09-01

## Entidades nuevas

### Session

Sesión activa asociada a un usuario, con token opaco revocable.

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| `id` | String | `@id @default(cuid())` | Identificador interno |
| `token` | String | `@unique` | Token opaco de 32 bytes en base64url, nunca expuesto al cliente JS |
| `userId` | String | FK → `User.id`, `onDelete: Cascade` | Si se borra el usuario, se borran sus sesiones |
| `expiresAt` | DateTime(timestamptz) | not null | Expiración absoluta; 1h sin "recuérdame", 30d con él |
| `revokedAt` | DateTime(timestamptz) | nullable | Marca revocación explícita o por evento sensible; null = activa |
| `ip` | String | nullable | IP de creación para auditoría |
| `userAgent` | String | nullable | User-Agent de creación para identificación de dispositivo |
| `createdAt` | DateTime(timestamptz) | `@default(now())` | Auditoría |
| `updatedAt` | DateTime(timestamptz) | `@updatedAt` | Auditoría |

**Índices**:
- `@@unique([token])` — búsqueda por token en cada request
- `@@index([userId, revokedAt])` — listar/invalidar sesiones de un usuario
- `@@index([expiresAt])` — purga de sesiones expiradas

**Relaciones**:
- `User` 1 — N `Session` (un usuario puede tener múltiples sesiones en distintos dispositivos)

**Reglas de negocio**:
- Una sesión es válida si `revokedAt IS NULL` AND `expiresAt > now()`.
- El login crea exactamente una fila `Session` por intento exitoso.
- El logout marca `revokedAt = now()` (o elimina la fila).
- Un evento sensible (cambio de contraseña, suspensión) marca `revokedAt = now()` en todas las sesiones del usuario.
- La purga de sesiones expiradas es una operación de mantenimiento fuera del alcance de esta feature, pero el índice `expiresAt` la facilita.

## Entidades reutilizadas (sin cambios)

### User (de `002-registration`)

Se consulta por `emailNormalized` para login. El `accountStatus` determina el resultado:
- `pending` → sesión limitada, redirige a onboarding
- `active` → sesión plena
- `suspended` → login rechazado
- `deleted` / `deletion_requested` → login rechazado con mensaje genérico

### PasswordCredential (de `002-registration`)

Se consulta `passwordHash` por `userId` para verificar la contraseña con `verifyPassword`.

### VerificationState (de `002-registration`)

Se consulta el estado de `email` para distinguir sesión plena vs limitada tras login exitoso.

### SecurityEvent (de `002-registration`)

Se insertan eventos de `login_success`, `login_failure`, `login_blocked`, `logout`, `session_revoked`. Metadatos con allowlist: `userId`, `ip`, `requestId`, `outcome`. Nunca contraseña, email completo ni token.

## Cambios en el schema Prisma

Añadir el modelo `Session` a `development/prisma/schema.prisma` y la relación `sessions Session[]` en `User`. Generar una migración `20260901_login_session` que crea la tabla `Session` con sus índices y la FK a `User`. No modifica ni elimina modelos existentes.

## Diagrama de relaciones

```text
User 1───N Session
User 1───1 PasswordCredential
User 1───N VerificationState
User 1───N SecurityEvent
```
