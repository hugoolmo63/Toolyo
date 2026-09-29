import type { PrismaClient, IdentityVerificationStatus } from "@prisma/client";

export async function listAdminKyc(db: PrismaClient, input: { cursor?: string; limit: number; status?: IdentityVerificationStatus; userId?: string }) {
  const where = { ...(input.status ? { status: input.status } : {}), ...(input.userId ? { userId: input.userId } : {}) };
  const rows = await db.identityVerification.findMany({ where, take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, userId: true, provider: true, status: true, resultCode: true, reviewedById: true, reviewedAt: true, reviewReason: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
}

export async function getAdminKyc(db: PrismaClient, verificationId: string) {
  return db.identityVerification.findUnique({ where: { id: verificationId }, select: { id: true, userId: true, provider: true, status: true, resultCode: true, reviewedById: true, reviewedAt: true, reviewReason: true, createdAt: true, updatedAt: true } });
}