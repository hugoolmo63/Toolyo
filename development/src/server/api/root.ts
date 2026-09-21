import { createTRPCRouter } from "./trpc";
import { categoryRouter } from "./routers/category.router";
import { authRouter } from "./routers/auth.router";
import { searchRouter } from "./routers/search.router";
import { listingRouter } from "./routers/listing.router";
import { userProfileRouter } from "./routers/user-profile.router";

/**
 * App router tRPC: merge de routers por dominio (BACKEND.md §2.1).
 * Añadir aquí cada nuevo router.
 */
export const appRouter = createTRPCRouter({
  category: categoryRouter,
  auth: authRouter,
  search: searchRouter,
  listing: listingRouter,
  userProfile: userProfileRouter,
});

export type AppRouter = typeof appRouter;