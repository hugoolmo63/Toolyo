"use client";

import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { isPrivatePathname } from "@/lib/private-paths";

export function LogoutButton({ className = "btn btn-ghost btn-sm" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const utils = api.useUtils();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.getSession.invalidate();
      // En zona privada hay que salir (middleware echaría al usuario de todos
      // modos); en página pública se permanece en contexto (FR-008).
      if (isPrivatePathname(pathname)) {
        router.push("/");
      }
      router.refresh();
    },
  });

  return (
    <button
      type="button"
      className={className}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
