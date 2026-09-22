type PresenceEntry = { socketIds: Set<string>; lastSeenAt: number };

const presence = new Map<string, PresenceEntry>();

export function markSocketActive(userId: string, conversationId: string, socketId: string): void {
  const key = `${userId}:${conversationId}`;
  const entry = presence.get(key) ?? { socketIds: new Set<string>(), lastSeenAt: Date.now() };
  entry.socketIds.add(socketId);
  entry.lastSeenAt = Date.now();
  presence.set(key, entry);
}

export function markSocketInactive(userId: string, conversationId: string, socketId: string): void {
  const key = `${userId}:${conversationId}`;
  const entry = presence.get(key);
  if (!entry) return;
  entry.socketIds.delete(socketId);
  entry.lastSeenAt = Date.now();
  if (entry.socketIds.size === 0) presence.delete(key);
}

export function isUserActiveInConversation(userId: string, conversationId: string): boolean {
  return (presence.get(`${userId}:${conversationId}`)?.socketIds.size ?? 0) > 0;
}

export function resetPresence(): void {
  presence.clear();
}
