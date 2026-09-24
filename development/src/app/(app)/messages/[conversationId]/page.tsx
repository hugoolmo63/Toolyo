import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { ChatThread } from "@/features/messaging/presentation/chat-thread";

/**
 * Chat de una conversación — Server Component (007-modulo-mensajeria).
 * Precarga metadatos y la primera página del historial; ChatThread gestiona
 * el envío optimista y el polling corto mientras el chat está abierto.
 */
interface ConversationPageProps {
  params: { conversationId: string };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) {
    redirect(`/auth?tab=login&callback=${encodeURIComponent(`/messages/${params.conversationId}`)}`);
  }

  const conversation = await api.messaging
    .getConversation({ conversationId: params.conversationId })
    .catch(() => null);
  if (!conversation || !conversation.me) {
    notFound();
  }

  const history = await api.messaging.listMessages({
    conversationId: conversation.id,
    limit: 50,
  });

  return (
    <div className="dashboard-page chat-page">
      <div className="chat-header">
        <Link href="/messages" className="chat-back" aria-label="Volver a mensajes">
          ← Mensajes
        </Link>
        <div className="chat-header-info">
          <h1 className="chat-title">
            {conversation.otherParticipant?.displayName ?? "Usuario"}
          </h1>
          {conversation.listing && (
            <Link href={`/listings/${conversation.listing.slug}`} className="chat-listing-link">
              {conversation.listing.title}
            </Link>
          )}
        </div>
        {conversation.booking && (
          <span className={`chat-booking-status is-${conversation.booking.status}`}>
            Reserva: {conversation.booking.status}
          </span>
        )}
      </div>

      <ChatThread
        conversationId={conversation.id}
        meId={conversation.me.id}
        initialItems={history.items}
        initialCursor={history.nextCursor}
      />
    </div>
  );
}
