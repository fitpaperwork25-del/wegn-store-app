/**
 * Minimal in-memory sliding-window rate limiter - see the Phase 1 security
 * audit's L-2 finding (api/health.ts had no rate limiting on its
 * service-role-backed checks). Deliberately not a distributed limiter
 * (Redis/Upstash etc.) - that's new infrastructure this bounded hardening
 * pass isn't scoped to provision. This is "reasonable" for a low-stakes
 * health endpoint: per-instance, best-effort, resets if the serverless
 * instance recycles. It still meaningfully blunts casual abuse, since
 * Vercel's Fluid Compute reuses warm instances across requests rather than
 * spinning up a fresh one every time.
 *
 * The store and clock are both injectable so this is fully unit-testable
 * without real timers or shared module state leaking between tests.
 */

export type RateLimitStore = Map<string, number[]>;

export function createRateLimitStore(): RateLimitStore {
  return new Map();
}

export type RateLimitResult = { limited: boolean; remaining: number };

/**
 * Records one request for `key` at time `now` and reports whether the
 * caller has exceeded `maxRequests` within the trailing `windowMs`.
 * Mutates `store` in place (that's the whole point - it's the request
 * log), which is why it's passed in rather than module-global.
 */
export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  now: number,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const existing = store.get(key) ?? [];
  const withinWindow = existing.filter((timestamp) => now - timestamp < windowMs);
  withinWindow.push(now);
  store.set(key, withinWindow);

  // Unbounded growth guard: if this store has accumulated an unreasonable
  // number of distinct keys (e.g. a flood of spoofed IPs), drop everything
  // rather than let memory grow forever. Correctness impact is minimal -
  // worst case a legitimate caller's window resets early, which just means
  // one extra allowed request, never a security gap.
  if (store.size > 10_000) {
    store.clear();
    store.set(key, withinWindow);
  }

  const remaining = Math.max(0, maxRequests - withinWindow.length);
  return { limited: withinWindow.length > maxRequests, remaining };
}
