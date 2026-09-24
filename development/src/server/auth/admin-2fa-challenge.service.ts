import { randomBytes } from "node:crypto";

type PendingChallenge = { userId: string; rememberMe?: boolean; ip?: string; userAgent?: string; expiresAt: number };
const pending = new Map<string, PendingChallenge>();

export function createPending2faChallenge(input: Omit<PendingChallenge, "expiresAt">) {
  const challengeId = randomBytes(18).toString("base64url");
  pending.set(challengeId, { ...input, expiresAt: Date.now() + 5 * 60_000 });
  return { challengeId, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() };
}

export function consumePending2faChallenge(challengeId: string): PendingChallenge | null {
  const challenge = pending.get(challengeId);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    pending.delete(challengeId);
    return null;
  }
  pending.delete(challengeId);
  return challenge;
}

export function restorePending2faChallenge(challengeId: string, challenge: PendingChallenge): void {
  pending.set(challengeId, challenge);
}