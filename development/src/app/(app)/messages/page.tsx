import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerApi } from "@/lib/server-api";
import { StartConversation } from "@/features/messaging/presentation/start-conversation";

/**
 * Bandeja de mensajes — Server Component (007-modulo-mensajeria).
 * - `?listing=<slug>`: resuelve el listing y delega en StartConversation,
 *   que crea/reutiliza la conversación y redirige al chat.
 * - Sin parámetros: lista las conversaciones del usuario.
 */
interface MessagesPageProps {
  searchParams: { listing?: string };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const api = await createServerApi();
  const session = await api.auth.getSession();
  if (!session) {
    const callback = searchParams.listing ? `/messages?listing=${searchParams.listing}` : "/messages";
    redirect(`/auth?tab=login&callback=${encodeURIComponent(callback)}`);
  }

  if (searchParams.listing) {
    const listing = await api.listing.getBySlug({ slug: searchParams.listing }).catch(() => null);
    if (!listing) notFound();
    return <StartConversation listingId={listing.id} />;
  }

  const conversations = await api.messaging.listConversations({ limit: 20 });

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Mensajes</h1>
      </div>

      {conversations.length === 0 ? (
        <section className="dashboard-section">
          <p className="empty-state-message">
            No tienes conversaciones. Contacta con un arrendador desde la ficha de un producto.
          </p>
          <Link href="/" className="dashboard-link">
            Buscar productos →
          </Link>
        </section>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link href={`/messages/${conversation.id}`} className="conversation-item">
                <div className="conversation-item-main">
                  <strong className="conversation-item-name">
                    {conversation.otherParticipant?.displayName ?? "Usuario"}
                  </strong>
                  {conversation.listing && (
                    <span className="conversation-item-listing">{conversation.listing.title}</span>
                  )}
                  {conversation.lastMessage && (
                    <span className="conversation-item-preview">
                      {conversation.lastMessage.body ?? "Imagen adjunta"}
                    </span>
                  )}
                </div>
                <div className="conversation-item-meta">
                  {conversation.lastMessage && (
                    <time dateTime={conversation.lastMessage.createdAt}>
                      {new Date(conversation.lastMessage.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </time>
                  )}
                  {conversation.hasUnread && (
                    <span className="conversation-item-unread" aria-label="Mensajes sin leer" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
