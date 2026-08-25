import { createTRPCRouter, publicProcedure } from "../trpc";
import { CreateCategorySchema } from "@/features/categories/shared/category.schema";
import { createCategory, listActiveCategories } from "@/features/categories/application/category.service";
import { logger } from "../../lib/logger";
import { mapErrorToTRPC } from "../../lib/errors/map-error";

/**
 * Router tRPC del dominio Category (BACKEND.md §4.2).
 * Los routers son delgados: delegan en el servicio y mapean errores de dominio.
 */
export const categoryRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    logger.info("category.list", {});
    return listActiveCategories(ctx.prisma);
  }),

  create: publicProcedure.input(CreateCategorySchema).mutation(async ({ ctx, input }) => {
    logger.info("category.create", { slug: input.slug ?? input.name });
    try {
      return await createCategory(input, ctx.prisma);
    } catch (err) {
      throw mapErrorToTRPC(err);
    }
  }),
});