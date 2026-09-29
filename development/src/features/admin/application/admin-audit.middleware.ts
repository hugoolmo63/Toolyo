import type { PrismaClient, UserRole } from "@prisma/client";
import { writeAdminAudit } from "./admin-audit.service";

export async function auditAdminMutation<T>(db: PrismaClient, input: { actorId: string; actorRole: UserRole; procedure: string; action: string; resourceType?: string; resourceId?: string; reason?: string }, mutation: (tx: PrismaClient) => Promise<T>) {
  return db.$transaction(async (tx) => {
    const result = await mutation(tx as unknown as PrismaClient);
    await writeAdminAudit(tx, { ...input, outcome: "success" });
    return result;
  });
}