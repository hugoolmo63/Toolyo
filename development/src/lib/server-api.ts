import { prisma } from "@/server/db/client";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * Helper para llamadas tRPC desde Server Components (RSC, FRONTEND.md §6.1).
 * Permite `await api.category.list()` sin levantar un provider de cliente.
 */
export async function createServerApi() {
  const ctx = createTRPCContext({ prisma });
  const caller = appRouter.createCaller(ctx);
  return caller;
}