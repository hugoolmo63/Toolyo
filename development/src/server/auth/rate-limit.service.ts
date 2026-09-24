type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  current.count += 1;
  return { allowed: current.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export function resetRateLimits(): void {
  buckets.clear();
}

export function consumeTotpRateLimit(userId: string, now = Date.now()) {
  return consumeRateLimit(`totp:${userId}`, 5, 60_000, now);
}
