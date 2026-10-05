import { describe, expect, it } from "vitest";
import { registerDevice, revokeDevice } from "@/features/mobile/application/device-token.service";
import { ForbiddenError } from "@/server/lib/errors/domain-errors";

describe("registerDevice", () => {
  it("creates a new token when the device is unknown", async () => {
    let upserted: unknown;
    const db = {
      devicePushToken: {
        findUnique: async () => null,
        upsert: async (args: { create: { platform: string } }) => {
          upserted = args;
          return { id: "device-1", platform: args.create.platform, notificationsEnabled: true };
        },
      },
    } as never;

    const result = await registerDevice(db, "user-1", {
      platform: "android",
      token: "token-a",
      deviceId: "device-1",
    });

    expect(result).toEqual({ id: "device-1", platform: "android", notificationsEnabled: true });
    expect(upserted).toBeDefined();
  });

  it("reactivates an existing device and clears revokedAt", async () => {
    const db = {
      devicePushToken: {
        findUnique: async () => ({ id: "device-2" }),
        update: async (args: { data: { notificationsEnabled: boolean; revokedAt: null } }) => ({
          id: "device-2",
          platform: "ios",
          notificationsEnabled: args.data.notificationsEnabled,
        }),
      },
    } as never;

    const result = await registerDevice(db, "user-1", {
      platform: "ios",
      token: "token-b",
      deviceId: "device-2",
    });

    expect(result.notificationsEnabled).toBe(true);
  });
});

describe("revokeDevice", () => {
  it("does not leak the existence of another user's device", async () => {
    const db = { devicePushToken: { findFirst: async () => null } } as never;
    await expect(revokeDevice(db, "user-1", { deviceId: "foreign" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("is idempotent when the token is already revoked", async () => {
    const revokedAt = new Date("2026-10-01T00:00:00.000Z");
    const db = {
      devicePushToken: {
        findFirst: async () => ({ id: "device-3", revokedAt }),
      },
    } as never;

    const result = await revokeDevice(db, "user-1", { deviceId: "device-3" });
    expect(result).toEqual({ id: "device-3", revokedAt: revokedAt.toISOString() });
  });

  it("marks the token as revoked", async () => {
    const db = {
      devicePushToken: {
        findFirst: async () => ({ id: "device-4", revokedAt: null }),
        update: async () => ({ id: "device-4", revokedAt: new Date("2026-10-05T10:00:00.000Z") }),
      },
    } as never;

    const result = await revokeDevice(db, "user-1", { deviceId: "device-4" });
    expect(result.revokedAt).toBe("2026-10-05T10:00:00.000Z");
  });
});
