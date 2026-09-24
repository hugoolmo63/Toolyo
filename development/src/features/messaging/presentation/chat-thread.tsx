"use client";

import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/lib/trpc-react";

/**
 * ChatThread — conversación activa (007-modulo-mensajeria, CHAT-001/CHAT-002).
 * - listMessages con la primera página precargada en servidor
 * - polling corto mientras el chat está abierto
 * - sendMessage con actualización optimista y deduplicación por clientMessageId
 * - markRead al recibir mensajes del otro participante
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;
type MessageItem = RouterOutputs["messaging"]["listMessages"]["items"][number];

interface ChatThreadProps {
  conversationId: string;
  meId: string;
  initialItems: MessageItem[];
  initialCursor: string | null;
}

const HISTORY_INPUT = (conversationId: string) => ({ conversationId, limit: 50 });
const POLL_INTERVAL_MS = 4_000;

export function ChatThread({ conversationId, meId, initialItems, initialCursor }: ChatThreadProps) {
  const utils = api.useUtils();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyInput = HISTORY_INPUT(conversationId);

  const history = api.messaging.listMessages.useQuery(historyInput, {
    initialData: { items: initialItems, nextCursor: initialCursor },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  const markRead = api.messaging.markRead.useMutation();

  const sendMessage = api.messaging.sendMessage.useMutation({
    onMutate: async (input) => {
      await utils.messaging.listMessages.cancel(historyInput);
      const previous = utils.messaging.listMessages.getData(historyInput);
      const optimistic = {
        id: `optimistic-${input.clientMessageId}`,
        conversationId,
        senderId: meId,
        clientMessageId: input.clientMessageId,
        type: "text" as const,
        body: input.body ?? null,
        attachments: [],
        createdAt: new Date().toISOString(),
        sender: { id: meId, displayName: null },
      } satisfies MessageItem;
      utils.messaging.listMessages.setData(historyInput, (old) =>
        old ? { ...old, items: [optimistic, ...old.items] } : old,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.messaging.listMessages.setData(historyInput, context.previous);
      }
    },
    onSettled: () => {
      void utils.messaging.listMessages.invalidate(historyInput);
    },
  });

  const items = history.data?.items ?? [];
  const newest = items[0];

  useEffect(() => {
    if (newest && newest.senderId !== meId && !newest.id.startsWith("optimistic-")) {
      markRead.mutate({ conversationId, messageId: newest.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newest?.id, conversationId, meId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || sendMessage.isPending) return;
    sendMessage.mutate({
      conversationId,
      clientMessageId: crypto.randomUUID(),
      body: text,
      attachmentIds: [],
    });
    setBody("");
  };

  const ordered = [...items].reverse();

  return (
    <div className="chat-thread">
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Mensajes de la conversación">
        {ordered.length === 0 && (
          <p className="chat-empty">Todavía no hay mensajes. Escribe el primero para contactar.</p>
        )}
        {ordered.map((message) => {
          const mine = message.senderId === meId;
          const pending = message.id.startsWith("optimistic-");
          return (
            <div key={message.id} className={`chat-message${mine ? " is-mine" : ""}`}>
              <div className={`chat-bubble${pending ? " is-pending" : ""}`}>
                {!mine && (
                  <span className="chat-sender">{message.sender.displayName ?? "Usuario"}</span>
                )}
                <p className="chat-body">{message.body ?? "Imagen adjunta"}</p>
                <time className="chat-time" dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {pending && " · enviando…"}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-composer">
        <textarea
          className="chat-input"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje…"
          maxLength={4000}
          rows={2}
          aria-label="Escribe un mensaje"
        />
        <button
          type="button"
          className="action-btn action-btn-book chat-send"
          onClick={handleSend}
          disabled={!body.trim() || sendMessage.isPending}
        >
          Enviar
        </button>
      </div>
      {sendMessage.isError && (
        <p className="action-buttons-message" role="alert">
          No se pudo enviar el mensaje. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
