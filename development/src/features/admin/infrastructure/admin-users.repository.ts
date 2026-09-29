import type { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

export async function listAdminUsers(db: PrismaClient, input: { cursor?: string; limit: number; query?: string; role?: UserRole; accountStatus?: AccountStatus }) {
  const where = { deletedAt: null, ...(input.role ? { role: input.role } : {}), ...(input.accountStatus ? { accountStatus: input.accountStatus } : {}), ...(input.query ? { OR: [{ emailNormalized: { contains: input.query, mode: "insensitive" as const } }, { displayName: { contains: input.query, mode: "insensitive" as const } }] } : {}) };
  const rows = await db.user.findMany({ where, take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, emailNormalized: true, displayName: true, accountStatus: true, role: true, createdAt: true, identityVerifications: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } } });
  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
}

export async function getAdminUser(db: PrismaClient, userId: string) {
  return db.user.findUnique({ where: { id: userId, deletedAt: null }, select: { id: true, emailNormalized: true, displayName: true, accountStatus: true, role: true, createdAt: true, identityVerifications: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, reviewedAt: true, reviewReason: true } } } });
}

export async function setUserAccountStatus(db: PrismaClient, userId: string, accountStatus: AccountStatus) {
  return db.user.update({ where: { id: userId, deletedAt: null }, data: { accountStatus }, select: { id: true, accountStatus: true } });
}