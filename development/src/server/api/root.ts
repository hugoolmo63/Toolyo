import { createTRPCRouter } from "./trpc";
import { categoryRouter } from "./routers/category.router";
import { authRouter } from "./routers/auth.router";
import { searchRouter } from "./routers/search.router";
import { listingRouter } from "./routers/listing.router";
import { listingManagementRouter } from "./routers/listing-management.router";
import { userProfileRouter } from "./routers/user-profile.router";
import { bookingRouter } from "./routers/booking.router";
import { messagingRouter } from "./routers/messaging.router";
import { reviewRouter } from "./routers/review.router";
import { adminRouter } from "./routers/admin.router";

/**
 * App router tRPC: merge de routers por dominio (BACKEND.md §2.1).
 * Añadir aquí cada nuevo router.
 */
export const appRouter = createTRPCRouter({
  category: categoryRouter,
  auth: authRouter,
  search: searchRouter,
  listing: listingRouter,
  listingManagement: listingManagementRouter,
  userProfile: userProfileRouter,
  booking: bookingRouter,
  messaging: messagingRouter,
  reviews: reviewRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;