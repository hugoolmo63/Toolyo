import { TRPCError } from "@trpc/server";
import { createTRPCRouter, authedProcedure } from "../trpc";
import {
  CreateListingManagementSchema,
  ListMineSchema,
  ListingIdSchema,
  PublishListingSchema,
  RemoveListingSchema,
  UpdateListingManagementSchema,
} from "@/lib/validations/listing-management";
import {
  create,
  getMine,
  listMine,
  publish,
  remove,
  update,
} from "@/features/listing-management/application/listing-management.service";
import { consumeRateLimit } from "@/server/auth/rate-limit.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { env } from "@/env.mjs";

function enforceRateLimit(userId: string) {
  const result = consumeRateLimit(`listing-management:user:${userId}`, env.SEARCH_RATE_LIMIT_PER_MIN, 60_000);
  if (!result.allowed) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas peticiones. Inténtalo de nuevo más tarde." });
  }
}

export const listingManagementRouter = createTRPCRouter({
  listMine: authedProcedure.input(ListMineSchema).query(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await listMine(ctx.prisma, ctx.session.userId, input);
    } catch (error) {
      logger.error("listingManagement.listMine", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),

  getMine: authedProcedure.input(ListingIdSchema).query(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await getMine(ctx.prisma, ctx.session.userId, input.listingId);
    } catch (error) {
      logger.error("listingManagement.getMine", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),

  create: authedProcedure.input(CreateListingManagementSchema).mutation(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await create(ctx.prisma, ctx.session.userId, input);
    } catch (error) {
      logger.error("listingManagement.create", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),

  update: authedProcedure.input(UpdateListingManagementSchema).mutation(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await update(ctx.prisma, ctx.session.userId, input);
    } catch (error) {
      logger.error("listingManagement.update", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),

  publish: authedProcedure.input(PublishListingSchema).mutation(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await publish(ctx.prisma, ctx.session.userId, input.listingId);
    } catch (error) {
      logger.error("listingManagement.publish", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),

  remove: authedProcedure.input(RemoveListingSchema).mutation(async ({ ctx, input }) => {
    enforceRateLimit(ctx.session.userId);
    try {
      return await remove(ctx.prisma, ctx.session.userId, input);
    } catch (error) {
      logger.error("listingManagement.remove", { error, userId: ctx.session.userId });
      throw mapErrorToTRPC(error);
    }
  }),
});
