"use client";

import { api } from "@/lib/trpc-react";

/**
 * Hook compartido de estado de sesión (007-login-contextual, FR-012).
 * Wrapper único sobre `auth.getSession`: todos los consumidores comparten la
 * misma query key y opciones, evitando consultas duplicadas o contradictorias.
 * `session` es `undefined` mientras carga y `null` si no hay sesión válida.
 */
export function useSession() {
  const { data: session, isLoading } = api.auth.getSession.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  return {
    session,
    isLoading,
    isAuthenticated: session != null,
  };
}
