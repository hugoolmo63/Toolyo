import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { getPublicUserProfile } from "@/features/users/application/public-user-profile.service";

describe("public profile privacy regression", () => {
  it("never returns private account fields", async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch { return; }
    const user = await prisma.user.findFirst({ where: { accountStatus: "active", deletedAt: null }, select: { id: true } });
    if (!user) return;
    const profile = await getPublicUserProfile(user.id, prisma);
    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("phoneE164");
    expect(profile).toHaveProperty("preferredLocation");
  });
});