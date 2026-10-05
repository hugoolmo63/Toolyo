import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startTestDatabase, stopTestDatabase, type StartedTestDatabase } from "../support/postgres-testcontainer";
import { registerDevice, revokeDevice } from "@/features/mobile/application/device-token.service";

let database: StartedTestDatabase | undefined;
let prisma: PrismaClient;
let userId = "";

describe("device push token lifecycle", () => {
  beforeAll(async () => {
    database = await startTestDatabase();
    prisma = new PrismaClient({ datasources: { db: { url: database.connectionString } } });
    const user = await prisma.user.create({
      data: { emailNormalized: `push-${Date.now()}@toolyo.dev` },
    });
    userId = user.id;
  }, 120_000);

  afterAll(async () => {
    await prisma?.devicePushToken.deleteMany({ where: { userId } }).catch(() => undefined);
    await prisma?.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
    await prisma?.$disconnect();
    await stopTestDatabase(database);
  });

  it("registers, deduplicates by device and revokes a token", async () => {
    const first = await registerDevice(prisma, userId, {
      platform: "android",
      token: "tok-1",
      deviceId: "dev-1",
    });
    const second = await registerDevice(prisma, userId, {
      platform: "android",
      token: "tok-1b",
      deviceId: "dev-1",
    });

    expect(second.id).toBe(first.id);
    const active = await prisma.devicePushToken.findMany({
      where: { userId, revokedAt: null },
    });
    expect(active).toHaveLength(1);
    expect(active[0]?.token).toBe("tok-1b");

    const revoked = await revokeDevice(prisma, userId, { deviceId: "dev-1" });
    expect(revoked.revokedAt).toBeTruthy();

    const afterRevoke = await prisma.devicePushToken.findMany({
      where: { userId, revokedAt: null },
    });
    expect(afterRevoke).toHaveLength(0);

    // Idempotente: revocar de nuevo no falla.
    await expect(revokeDevice(prisma, userId, { deviceId: "dev-1" })).resolves.toBeTruthy();
  });
});
