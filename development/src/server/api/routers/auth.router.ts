import { createTRPCRouter, publicProcedure, authedProcedure } from "../trpc";
import { RegistrationSchema, RequestOtpSchema, VerifyOtpSchema, LoginSchema } from "@/lib/validations/auth";
import { registerWithPassword, getOnboardingStatus } from "@/server/auth/auth.service";
import { requestOtp } from "@/server/auth/otp-delivery.service";
import { consumeOtpChallenge } from "@/server/auth/otp.service";
import { getRegistrationLegalDocuments } from "@/server/auth/legal-acceptance.service";
import { loginWithPassword } from "@/server/auth/login.service";
import { revokeSession } from "@/server/auth/session.service";
import { recordSecurityEvent } from "@/server/services/security-event.service";
import { serializeSessionCookie, serializeClearSessionCookie, validateCallbackPath as validateCallback } from "@/lib/auth";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";

const OTP_SECRET = process.env.OTP_SECRET ?? "development-only-otp-secret";

export const authRouter = createTRPCRouter({
  registerWithPassword: publicProcedure.input(RegistrationSchema).mutation(async ({ ctx, input }) => {
    try {
      return await registerWithPassword(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  getRegistrationLegalDocuments: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getRegistrationLegalDocuments(ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  requestOtp: publicProcedure.input(RequestOtpSchema).mutation(async ({ ctx, input }) => {
    try {
      return await requestOtp(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  verifyOtp: publicProcedure.input(VerifyOtpSchema).mutation(async ({ ctx, input }) => {
    try {
      return await consumeOtpChallenge(ctx.prisma, input.challengeId, input.code, OTP_SECRET);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  getOnboardingStatus: publicProcedure.input(RegistrationSchema.pick({ email: true }).optional()).query(async ({ ctx }) => {
    if (!ctx.session) return null;
    return getOnboardingStatus(ctx.prisma, ctx.session.userId);
  }),

  loginWithPassword: publicProcedure.input(LoginSchema).mutation(async ({ ctx, input }) => {
    try {
      const { result, sessionToken, ttlSeconds } = await loginWithPassword(ctx.prisma, {
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe,
        ip: undefined,
        userAgent: undefined,
      });
      if (result.sessionState !== "PENDING_2FA") ctx.setCookie(serializeSessionCookie(sessionToken, ttlSeconds));
      return { ...result, callback: validateCallback(input.callback, result.redirectTo) };
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),


  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Idempotent: if no session, just clear cookie and return success
    if (ctx.sessionToken) {
      await revokeSession(ctx.prisma, ctx.sessionToken);
      await recordSecurityEvent(ctx.prisma, {
        eventType: "logout",
        outcome: "success",
        userId: ctx.session?.userId,
      });
    }
    // Clear the session cookie
    ctx.setCookie(serializeClearSessionCookie());
    return { success: true as const };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) return null;
    // Re-validate to get full claims
    // The context already loaded the session, but we need the full claims
    // For efficiency, we could cache this, but for now re-validate
    // Actually, the context already has userId — let's get the full claims from validateSession
    // But we don't have the token here. Let's use getOnboardingStatus instead
    return getOnboardingStatus(ctx.prisma, ctx.session.userId);
  }),
});
