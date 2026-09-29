// Fixed-window rate limiter kept in the server's memory. It counts per process:
// with several instances (or serverless), each one keeps its own count, so a
// shared store is needed there (see PENDIENTES.md).

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

type RateLimiterOptions = {
  /** Also the key of the shared store: limiters with the same name share counts. */
  name: string;
  limit: number;
  windowMs: number;
  now?: () => number;
};

/** Bounds memory: expired windows are dropped once this many keys are stored. */
const MAX_KEYS = 10_000;

// On globalThis so every route and Server Action bundle shares the same counts.
const STORE = Symbol.for("camilaseguros.rateLimit");
type GlobalWithStore = typeof globalThis & { [STORE]?: Map<string, Map<string, Bucket>> };

function bucketsFor(name: string): Map<string, Bucket> {
  const scope = globalThis as GlobalWithStore;
  const store = (scope[STORE] ??= new Map());
  let buckets = store.get(name);
  if (!buckets) {
    buckets = new Map();
    store.set(name, buckets);
  }
  return buckets;
}

export function createRateLimiter({ name, limit, windowMs, now = Date.now }: RateLimiterOptions) {
  const buckets = bucketsFor(name);

  /** Counts one request for `key` and says whether it is allowed. */
  return function check(key: string): RateLimitResult {
    const time = now();
    if (buckets.size >= MAX_KEYS) {
      for (const [stored, bucket] of buckets) if (bucket.resetAt <= time) buckets.delete(stored);
    }

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= time) {
      buckets.set(key, { count: 1, resetAt: time + windowMs });
      return { ok: true };
    }
    if (bucket.count >= limit) {
      return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - time) / 1000) };
    }
    bucket.count += 1;
    return { ok: true };
  };
}

/**
 * Client IP as the proxy in front of the app reports it. Only trustworthy when
 * that proxy overwrites `x-forwarded-for` (Vercel and most load balancers do).
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
