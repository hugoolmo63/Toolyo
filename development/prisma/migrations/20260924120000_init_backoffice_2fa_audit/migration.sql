-- Backoffice foundation: ADMIN/MODERATOR roles, TOTP credentials, KYC review metadata and append-only audit.
-- Legacy admin values are mapped to ADMIN before replacing the enum.

CREATE TYPE "UserRole_new" AS ENUM ('user', 'ADMIN', 'MODERATOR');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (CASE WHEN "role"::text = 'admin' THEN 'ADMIN'::text ELSE "role"::text END)::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

ALTER TABLE "IdentityVerification"
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMPTZ(6),
  ADD COLUMN "reviewReason" TEXT;

CREATE TABLE "TotpCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secretCiphertext" TEXT NOT NULL,
  "keyVersion" VARCHAR(64) NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "setupStartedAt" TIMESTAMPTZ(6),
  "enabledAt" TIMESTAMPTZ(6),
  "lastUsedAt" TIMESTAMPTZ(6),
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TotpCredential_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "AdminAuditOutcome" AS ENUM ('success', 'denied', 'validation_error', 'failure');
CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" "UserRole",
  "procedure" VARCHAR(160) NOT NULL,
  "action" VARCHAR(120) NOT NULL,
  "resourceType" VARCHAR(80),
  "resourceId" VARCHAR(128),
  "outcome" "AdminAuditOutcome" NOT NULL,
  "reason" TEXT,
  "requestId" VARCHAR(128),
  "clientIp" VARCHAR(64),
  "userAgent" VARCHAR(512),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TotpCredential_userId_key" ON "TotpCredential"("userId");
CREATE INDEX "IdentityVerification_status_createdAt_idx" ON "IdentityVerification"("status", "createdAt");
CREATE INDEX "IdentityVerification_reviewedById_reviewedAt_idx" ON "IdentityVerification"("reviewedById", "reviewedAt");
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");
CREATE INDEX "AdminAuditLog_procedure_outcome_createdAt_idx" ON "AdminAuditLog"("procedure", "outcome", "createdAt");
CREATE INDEX "AdminAuditLog_resourceType_resourceId_createdAt_idx" ON "AdminAuditLog"("resourceType", "resourceId", "createdAt");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TotpCredential" ADD CONSTRAINT "TotpCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Application role must receive INSERT/SELECT only through deployment-specific DBA policy.