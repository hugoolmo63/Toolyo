# Data Model: Registro y Verificación

## User

Cuenta principal. Se amplía con identidad, estado y auditoría; no debe usar un único `isVerified`.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | String | `cuid()` o UUID; identificador no enumerable. |
| `emailNormalized` | String | Único, normalizado de forma documentada, nunca expuesto en logs públicos. |
| `phoneE164` | String/null | Normalizado a E.164; índice único parcial si el negocio lo requiere. |
| `accountStatus` | enum | `pending`, `active`, `suspended`, `deletion_requested`, `deleted`. |
| `createdAt`, `updatedAt` | DateTime | `Timestamptz(6)`. |
| `deletedAt` | DateTime/null | Soft delete salvo obligación legal de purga. |

## PasswordCredential

Relación 1:1 opcional con `User` para el camino email/contraseña.

| Campo | Tipo | Reglas |
|---|---|---|
| `userId` | String | Único y FK a User. |
| `passwordHash` | String | Argon2id; nunca devolver ni registrar. |
| `changedAt` | DateTime | Fecha con zona. |
| `createdAt`, `updatedAt` | DateTime | Auditoría. |

## OAuthAccount

Identidad externa vinculada explícitamente.

| Campo | Tipo | Reglas |
|---|---|---|
| `userId` | String | FK a User. |
| `provider` | enum/string | `google`, `apple`, `facebook`. |
| `providerAccountId` | String | Identificador del proveedor, no el email. |
| `createdAt`, `updatedAt` | DateTime | Auditoría. |

Constraint: `@@unique([provider, providerAccountId])`; no auto-link por email coincidente sin sesión y reautenticación.

## VerificationState

Una fila por usuario y canal.

| Campo | Tipo | Reglas |
|---|---|---|
| `userId` | String | FK a User. |
| `channel` | enum | `email`, `phone`, `identity`. |
| `status` | enum | Para contacto: `pending`, `verified`, `blocked`; identidad usa estados de IdentityVerification. |
| `verifiedAt` | DateTime/null | Solo tras desafío válido o callback aprobado. |
| `lastRequestedAt` | DateTime/null | Control de reenvíos. |
| `createdAt`, `updatedAt` | DateTime | Auditoría. |

Constraint: `@@unique([userId, channel])`.

## OtpChallenge

Desafío temporal de un solo uso, separado del estado de verificación.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | String | Cuid/UUID. |
| `userId` | String/null | FK opcional durante registro inicial. |
| `channel` | enum | `email` o `phone`. |
| `purpose` | enum | `registration`, `contact_verification`, `credential_change`, `recovery`. |
| `destinationHash` | String | Referencia minimizada; no guardar destino innecesariamente en claro. |
| `codeHash` | String | HMAC/hash; nunca OTP en claro. |
| `expiresAt` | DateTime | Timestamptz; default de planificación 10 minutos. |
| `attemptCount`, `resendCount` | Int | No negativos; máximo centralizado. |
| `consumedAt`, `blockedAt` | DateTime/null | Mutación atómica. |
| `createdAt` | DateTime | Auditoría. |

Índices: `(userId, channel, purpose, createdAt)` y `expiresAt`; invalidar desafíos activos previos al crear uno nuevo.

## IdentityVerification

Estado KYC y referencia de proveedor, no documentación biométrica por defecto.

| Campo | Tipo | Reglas |
|---|---|---|
| `userId` | String | FK a User; una solicitud activa por usuario. |
| `provider` | String | Proveedor configurado. |
| `providerReference` | String | Único por proveedor; no contiene DNI. |
| `status` | enum | `not_started`, `pending`, `verified`, `rejected`, `retry_required`. |
| `resultCode` | String/null | Código general, sin detalles antifraude. |
| `termsVersion` | String | Versión de términos KYC aceptada. |
| `startedAt`, `completedAt` | DateTime/null | Timestamptz. |
| `createdAt`, `updatedAt` | DateTime | Auditoría. |

Constraint: webhook idempotente por `providerEventId` persistido en tabla de eventos o integración.

## LegalDocument

Documento publicado y versionado.

| Campo | Tipo | Reglas |
|---|---|---|
| `documentType` | enum | `terms`, `privacy`, `marketing`, `kyc`. |
| `version` | String | Único por tipo/idioma. |
| `language` | String | Idioma publicado. |
| `effectiveAt`, `retiredAt` | DateTime/null | Vigencia con zona. |
| `contentHash` | String | Permite probar el contenido aceptado sin duplicar secretos. |

## LegalAcceptance

Evidencia separada por documento y finalidad.

| Campo | Tipo | Reglas |
|---|---|---|
| `userId` | String | FK a User. |
| `legalDocumentId` | String | FK a LegalDocument. |
| `purpose` | enum | `account_terms`, `privacy_notice`, `marketing`, `kyc`. |
| `acceptedAt` | DateTime | Timestamptz. |
| `context` | Json/null | Solo contexto mínimo no sensible. |

Constraint: no sobrescribir aceptaciones históricas; índice por usuario/documento/fecha.

## SecurityEvent

Auditoría minimizada de eventos de seguridad.

| Campo | Tipo | Reglas |
|---|---|---|
| `eventType` | String | Registro, OTP, SSO, KYC, credenciales o rate limit. |
| `outcome` | enum | `success`, `failure`, `blocked`. |
| `userId` | String/null | FK opcional. |
| `requestId` | String/null | Correlación. |
| `metadata` | Json/null | Allowlist; sin password, OTP, documentos, tokens ni payload completo de proveedor. |
| `createdAt` | DateTime | Timestamptz e índice temporal. |

## Estados y capacidades

- `emailVerified` y `phoneVerified` derivan de `VerificationState`.
- `identity_verified` deriva exclusivamente de `IdentityVerification.status` y webhook verificado.
- Una función central de capacidades evalúa `accountStatus`, verificaciones, rol y reglas operativas para publicar, solicitar reservas, reservar instantáneamente o usar seguro.
- Ningún badge recibido del cliente concede permisos.
