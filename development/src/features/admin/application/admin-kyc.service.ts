import type { PrismaClient, IdentityVerificationStatus } from "@prisma/client";
import { ConflictError, NotFoundError, ForbiddenError } from "@/server/lib/errors/domain-errors";
import { toKycProjection } from "./admin-projections";
import { getAdminKyc, listAdminKyc } from "../infrastructure/admin-kyc.repository";
import { getEmailProvider } from "@/server/integrations/email/email.provider";

const transitions: Record<string, IdentityVerificationStatus[]> = { pending: ["verified", "rejected", "retry_required"] };

export async function listKyc(db: PrismaClient, input: { cursor?: string; limit: number; status?: IdentityVerificationStatus; userId?: string }) { const result = await listAdminKyc(db, input); return { ...result, items: result.items.map(toKycProjection) }; }
export async function getKycDetails(db: PrismaClient, verificationId: string) { const item = await getAdminKyc(db, verificationId); if (!item) throw new NotFoundError("Verificación KYC no encontrada"); return toKycProjection(item); }

export async function reviewKyc(db: PrismaClient, reviewerId: string, input: { verificationId: string; decision: IdentityVerificationStatus; reason: string }) {
  return db.$transaction(async (tx) => {
    const current = await tx.identityVerification.findUnique({ where: { id: input.verificationId } });
    if (!current) throw new NotFoundError("Verificación KYC no encontrada");
    if (!transitions[current.status]?.includes(input.decision)) throw new ConflictError("Transición KYC no válida");
    const updated = await tx.identityVerification.update({ where: { id: input.verificationId }, data: { status: input.decision, reviewedById: reviewerId, reviewedAt: new Date(), reviewReason: input.reason } });
    const user = await tx.user.findUniqueOrThrow({ where: { id: updated.userId }, select: { emailNormalized: true } });
    await getEmailProvider().sendKycDecisionNotification({ to: user.emailNormalized, decision: input.decision, reason: input.reason });
    return toKycProjection(updated);
  });
}

export function assertKycDocumentAccess(role: "ADMIN" | "MODERATOR" | "user") { if (role !== "ADMIN") throw new ForbiddenError("Los documentos KYC requieren permisos restringidos"); }