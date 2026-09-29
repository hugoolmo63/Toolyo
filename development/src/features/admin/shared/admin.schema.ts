import { z } from "zod";

export const adminRoleSchema = z.enum(["ADMIN", "MODERATOR"]);
export const sessionStateSchema = z.enum(["AUTHENTICATED", "PENDING_2FA"]);
export const cursorPaginationSchema = z.object({
  cursor: z.string().min(1).max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const totpCodeSchema = z.string().regex(/^\d{6}$/, "El código TOTP debe tener seis dígitos");
export const totpSetupSchema = z.object({ confirmation: z.string().trim().min(1).max(128) });
export const totpConfirmSchema = z.object({ setupId: z.string().min(20).max(128), code: totpCodeSchema });
export const totpVerifySchema = z.object({ challengeId: z.string().min(20).max(128), code: totpCodeSchema });
export const totpRevokeSchema = z.object({ userId: z.string().cuid().optional(), reason: z.string().trim().min(1).max(500) });

export const userListSchema = cursorPaginationSchema.extend({
  query: z.string().trim().max(160).optional(),
  accountStatus: z.enum(["pending", "active", "suspended", "deletion_requested", "deleted"]).optional(),
  role: z.enum(["user", "ADMIN", "MODERATOR"]).optional(),
});

export const kycListSchema = cursorPaginationSchema.extend({
  status: z.enum(["pending", "verified", "rejected", "retry_required"]).optional(),
  userId: z.string().cuid().optional(),
});
export const kycResolveSchema = z.object({
  verificationId: z.string().cuid(),
  decision: z.enum(["verified", "rejected", "retry_required"]),
  reason: z.string().trim().min(1).max(5000),
});
export const userSuspendSchema = z.object({ userId: z.string().cuid(), reason: z.string().trim().min(1).max(500) });

export const reviewReportListSchema = cursorPaginationSchema.extend({
  status: z.enum(["open", "resolved", "dismissed"]).optional(),
  reason: z.string().trim().max(64).optional(),
});
export const reviewReportResolveSchema = z.object({
  reportId: z.string().cuid(),
  decision: z.enum(["published", "removed"]),
  resolution: z.string().trim().min(1).max(5000),
});
export const reviewReportAdminListSchema = cursorPaginationSchema.extend({ status: z.enum(["open", "resolved", "dismissed"]).optional() });
export const auditAdminListSchema = cursorPaginationSchema.extend({ actorId: z.string().cuid().optional(), procedure: z.string().max(160).optional(), outcome: z.enum(["success", "denied", "validation_error", "failure"]).optional() });

export const auditLogListSchema = cursorPaginationSchema.extend({
  actorId: z.string().cuid().optional(),
  procedure: z.string().trim().max(160).optional(),
  outcome: z.enum(["success", "denied", "validation_error", "failure"]).optional(),
  resourceId: z.string().max(128).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type SessionState = z.infer<typeof sessionStateSchema>;