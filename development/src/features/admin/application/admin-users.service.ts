import type { PrismaClient, AccountStatus, UserRole } from "@prisma/client";
import { NotFoundError } from "@/server/lib/errors/domain-errors";
import { toAdminUserProjection } from "./admin-projections";
import { getAdminUser, listAdminUsers, setUserAccountStatus } from "../infrastructure/admin-users.repository";

export async function listUsers(db: PrismaClient, input: { cursor?: string; limit: number; query?: string; role?: UserRole; accountStatus?: AccountStatus }) {
  const result = await listAdminUsers(db, input);
  return { ...result, items: result.items.map((item) => ({ ...toAdminUserProjection(item), kycStatus: item.identityVerifications[0]?.status ?? "not_started" })) };
}

export async function getUser(db: PrismaClient, userId: string) {
  const user = await getAdminUser(db, userId);
  if (!user) throw new NotFoundError("Usuario no encontrado");
  return { ...toAdminUserProjection(user), kyc: user.identityVerifications[0] ?? null };
}

export async function suspendUser(db: PrismaClient, userId: string) { return setUserAccountStatus(db, userId, "suspended"); }
export async function reactivateUser(db: PrismaClient, userId: string) { return setUserAccountStatus(db, userId, "active"); }