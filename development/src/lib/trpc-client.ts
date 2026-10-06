import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";

/**
 * Proxy tRPC para llamadas desde el navegador (mutaciones desde Client Components).
 * En el shell nativo, el endpoint apunta al servidor API configurado por el usuario.
 */
export const createApiClient = (endpoint = "") =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: endpoint ? `${endpoint.replace(/\/+$/, "")}/api/trpc` : "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
