-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending', 'active', 'suspended', 'deletion_requested', 'deleted');

-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('email', 'phone', 'identity');

-- CreateEnum
CREATE TYPE "ContactVerificationStatus" AS ENUM ('pending', 'verified', 'blocked');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('registration', 'contact_verification', 'credential_change', 'recovery');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('email', 'phone');

-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('not_started', 'pending', 'verified', 'rejected', 'retry_required');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('terms', 'privacy', 'marketing', 'kyc');

-- CreateEnum
CREATE TYPE "LegalAcceptancePurpose" AS ENUM ('account_terms', 'privacy_notice', 'marketing', 'kyc');

-- CreateEnum
CREATE TYPE "SecurityEventOutcome" AS ENUM ('success', 'failure', 'blocked');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "showInNav" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "phoneE164" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "changedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PasswordCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "VerificationChannel" NOT NULL,
    "status" "ContactVerificationStatus" NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMPTZ(6),
    "lastRequestedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "VerificationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "destinationHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMPTZ(6),
    "blockedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'not_started',
    "resultCode" TEXT,
    "termsVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "effectiveAt" TIMESTAMPTZ(6) NOT NULL,
    "retiredAt" TIMESTAMPTZ(6),
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalDocumentId" TEXT NOT NULL,
    "purpose" "LegalAcceptancePurpose" NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6) NOT NULL,
    "context" JSONB,

    CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "outcome" "SecurityEventOutcome" NOT NULL,
    "userId" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_showInNav_idx" ON "Category"("showInNav");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNormalized_key" ON "User"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_userId_key" ON "PasswordCredential"("userId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "VerificationState_channel_status_idx" ON "VerificationState"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationState_userId_channel_key" ON "VerificationState"("userId", "channel");

-- CreateIndex
CREATE INDEX "OtpChallenge_userId_channel_purpose_createdAt_idx" ON "OtpChallenge"("userId", "channel", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_providerReference_key" ON "IdentityVerification"("providerReference");

-- CreateIndex
CREATE INDEX "IdentityVerification_userId_status_idx" ON "IdentityVerification"("userId", "status");

-- CreateIndex
CREATE INDEX "LegalDocument_documentType_effectiveAt_idx" ON "LegalDocument"("documentType", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_documentType_version_language_key" ON "LegalDocument"("documentType", "version", "language");

-- CreateIndex
CREATE INDEX "LegalAcceptance_userId_legalDocumentId_acceptedAt_idx" ON "LegalAcceptance"("userId", "legalDocumentId", "acceptedAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordCredential" ADD CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationState" ADD CONSTRAINT "VerificationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

