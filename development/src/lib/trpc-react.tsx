import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

/**
 * Cliente tRPC (React Query) para Client Components (FRONTEND.md §6.1).
 * Consume `AppRouter` inferido; nunca re-declarar contratos.
 */
export const api = createTRPCReact<AppRouter>();