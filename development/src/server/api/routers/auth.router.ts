import { createTRPCRouter, publicProcedure } from "../trpc";
import { RegistrationSchema, RequestOtpSchema, VerifyOtpSchema } from "@/lib/validations/auth";
import { registerWithPassword, getOnboardingStatus } from "@/server/auth/auth.service";
import { requestOtp } from "@/server/auth/otp-delivery.service";
import { consumeOtpChallenge } from "@/server/auth/otp.service";
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
});
