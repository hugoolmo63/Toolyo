import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";

/**
 * Proxy tRPC para llamadas desde el navegador (mutaciones desde Client Components).
 */
export const createApiClient = () =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });