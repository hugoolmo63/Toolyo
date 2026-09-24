"use client";

import { api } from "@/lib/trpc-react";
import { createApiClient } from "@/lib/trpc-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthDialogProvider } from "./auth-dialog-provider";

/**
 * Compose de contextos del cliente (FRONTEND.md §2.1).
 * Aquí se agregan los providers globales de cliente (React Query, etc.).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );
  const [trpcClient] = useState(() => createApiClient());

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <AuthDialogProvider>{children}</AuthDialogProvider>
      </api.Provider>
    </QueryClientProvider>
  );
}