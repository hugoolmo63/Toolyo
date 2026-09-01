import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext, type TRPCContext } from "@/server/api/trpc";
import { prisma } from "@/server/db/client";

/**
 * Route handler tRPC (Next.js App Router).
 * Único endpoint HTTP del scaffold: POST /api/trpc.
 * Establece cookies de sesión via responseMeta (003-login).
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ prisma, request: req }),
    responseMeta({ ctx, errors }) {
      const context = ctx as TRPCContext | undefined;
      const headers = new Headers();
      if (context?.pendingCookies && context.pendingCookies.length > 0) {
        for (const cookie of context.pendingCookies) {
          headers.append("Set-Cookie", cookie);
        }
      }
      return { headers };
    },
  });

export { handler as GET, handler as POST };
