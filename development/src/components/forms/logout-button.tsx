"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";

export function LogoutButton() {
  const router = useRouter();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess: () => {
      router.push("/auth?tab=login");
      router.refresh();
    },
  });

  return (
    <button
      type="button"
      className="auth-submit"
      style={{ minHeight: 36, fontSize: ".8rem", maxWidth: 160 }}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
