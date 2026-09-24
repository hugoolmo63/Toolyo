import type { AdminAuditLog, IdentityVerification, User } from "@prisma/client";

export function toAdminUserProjection(user: Pick<User, "id" | "emailNormalized" | "displayName" | "accountStatus" | "role" | "createdAt">) {
  return { id: user.id, email: user.emailNormalized, displayName: user.displayName, accountStatus: user.accountStatus, role: user.role, createdAt: user.createdAt };
}

export function toKycProjection(verification: Pick<IdentityVerification, "id" | "userId" | "provider" | "status" | "resultCode" | "reviewedById" | "reviewedAt" | "reviewReason" | "createdAt" | "updatedAt">) {
  return { id: verification.id, userId: verification.userId, provider: verification.provider, status: verification.status, resultCode: verification.resultCode, reviewedById: verification.reviewedById, reviewedAt: verification.reviewedAt, reviewReason: verification.reviewReason, createdAt: verification.createdAt, updatedAt: verification.updatedAt };
}

export function toAuditProjection(log: Pick<AdminAuditLog, "id" | "actorId" | "actorRole" | "procedure" | "action" | "resourceType" | "resourceId" | "outcome" | "reason" | "requestId" | "createdAt">) {
  return { id: log.id, actorId: log.actorId, actorRole: log.actorRole, procedure: log.procedure, action: log.action, resourceType: log.resourceType, resourceId: log.resourceId, outcome: log.outcome, reason: log.reason, requestId: log.requestId, createdAt: log.createdAt };
}