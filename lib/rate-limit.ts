// In-memory rate limiting — works for single-instance deployments.
// For horizontal scaling (multiple server instances), replace rateLimitStore
// with a shared Redis client using INCR + EXPIRE commands.
export const RATE_LIMIT_MAX = 100;
const WINDOW_MS = 60_000; // 1 minute sliding window

interface Entry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export const rateLimitStore = new Map<string, Entry>();

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW_MS };
  }

  entry.count++;
  rateLimitStore.set(ip, entry);

  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining,
    resetTime: entry.resetTime,
    limit: RATE_LIMIT_MAX,
  };
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
