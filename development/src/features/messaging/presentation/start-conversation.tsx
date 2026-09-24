"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";

/**
 * StartConversation — resuelve `?listing=` de /messages.
 * Crea (o reutiliza) la conversación con el arrendador y redirige al chat.
 */
export function StartConversation({ listingId }: { listingId: string }) {
  const router = useRouter();
  const fired = useRef(false);
  const getOrCreate = api.messaging.getOrCreateConversation.useMutation({
    onSuccess: (data) => router.replace(`/messages/${data.conversationId}`),
  });

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    getOrCreate.mutate({ listingId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  if (getOrCreate.isError) {
    return (
      <div className="page-message">
        <h1>No se pudo abrir la conversación</h1>
        <p>{getOrCreate.error.message}</p>
        <p>
          <Link href="/messages" className="dashboard-link">
            Ir a mis mensajes →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-message">
      <h1>Abriendo conversación…</h1>
      <p>Te estamos conectando con el arrendador.</p>
    </div>
  );
}
