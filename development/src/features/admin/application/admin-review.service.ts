import type { PrismaClient } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/server/lib/errors/domain-errors";
import { listReviewReports, getReviewReport } from "../infrastructure/admin-review.repository";
import { writeAdminAudit } from "./admin-audit.service";

export async function listAdminReviewReports(db: PrismaClient, input: { cursor?: string; limit: number; status?: "open" | "resolved" | "dismissed" }) { return listReviewReports(db, input); }

export async function resolveAdminReviewReport(db: PrismaClient, actorId: string, actorRole: "ADMIN" | "MODERATOR", input: { reportId: string; decision: "published" | "removed"; resolution: string }) {
  return db.$transaction(async (tx) => {
    const report = await getReviewReport(tx, input.reportId);
    if (!report || report.status !== "open") throw new ConflictError("El reporte ya fue resuelto");
    if (report.review.authorId === actorId) throw new ConflictError("No puedes moderar tu propia review");
    if (report.review.status !== "under_review") throw new ConflictError("La review no está pendiente de moderación");
    const review = await tx.review.update({ where: { id: report.reviewId }, data: { status: input.decision, deletedAt: input.decision === "removed" ? new Date() : null } });
    await tx.reviewReport.update({ where: { id: report.id }, data: { status: "resolved", resolution: input.resolution, resolvedById: actorId, resolvedAt: new Date() } });
    const audit = await writeAdminAudit(tx, { actorId, actorRole, procedure: "admin.resolveReviewReport", action: input.decision, resourceType: "ReviewReport", resourceId: report.id, outcome: "success", reason: input.resolution });
    return { reportId: report.id, reviewId: review.id, reviewStatus: review.status, auditLogId: audit.id };
  });
}