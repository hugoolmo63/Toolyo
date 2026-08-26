# Contract: Registro y Verificación

Los routers tRPC son delgados: validan con Zod, requieren el procedimiento adecuado y delegan en servicios. Los payloads de salida nunca contienen hashes, OTP, documentos KYC, secretos ni objetos Prisma crudos.

## Procedimientos de aplicación

### `auth.registerWithPassword`

**Acceso**: público.

**Entrada**:

```ts
{
  email: string;
  password: string; // mínimo 12 caracteres
  termsDocumentId: string;
  privacyDocumentId: string;
  marketingAccepted?: boolean;
}
```

**Salida**: `{ userId, accountStatus, emailVerificationStatus, phoneVerificationStatus }`.

**Reglas**: validar documentos vigentes; crear User, PasswordCredential, estados iniciales y aceptaciones en una transacción; respuesta genérica ante email existente; emitir evento de seguridad; iniciar envío de email después de confirmar la transacción.

### `auth.startSso`

**Acceso**: público.

**Entrada**: `{ provider: 'google' | 'apple' | 'facebook'; returnPath?: string }`.

**Reglas**: solo proveedores habilitados; Authorization Code + PKCE cuando aplique; validar `state`, `nonce`, issuer, audience, firma y expiración; scopes mínimos; no vincular por email coincidente sin sesión/reautenticación.

### `auth.completeSso`

**Acceso**: público, callback protegido por estado OAuth.

**Entrada**: `{ provider, authorizationCode, state }`.

**Salida**: sesión segura y estado de onboarding.

**Reglas**: cuenta nueva requiere aceptar documentos legales antes de completarse; emails privados o ausentes no se convierten en una identidad confirmada sin el flujo correspondiente.

### `auth.requestOtp`

**Acceso**: público para registro o autenticado para cambios de contacto.

**Entrada**: `{ channel: 'email' | 'phone'; destination: string; purpose: 'registration' | 'contact_verification' | 'credential_change' | 'recovery' }`.

**Salida**: `{ challengeId, expiresAt, retryAfterSeconds }`.

**Reglas**: respuesta no enumera cuentas; generar código criptográficamente seguro, persistir solo hash/HMAC, invalidar desafío activo previo, aplicar límites por IP/cuenta/destino y enviar mediante adaptador externo tras persistencia.

### `auth.verifyOtp`

**Acceso**: público con `challengeId`, o autenticado según propósito.

**Entrada**: `{ challengeId: string; code: string }`.

**Salida**: `{ channel, verificationStatus, attemptsRemaining }` sin revelar el código.

**Reglas**: transacción/actualización atómica exige no expirado, no consumido, no bloqueado y máximo de intentos; consumo y cambio de VerificationState en la misma transacción; registrar éxito o bloqueo sin secreto.

### `auth.startIdentityVerification`

**Acceso**: `authedProcedure`; email y teléfono deben estar verificados.

**Entrada**: `{ termsVersion: string }`.

**Salida**: `{ verificationId, providerReferenceOrRedirect, status: 'pending' }`.

**Reglas**: informar finalidad, derechos, proveedor y retención; no aceptar DNI/selfie directamente en el servidor de Toolyo salvo decisión legal; idempotencia para una solicitud activa.

### `auth.handleIdentityWebhook`

**Acceso**: route handler de proveedor, no tRPC público.

**Entrada**: payload crudo y firma del proveedor.

**Salida**: respuesta rápida tras validar firma y evento.

**Reglas**: verificar firma, persistir `providerEventId` de forma idempotente, rechazar transiciones inválidas, actualizar IdentityVerification en transacción y recalcular capacidades desde servidor.

### `auth.getOnboardingStatus`

**Acceso**: `authedProcedure`.

**Salida**: estados de cuenta, email, teléfono e identidad, capacidades resumidas y enlaces a documentos vigentes. Nunca documentos KYC, hashes o tokens.

## Adaptadores externos

- `EmailProvider.sendVerificationCode`: acepta destinatario normalizado y plantilla/version; nunca recibe ni registra secretos fuera del envío necesario.
- `SmsProvider.sendVerificationCode`: acepta número E.164 y plantilla; devuelve referencia de proveedor, no el OTP.
- `KycProvider.createSession` y `KycProvider.verifyWebhook`: contrato tipado, timeout, reintentos seguros y referencia externa.
- `OAuthProvider`: encapsula configuración y validación de cada proveedor; no expone tokens al frontend.

## Errores públicos

Usar mensajes genéricos para no enumerar cuentas o revelar antifraude. Distinguir solo lo necesario para que la persona corrija su formulario: `validation_error`, `challenge_invalid`, `challenge_expired`, `challenge_blocked`, `provider_unavailable`, `legal_acceptance_required` y `unauthorized`.
