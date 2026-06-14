import type { NextRequest } from "next/server";

// In-memory fixed-window rate limiter. Suitable for a single-instance deployment.
// For multi-instance/serverless, back this with Redis or Upstash instead.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// `x-forwarded-for` is "client, proxy1, proxy2, ...". The leftmost entry is
// client-controlled and trivially spoofable on a direct-to-Node deployment, so an
// attacker could rotate it to dodge rate limits. We instead trust only the hop our
// own infra appends: with TRUSTED_PROXY_COUNT=n, the real client is the (n+1)-th
// entry from the right. Default 1 matches Vercel/typical single-proxy setups.
function trustedProxyCount(): number {
  const n = Number.parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length) {
      const idx = Math.max(0, hops.length - 1 - trustedProxyCount());
      return hops[idx];
    }
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}
