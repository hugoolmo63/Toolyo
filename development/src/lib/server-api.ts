import { prisma } from "@/server/db/client";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from "next/headers";

/**
 * Helper para llamadas tRPC desde Server Components (RSC, FRONTEND.md §6.1).
 * Permite `await api.category.list()` sin levantar un provider de cliente.
 * Pasa los headers del request para que el contexto pueda leer la cookie de sesión (003-login).
 */
export async function createServerApi() {
  const headerList = headers();
  const request = new Request("http://localhost/api/trpc", {
    headers: { cookie: headerList.get("cookie") ?? "" },
  });
  const ctx = await createTRPCContext({ prisma, request });
  const caller = appRouter.createCaller(ctx);
  return caller;
}
