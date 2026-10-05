import { z } from "zod";

export const RegisterDeviceSchema = z.object({
  platform: z.enum(["android", "ios"]),
  token: z.string().min(1).max(512),
  deviceId: z.string().min(1).max(191).optional(),
  appVersion: z.string().max(40).optional(),
  osVersion: z.string().max(40).optional(),
  locale: z.string().max(20).optional(),
});

export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

export const RevokeDeviceSchema = z.object({
  deviceId: z.string().min(1).max(191),
});

export type RevokeDeviceInput = z.infer<typeof RevokeDeviceSchema>;
