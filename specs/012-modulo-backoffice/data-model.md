# Data Model: Módulo Administrativo (Backoffice)

**Fuente actual**: `development/prisma/schema.prisma`  
**Nota**: Define el diseño de la migración; no modifica el schema por sí mismo.

## 1. Roles administrativos

El modelo actual tiene `UserRole { user admin }`. La migración debe introducir los roles confirmados sin aceptar valores enviados por el cliente:

```prisma
enum UserRole {
  user
  ADMIN
  MODERATOR
}
```

El valor legacy `admin` se mapea a `ADMIN` (o se conserva temporalmente durante una migración en dos pasos). Sesión, middleware y tRPC usan un tipo canónico.

| Área | ADMIN | MODERATOR |
|---|---:|---:|
| Setup/gestión de su TOTP | Sí | Sí |
| Entrada `/admin` | Sí | Sí |
| Usuarios y KYC | Sí | Lectura no restringida solo si se concede |
| Resolver KYC | Sí | No en MVP |
| Reportes de reviews | Sí | Sí |
| Auditoría | Sí | No por defecto |
| Cambiar roles | Sí, con reautenticación | No |

## 2. Extensión TOTP de `User`

Se recomienda una relación 1:1 para aislar campos sensibles:

```prisma
model User {
  // campos existentes...
  role            UserRole          @default(user)
  totpCredential  TotpCredential?
  adminAuditLogs  AdminAuditLog[]   @relation("AdminAuditActor")
  kycReviews      IdentityVerification[] @relation("KycReviewer")
}

model TotpCredential {
  id                String    @id @default(cuid())
  userId            String    @unique
  secretCiphertext  String    @db.Text // sensitive: encrypted at field level
  keyVersion        String    @db.VarChar(64)
  isEnabled         Boolean   @default(false)
  setupStartedAt    DateTime? @db.Timestamptz(6)
  enabledAt         DateTime? @db.Timestamptz(6)
  lastUsedAt        DateTime? @db.Timestamptz(6)
  failedAttempts    Int       @default(0)
  lockedUntil       DateTime? @db.Timestamptz(6)
  createdAt         DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @db.Timestamptz(6)
  user              User      @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```

La URI/QR de setup es temporal y no se persiste como secreto claro. Si se requiere challenge, usar entidad temporal con expiración y referencia no reversible; no almacenar códigos reutilizables.

## 3. Solicitudes KYC

El modelo existente `IdentityVerification` ya representa la solicitud externa. Añadir campos administrativos mínimos:

```prisma
model IdentityVerification {
  id                String                     @id @default(cuid())
  userId            String
  provider          String
  providerReference String                     @unique
  status            IdentityVerificationStatus @default(not_started)
  resultCode        String?
  termsVersion      String
  startedAt         DateTime?                  @db.Timestamptz(6)
  completedAt       DateTime?                  @db.Timestamptz(6)
  reviewedById      String?
  reviewedAt        DateTime?                  @db.Timestamptz(6)
  reviewReason      String?                    @db.Text
  createdAt         DateTime                   @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime                   @updatedAt @db.Timestamptz(6)
  user              User                       @relation(fields: [userId], references: [id], onDelete: Restrict)
  reviewedBy        User?                      @relation("KycReviewer", fields: [reviewedById], references: [id], onDelete: Restrict)

  @@index([status, createdAt])
  @@index([userId, status, createdAt])
  @@index([reviewedById, reviewedAt])
}
```

Transiciones administrativas: `pending → verified`, `pending → rejected` o `pending → retry_required`; estados terminales requieren un nuevo intento. Documentos KYC quedan fuera de respuestas por defecto y se sirven solo con autorización mínima.

## 4. `AdminAuditLog` inmutable

```prisma
enum AdminAuditOutcome {
  success
  denied
  validation_error
  failure
}

model AdminAuditLog {
  id            String             @id @default(cuid())
  actorId       String?
  actorRole     UserRole?
  procedure     String             @db.VarChar(160)
  action        String             @db.VarChar(120)
  resourceType  String?            @db.VarChar(80)
  resourceId    String?            @db.VarChar(128)
  outcome       AdminAuditOutcome
  reason        String?            @db.Text
  requestId     String?            @db.VarChar(128)
  clientIp      String?            @db.VarChar(64)
  userAgent     String?            @db.VarChar(512)
  metadata      Json?
  createdAt     DateTime           @default(now()) @db.Timestamptz(6)
  actor         User?              @relation("AdminAuditActor", fields: [actorId], references: [id], onDelete: Restrict)

  @@index([actorId, createdAt])
  @@index([procedure, outcome, createdAt])
  @@index([resourceType, resourceId, createdAt])
  @@index([createdAt])
}
```

**Inmutabilidad**: no exponer `update`/`delete`; usar permisos de DB de insert/consulta sin modificación/borrado por el rol de aplicación; `metadata` no contiene secretos, hashes, documentos KYC ni contenido completo de reviews. Retención/purga se define con Security/Legal.

**Rollback obligatorio**: una mutación administrativa que cambie estado de KYC, review o cualquier recurso auditado MUST ejecutarse en la misma transacción que la inserción de su `AdminAuditLog` de éxito. Si la inserción del log falla, la transacción completa debe revertirse y la mutación debe responder con `AUDIT_WRITE_FAILED`; nunca se confirma el cambio de negocio sin su registro obligatorio. Los eventos de denegación o fallo previos a una mutación se registran por el middleware sin exponer datos sensibles y no crean un estado de negocio parcial.

## 5. Relaciones

| Entidad | Relación | Regla |
|---|---|---|
| `User` | `1—0..1 TotpCredential` | Se accede solo desde servicio privilegiado. |
| `User` | `1—N IdentityVerification` | Reintentos permitidos; una transición válida por operación. |
| `User` | `1—N AdminAuditLog` | Actor opcional para fallos sin sesión; no borrar actor histórico. |
| `Review` | `1—N ReviewReport` | Se reutilizan estados/constraints del Módulo 006. |
| `ReviewReport` | `resolvedById → User` | Moderador y decisión trazables. |

## 6. Constraints y transacciones

- Inputs tRPC validan `cuid`, enums, longitudes y estados con Zod.
- Setup no habilita acceso antes de una verificación correcta; los reintentos usan rate limit y `lockedUntil`.
- KYC/review filtran por rol y recurso; no confían en `actorId` del cliente.
- Decisión KYC/review + auditoría de éxito se ejecutan en una transacción; conflictos devuelven `CONFLICT` sin parcialidad.
- Si falla `AdminAuditLog`, hacer rollback de la mutación administrativa y devolver `AUDIT_WRITE_FAILED`.
- Consultas administrativas usan cursor pagination y orden estable `createdAt,id`.
- Migraciones incrementales y revisables; no borrar usuarios, verificaciones, reviews ni reportes existentes.