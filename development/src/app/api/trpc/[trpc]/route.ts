import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { prisma } from "@/server/db/client";

/**
 * Route handler tRPC (Next.js App Router).
 * Único endpoint HTTP del scaffold: POST /api/trpc.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ prisma }),
  });

export { handler as GET, handler as POST };