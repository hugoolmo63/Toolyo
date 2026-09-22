import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { findPublicUserProfileRecord } from "@/features/users/infrastructure/public-user-profile.repository";

describe("public user profile repository", () => {
  it("uses an explicit public projection when PostgreSQL is available", async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      return;
    }
    const user = await prisma.user.findFirst({ where: { accountStatus: "active", deletedAt: null }, select: { id: true } });
    if (!user) return;
    const result = await findPublicUserProfileRecord(prisma, user.id);
    expect(result).not.toHaveProperty("emailNormalized");
    expect(result).not.toHaveProperty("sessions");
  });
});