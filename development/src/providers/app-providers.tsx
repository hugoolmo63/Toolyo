"use client";

import { api } from "@/lib/trpc-react";
import { createApiClient } from "@/lib/trpc-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { AuthDialogProvider } from "./auth-dialog-provider";
import { useNativeShell } from "../components/native/native-shell-provider";
import { PushRegistration } from "../components/native/push-registration";

/**
 * Compose de contextos de cliente (FRONTEND.md §2.1).
 * Aquí se agregan los providers globales de cliente (React Query, etc.).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const { effectiveEndpoint } = useNativeShell();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );
  const trpcClient = useMemo(() => createApiClient(effectiveEndpoint), [effectiveEndpoint]);

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <AuthDialogProvider>
          <PushRegistration />
          {children}
        </AuthDialogProvider>
      </api.Provider>
    </QueryClientProvider>
  );
}
