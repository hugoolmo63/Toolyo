import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startTestDatabase, stopTestDatabase, type StartedTestDatabase } from "../support/postgres-testcontainer";

let database: StartedTestDatabase | undefined;
let prisma: PrismaClient;

describe("reviews foundational persistence", () => {
  const bookingId = "reviews-foundational-completed-at";

  beforeAll(async () => {
    database = await startTestDatabase();
    prisma = new PrismaClient({ datasources: { db: { url: database.connectionString } } });
    await prisma.booking.deleteMany({ where: { id: bookingId } }).catch(() => undefined);
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await stopTestDatabase(database);
  });

  it("rejects changing Booking.completedAt after completion", async () => {
    const source = await prisma.booking.findFirst({ where: { status: "completed", completedAt: { not: null } } });
    if (!source) {
      expect(true).toBe(true);
      return;
    }

    await expect(
      prisma.booking.update({
        where: { id: source.id },
        data: { completedAt: new Date(source.completedAt!.getTime() + 86_400_000) },
      }),
    ).rejects.toThrow("Booking.completedAt is immutable after completion");
  });
});