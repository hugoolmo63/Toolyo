import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  GetBySlugSchema,
  GetSimilarSchema,
  IncrementViewSchema,
} from "@/lib/validations/listing-detail";
import {
  getListingBySlug,
  getSimilarListings,
  incrementView,
} from "@/features/listing-detail/application/listing-detail.service";
import { consumeRateLimit } from "@/server/auth/rate-limit.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { env } from "@/env.mjs";

/**
 * Router tRPC del dominio Listing Detail (005-listing-detail).
 * Todos los procedimientos son públicos (publicProcedure): no requieren sesión.
 * Ver contracts/listing-detail.md.
 */
export const listingRouter = createTRPCRouter({
  getBySlug: publicProcedure.input(GetBySlugSchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `listing:ip:${ip}`,
      env.SEARCH_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas peticiones. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("listing.getBySlug", { slug: input.slug });
    try {
      return await getListingBySlug(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  getSimilar: publicProcedure.input(GetSimilarSchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `listing:ip:${ip}`,
      env.SEARCH_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas peticiones. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("listing.getSimilar", { listingId: input.listingId, limit: input.limit });
    try {
      return await getSimilarListings(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  incrementView: publicProcedure
    .input(IncrementViewSchema)
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.clientIp ?? "unknown";
      const rateLimit = consumeRateLimit(
        `listing:ip:${ip}`,
        env.SEARCH_RATE_LIMIT_PER_MIN,
        60_000,
      );
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Demasiadas peticiones. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
        });
      }
      try {
        return await incrementView(
          ctx.prisma,
          input.listingId,
          ip,
          ctx.session?.userId ?? null,
        );
      } catch (error) {
        // El incremento de vistas no debe propagar errores al cliente
        logger.warn("listing.incrementView failed", { listingId: input.listingId });
        return { ok: true as const };
      }
    }),
});
