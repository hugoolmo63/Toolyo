import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, adminProcedure, authedProcedure, publicProcedure } from "../trpc";
import { createSession } from "@/server/auth/session.service";
import { consumePending2faChallenge, restorePending2faChallenge } from "@/server/auth/admin-2fa-challenge.service";
import { confirmTotpSetup, startTotpSetup, verifyStoredTotp } from "@/features/admin/application/totp.service";
import { totpConfirmSchema, totpRevokeSchema, totpSetupSchema, totpVerifySchema } from "@/features/admin/shared/admin.schema";
import { serializeSessionCookie } from "@/lib/auth";
import { userListSchema, kycListSchema, kycResolveSchema, userSuspendSchema, reviewReportAdminListSchema, reviewReportResolveSchema, auditAdminListSchema } from "@/features/admin/shared/admin.schema";
import { getUser, listUsers, suspendUser, reactivateUser } from "@/features/admin/application/admin-users.service";
import { getKycDetails, listKyc, reviewKyc } from "@/features/admin/application/admin-kyc.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { listAdminReviewReports, resolveAdminReviewReport } from "@/features/admin/application/admin-review.service";
import { listAdminAuditLogs } from "@/features/admin/application/admin-audit.service";

export const adminRouter = createTRPCRouter({
  getAccess: authedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.userId }, select: { role: true, totpCredential: { select: { isEnabled: true } } } });
    return { isAdminAreaEnabled: user.role === "ADMIN" || user.role === "MODERATOR", role: user.role === "ADMIN" || user.role === "MODERATOR" ? user.role : null, totp: { isEnabled: user.totpCredential?.isEnabled ?? false, setupRequired: !(user.totpCredential?.isEnabled ?? false) }, permissions: user.role === "ADMIN" ? ["admin:read", "admin:write", "audit:read"] : ["reviews:moderate"] };
  }),
  startTotpSetup: adminProcedure.input(totpSetupSchema).mutation(async ({ ctx }) => { try { return await startTotpSetup(ctx.prisma, ctx.session.userId); } catch (error) { throw mapErrorToTRPC(error); } }),
  confirmTotpSetup: adminProcedure.input(totpConfirmSchema).mutation(async ({ ctx, input }) => { try { return await confirmTotpSetup(ctx.prisma, ctx.session.userId, input.setupId, input.code); } catch (error) { throw mapErrorToTRPC(error); } }),
  verifyTotp: publicProcedure.input(totpVerifySchema).mutation(async ({ ctx, input }) => {
    const challenge = consumePending2faChallenge(input.challengeId);
    if (!challenge) throw new TRPCError({ code: "UNAUTHORIZED", message: "El challenge 2FA ha expirado" });
    try {
      await verifyStoredTotp(ctx.prisma, challenge.userId, input.code);
      const session = await createSession(ctx.prisma, challenge);
      ctx.setCookie(serializeSessionCookie(session.token, session.ttlSeconds));
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: challenge.userId }, select: { role: true } });
      return { authenticated: true as const, sessionState: "AUTHENTICATED" as const, role: user.role, redirectTo: "/admin" };
    } catch (error) { restorePending2faChallenge(input.challengeId, challenge); throw mapErrorToTRPC(error); }
  }),
  revokeTotp: adminProcedure.input(totpRevokeSchema).mutation(async ({ ctx, input }) => {
    const userId = input.userId ?? ctx.session.userId;
    if (userId !== ctx.session.userId && ctx.session.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
    await ctx.prisma.totpCredential.updateMany({ where: { userId }, data: { isEnabled: false, secretCiphertext: "revoked", lockedUntil: null } });
    return { revoked: true as const, userId };
  }),
  listUsers: adminProcedure.input(userListSchema).query(async ({ ctx, input }) => { try { return await listUsers(ctx.prisma, input); } catch (error) { throw mapErrorToTRPC(error); } }),
  getUser: adminProcedure.input(userSuspendSchema.pick({ userId: true })).query(async ({ ctx, input }) => { try { return await getUser(ctx.prisma, input.userId); } catch (error) { throw mapErrorToTRPC(error); } }),
  listKyc: adminProcedure.input(kycListSchema).query(async ({ ctx, input }) => { try { return await listKyc(ctx.prisma, input); } catch (error) { throw mapErrorToTRPC(error); } }),
  getKyc: adminProcedure.input(z.object({ verificationId: z.string().cuid() })).query(async ({ ctx, input }) => { try { return await getKycDetails(ctx.prisma, input.verificationId); } catch (error) { throw mapErrorToTRPC(error); } }),
  getUserKycDetails: adminProcedure.input(z.object({ verificationId: z.string().cuid() })).query(async ({ ctx, input }) => { try { return await getKycDetails(ctx.prisma, input.verificationId); } catch (error) { throw mapErrorToTRPC(error); } }),
  reviewKyc: adminProcedure.input(kycResolveSchema).mutation(async ({ ctx, input }) => { try { return await reviewKyc(ctx.prisma, ctx.session.userId, input); } catch (error) { throw mapErrorToTRPC(error); } }),
  resolveKyc: adminProcedure.input(kycResolveSchema).mutation(async ({ ctx, input }) => { try { return await reviewKyc(ctx.prisma, ctx.session.userId, input); } catch (error) { throw mapErrorToTRPC(error); } }),
  suspendUser: adminProcedure.input(userSuspendSchema).mutation(async ({ ctx, input }) => { try { return await suspendUser(ctx.prisma, input.userId); } catch (error) { throw mapErrorToTRPC(error); } }),
  reactivateUser: adminProcedure.input(userSuspendSchema.pick({ userId: true })).mutation(async ({ ctx, input }) => { try { return await reactivateUser(ctx.prisma, input.userId); } catch (error) { throw mapErrorToTRPC(error); } }),
  listReviewReports: adminProcedure.input(reviewReportAdminListSchema).query(async ({ ctx, input }) => { try { return await listAdminReviewReports(ctx.prisma, input); } catch (error) { throw mapErrorToTRPC(error); } }),
  resolveReviewReport: adminProcedure.input(reviewReportResolveSchema).mutation(async ({ ctx, input }) => { try { return await resolveAdminReviewReport(ctx.prisma, ctx.session.userId, ctx.session.role as "ADMIN" | "MODERATOR", input); } catch (error) { throw mapErrorToTRPC(error); } }),
  listAuditLogs: adminProcedure.input(auditAdminListSchema).query(async ({ ctx, input }) => { if (ctx.session.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" }); return listAdminAuditLogs(ctx.prisma, input); }),
});