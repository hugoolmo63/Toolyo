import { createTRPCRouter } from "./trpc";
import { categoryRouter } from "./routers/category.router";

/**
 * App router tRPC: merge de routers por dominio (BACKEND.md §2.1).
 * Añadir aquí cada nuevo router.
 */
export const appRouter = createTRPCRouter({
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;