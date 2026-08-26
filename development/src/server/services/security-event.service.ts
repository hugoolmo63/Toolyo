import type { PrismaClient, SecurityEventOutcome } from "@prisma/client";

const SAFE_KEYS = new Set(["channel", "purpose", "provider", "resultCode", "reason", "retryAfterSeconds"]);

export function redactSecurityMetadata(metadata: Record<string, unknown>): Record<string, string | number | boolean> {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => SAFE_KEYS.has(key) && ["string", "number", "boolean"].includes(typeof value))) as Record<string, string | number | boolean>;
}

export async function recordSecurityEvent(prisma: PrismaClient, input: { eventType: string; outcome: SecurityEventOutcome; userId?: string; requestId?: string; metadata?: Record<string, unknown> }) {
  return prisma.securityEvent.create({ data: { eventType: input.eventType, outcome: input.outcome, userId: input.userId, requestId: input.requestId, metadata: input.metadata ? redactSecurityMetadata(input.metadata) : undefined } });
}
