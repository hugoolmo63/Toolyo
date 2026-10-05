import type { PrismaClient } from "@prisma/client";
import { ForbiddenError } from "@/server/lib/errors/domain-errors";
import type { RegisterDeviceInput, RevokeDeviceInput } from "../shared/mobile.schema";

/**
 * Registra (o reactiva) el token de un dispositivo para el usuario autenticado.
 * Idempotente por `(userId, deviceId, platform)`; el `userId` siempre procede de la sesión.
 */
export async function registerDevice(
  db: PrismaClient,
  userId: string,
  input: RegisterDeviceInput,
) {
  const now = new Date();
  const existing = input.deviceId
    ? await db.devicePushToken.findUnique({
        where: {
          userId_deviceId_platform: {
            userId,
            deviceId: input.deviceId,
            platform: input.platform,
          },
        },
        select: { id: true },
      })
    : null;

  const data = {
    token: input.token,
    deviceId: input.deviceId ?? null,
    appVersion: input.appVersion ?? null,
    osVersion: input.osVersion ?? null,
    locale: input.locale ?? null,
    notificationsEnabled: true,
    revokedAt: null,
    lastSeenAt: now,
  };

  const device = existing
    ? await db.devicePushToken.update({ where: { id: existing.id }, data })
    : await db.devicePushToken.upsert({
        where: { token: input.token },
        create: { userId, platform: input.platform, ...data },
        update: { userId, platform: input.platform, ...data },
      });

  return {
    id: device.id,
    platform: device.platform,
    notificationsEnabled: device.notificationsEnabled,
  };
}

/**
 * Revoca el token de un dispositivo del usuario autenticado. No filtra la
 * existencia de dispositivos ajenos: devuelve el mismo error genérico.
 */
export async function revokeDevice(
  db: PrismaClient,
  userId: string,
  input: RevokeDeviceInput,
) {
  const existing = await db.devicePushToken.findFirst({
    where: { userId, deviceId: input.deviceId },
    orderBy: { createdAt: "desc" },
    select: { id: true, revokedAt: true },
  });

  if (!existing) {
    throw new ForbiddenError("No autorizado para revocar este dispositivo.");
  }

  if (existing.revokedAt) {
    return { id: existing.id, revokedAt: existing.revokedAt.toISOString() };
  }

  const updated = await db.devicePushToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), notificationsEnabled: false },
  });

  return { id: updated.id, revokedAt: (updated.revokedAt ?? new Date()).toISOString() };
}
