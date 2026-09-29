# Contract: `admin` tRPC Router

**Router previsto**: `development/src/server/api/routers/admin.router.ts`  
**Registro**: `development/src/server/api/root.ts` como `admin`

## Reglas comunes

- Inputs validados con Zod; nunca aceptar `actorId`, `role` o permisos del cliente.
- Toda mutación usa el middleware de auditoría y registra éxito, denegación o fallo sin secretos/PII restringida.
- Respuestas son proyecciones explícitas: no devolver password hashes, secreto TOTP, tokens, documentos KYC ni Prisma crudo.
- Errores esperados: `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`.

## Flujo de sesión `PENDING_2FA`

1. El login valida credenciales y determina desde el servidor que la cuenta tiene rol `ADMIN` o `MODERATOR` y TOTP activo.
2. En lugar de crear una sesión administrativa completa, crea un challenge opaco con estado `PENDING_2FA`, expiración, usuario asociado y contador de intentos. El challenge no contiene el secreto TOTP ni se devuelve en logs.
3. El cliente muestra el formulario de segundo factor y llama a `admin.verifyTotp` con el challenge y el código de seis dígitos.
4. Si el código es válido, el servidor consume el challenge, crea o eleva la sesión autenticada con el rol canónico y devuelve `redirectTo: "/admin"`. Si falla, mantiene `PENDING_2FA`, incrementa el contador y aplica rate limiting/bloqueo.
5. Un challenge expirado, consumido o bloqueado no puede reutilizarse; los intentos se registran como eventos de seguridad y no revelan si las credenciales iniciales eran correctas.

La creación de la sesión final y el consumo del challenge deben ser atómicos. La ruta `/admin` y los procedimientos administrativos rechazan cualquier sesión que conserve `PENDING_2FA`.

## Auth 2FA / RBAC

### `admin.getAccess`

**Tipo**: query | **Acceso**: sesión válida  
**Input**: ninguno.  
**Output**:

```ts
{
  isAdminAreaEnabled: boolean;
  role: "ADMIN" | "MODERATOR" | null;
  totp: { isEnabled: boolean; setupRequired: boolean };
  permissions: string[];
}
```

### `admin.startTotpSetup`

**Tipo**: mutation | **Acceso**: `ADMIN` o `MODERATOR` con sesión reciente/reautenticada  
**Input**: `{ confirmation: string }`  
**Output**: `{ setupId: string; qrDataUrl: string; expiresAt: string }`.

El QR/challenge es temporal, no se loguea y se invalida al completar, cancelar o expirar.

### `admin.confirmTotpSetup`

**Tipo**: mutation | **Acceso**: usuario autenticado durante setup  
**Input**: `{ setupId: string; code: string }`, seis dígitos  
**Output**: `{ enabled: true; enabledAt: string }`.

### `admin.verifyTotp`

**Tipo**: mutation | **Acceso**: flujo de login pendiente  
**Input**: `{ challengeId: string; code: string }`  
**Output válido**: `{ authenticated: true; sessionState: "AUTHENTICATED"; role: "ADMIN" | "MODERATOR"; redirectTo: "/admin" }`.  
**Output de challenge pendiente**: `{ authenticated: false; sessionState: "PENDING_2FA"; challengeId: string; retryAfterSeconds?: number }`.

Aplica ventana RFC 6238, rate limit y bloqueo progresivo; nunca devuelve el secreto. Los códigos inválidos no crean ni elevan una sesión administrativa.

### `admin.revokeTotp`

**Tipo**: mutation | **Acceso**: propio usuario con reautenticación; otro usuario solo `ADMIN`  
**Input**: `{ userId?: string; reason: string }`  
**Output**: `{ revoked: true; userId: string }`.

## Usuarios y KYC

### `admin.listUsers`

**Tipo**: query | **Acceso**: `ADMIN`; `MODERATOR` solo con permiso de lectura  
**Input**: `{ cursor?: string; limit?: number; query?: string; accountStatus?: string; role?: "ADMIN" | "MODERATOR" | "user" }`  
**Output**: `{ items: UserAdminProjection[]; nextCursor: string | null }`.

La proyección contiene estado, rol, estado KYC resumido y timestamps; no contiene documentos ni secretos.

### `admin.getUser`

**Tipo**: query | **Acceso**: `ADMIN`; campos restringidos requieren permiso y auditoría  
**Input**: `{ userId: string }`  
**Output**: proyección de usuario, estado KYC y permisos visibles.

### `admin.listKyc`

**Tipo**: query | **Acceso**: `ADMIN`; `MODERATOR` no ve documentos  
**Input**: `{ cursor?: string; limit?: number; status?: "pending" | "verified" | "rejected" | "retry_required"; userId?: string }`  
**Output**: `{ items: KycAdminProjection[]; nextCursor: string | null }`.

### `admin.getKyc`

**Tipo**: query | **Acceso**: `ADMIN` con permiso restringido  
**Input**: `{ verificationId: string }`  
**Output**: detalle mínimo, estado, historial y enlaces temporales autorizados si existen.

### `admin.resolveKyc`

**Tipo**: mutation | **Acceso**: `ADMIN`, con reautenticación para documentos  
**Input**: `{ verificationId: string; decision: "verified" | "rejected" | "retry_required"; reason: string }`  
**Output**: `{ verificationId: string; status: string; reviewedAt: string; auditLogId: string }`.

Solo permite estados revisables, exige motivo y devuelve `CONFLICT` ante decisión concurrente.

## Moderación de Reviews (Módulo 006)

### `admin.listReviewReports`

**Tipo**: query | **Acceso**: `ADMIN` o `MODERATOR`  
**Input**: `{ cursor?: string; limit?: number; status?: "open" | "resolved" | "dismissed"; reason?: string }`  
**Output**: `{ items: ReviewReportModerationProjection[]; nextCursor: string | null }`.

Incluye review y contexto mínimo de listing/autor, sin datos privados innecesarios.

### `admin.resolveReviewReport`

**Tipo**: mutation | **Acceso**: `ADMIN` o `MODERATOR`, sin conflicto de interés  
**Input**: `{ reportId: string; decision: "published" | "removed"; resolution: string }`  
**Output**: `{ reportId: string; reviewId: string; reviewStatus: "published" | "removed"; auditLogId: string }`.

Actualiza `Review`, `ReviewReport` y auditoría en una transacción; un reporte resuelto no se duplica.

## Auditoría

### `admin.listAuditLogs`

**Tipo**: query | **Acceso**: `ADMIN` con permiso de auditoría  
**Input**: `{ cursor?: string; limit?: number; actorId?: string; procedure?: string; outcome?: string; resourceId?: string; from?: string; to?: string }`  
**Output**: `{ items: AuditLogProjection[]; nextCursor: string | null }`.

Es solo lectura, usa paginación `createdAt,id`, enmascara contexto sensible y no ofrece `update`/`delete`.

## Error mapping

| Situación | Código | Auditoría |
|---|---|---|
| Sin sesión | `UNAUTHORIZED` | Evento de seguridad sin PII innecesaria. |
| Rol insuficiente | `FORBIDDEN` | `denied`, procedimiento y recurso. |
| Input inválido | `BAD_REQUEST` | `validation_error` sin valores sensibles. |
| Recurso inexistente | `NOT_FOUND` | Sin enumerar datos restringidos. |
| Estado concurrente | `CONFLICT` | Sin decisión parcial. |
| Rate limit | `TOO_MANY_REQUESTS` | Evento de bloqueo seguro. |