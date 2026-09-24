import type { Prisma, PrismaClient, UserRole, AdminAuditOutcome } from "@prisma/client";

export type AuditDb = PrismaClient | Prisma.TransactionClient;
export async function writeAdminAudit(db: AuditDb, input: { actorId?: string; actorRole?: UserRole; procedure: string; action: string; resourceType?: string; resourceId?: string; outcome: AdminAuditOutcome; reason?: string; requestId?: string; clientIp?: string; userAgent?: string; metadata?: Prisma.InputJsonValue }) {
  return db.adminAuditLog.create({ data: { actorId: input.actorId, actorRole: input.actorRole, procedure: input.procedure, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome, reason: input.reason, requestId: input.requestId, clientIp: input.clientIp, userAgent: input.userAgent, metadata: input.metadata } });
}

export async function listAdminAuditLogs(db: PrismaClient, input: { cursor?: string; limit: number; actorId?: string; procedure?: string; outcome?: AdminAuditOutcome }) {
  const rows = await db.adminAuditLog.findMany({ where: { ...(input.actorId ? { actorId: input.actorId } : {}), ...(input.procedure ? { procedure: input.procedure } : {}), ...(input.outcome ? { outcome: input.outcome } : {}) }, take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, actorId: true, actorRole: true, procedure: true, action: true, resourceType: true, resourceId: true, outcome: true, reason: true, requestId: true, createdAt: true } });
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: rows.length > input.limit ? items.at(-1)?.id ?? null : null };
}