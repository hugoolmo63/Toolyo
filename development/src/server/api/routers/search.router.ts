import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  SearchQuerySchema,
  SearchInitialSchema,
  SuggestSchema,
  MapBoundsQuerySchema,
  SearchMapResultsSchema,
} from "@/lib/validations/search";
import {
  searchInitial,
  searchQuery,
  searchMapResults,
  searchSuggest,
  searchMapBounds,
} from "@/features/search/application/search.service";
import { consumeRateLimit } from "@/server/auth/rate-limit.service";
import { mapErrorToTRPC } from "@/server/lib/errors/map-error";
import { logger } from "@/server/lib/logger";
import { env } from "@/env.mjs";

/**
 * Router tRPC del dominio Search (004-public-search).
 * Todos los procedimientos son públicos (publicProcedure): no requieren sesión.
 * Ver contracts/search.md.
 */
export const searchRouter = createTRPCRouter({
  initial: publicProcedure.input(SearchInitialSchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `search:ip:${ip}`,
      env.SEARCH_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas búsquedas. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("search.initial", { limit: input.limit });
    try {
      return await searchInitial(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  query: publicProcedure.input(SearchQuerySchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `search:ip:${ip}`,
      env.SEARCH_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas búsquedas. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("search.query", {
      hasQuery: !!input.query,
      hasLocation: !!input.location,
      categoryId: input.categoryId,
      sortBy: input.sortBy,
    });
    try {
      return await searchQuery(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  mapResults: publicProcedure.input(SearchMapResultsSchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(`search:ip:${ip}`, env.SEARCH_RATE_LIMIT_PER_MIN, 60_000);
    if (!rateLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas búsquedas. Inténtalo de nuevo más tarde." });
    try {
      return await searchMapResults(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  suggest: publicProcedure.input(SuggestSchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `suggest:ip:${ip}`,
      env.SUGGEST_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas búsquedas. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("search.suggest", { query: input.query, type: input.type });
    try {
      return await searchSuggest(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),

  mapBounds: publicProcedure.input(MapBoundsQuerySchema).query(async ({ ctx, input }) => {
    const ip = ctx.clientIp ?? "unknown";
    const rateLimit = consumeRateLimit(
      `search:ip:${ip}`,
      env.SEARCH_RATE_LIMIT_PER_MIN,
      60_000,
    );
    if (!rateLimit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas búsquedas. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      });
    }
    logger.info("search.mapBounds", { limit: input.limit });
    try {
      return await searchMapBounds(ctx.prisma, input);
    } catch (error) {
      throw mapErrorToTRPC(error);
    }
  }),
});
