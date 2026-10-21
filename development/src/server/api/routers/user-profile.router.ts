import { z } from "zod";
import { createTRPCRouter, authedProcedure, publicProcedure } from "../trpc";
import {
  getEditableProfileById,
  getPublicProfileById,
  deleteOwnAccount,
  updateProfile,
} from "@/features/users/application/user.service";
import { UpdateUserProfileSchema } from "@/features/users/shared/user-profile.schema";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { DEVELOPMENT_PROFILE_USER_ID } from "@/features/users/domain/preferred-location";
import { getPublicUserProfile } from "@/features/users/application/public-user-profile.service";
import { serializeClearSessionCookie } from "@/lib/auth";

export const userProfileRouter = createTRPCRouter({
  getPublicProjection: publicProcedure.input(z.string().cuid()).query(async ({ ctx, input }) => {
    try {
      return await getPublicUserProfile(input, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),
  getPublicById: publicProcedure.input(z.string().cuid()).query(async ({ ctx, input }) => {
    try {
      return await getPublicProfileById(input, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  getMe: authedProcedure.query(async ({ ctx }) => {
    try {
      return await getEditableProfileById(ctx.session.userId, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  getDevelopmentSeed: publicProcedure.query(async ({ ctx }) => {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Development profile fallback is disabled");
    }
    try {
      return await getEditableProfileById(DEVELOPMENT_PROFILE_USER_ID, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  update: authedProcedure.input(UpdateUserProfileSchema).mutation(async ({ ctx, input }) => {
    try {
      return await updateProfile(ctx.session.userId, input, ctx.session.userId, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  deleteAccount: authedProcedure.mutation(async ({ ctx }) => {
    try {
      await deleteOwnAccount(ctx.session.userId, ctx.prisma);
      if (ctx.sessionToken) ctx.setCookie(serializeClearSessionCookie());
      return { success: true as const };
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  updateDevelopmentSeed: publicProcedure.input(UpdateUserProfileSchema).mutation(async ({ ctx, input }) => {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Development profile fallback is disabled");
    }
    try {
      return await updateProfile(DEVELOPMENT_PROFILE_USER_ID, input, DEVELOPMENT_PROFILE_USER_ID, ctx.prisma);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),
});