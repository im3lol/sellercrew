import type { NextRequest } from "next/server";
import type { Redis } from "ioredis";

// Rate limiter with two backends:
//  - In-memory fixed window (default) — correct for a single instance.
//  - Redis fixed window (when REDIS_URL is set in the environment) — correct
//    across multiple instances / serverless.
// REDIS_URL is read from the environment (not the admin-managed DB secret) so the
// auth hot path never makes a DB call. Any Redis error falls back to memory, so a
// Redis hiccup can never block authentication.

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

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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

// Lazy, optional Redis client. Resolved once; if REDIS_URL is unset or the client
// can't be created, we permanently use the in-memory limiter.
let redisResolved = false;
let redisClient: Redis | null = null;

async function getRedis(): Promise<Redis | null> {
  if (redisResolved) return redisClient;
  redisResolved = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const { Redis: RedisCtor } = await import("ioredis");
    const u = new URL(url);
    const useTls = u.protocol === "rediss:" || u.hostname.includes("upstash.io");
    redisClient = new RedisCtor({
      host: u.hostname,
      port: Number(u.port || 6379),
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      ...(useTls ? { tls: {} } : {}),
    });
    redisClient.on("error", () => {
      // Swallow connection errors — rateLimit() falls back to memory per call.
    });
    return redisClient;
  } catch {
    redisClient = null;
    return null;
  }
}

/**
 * Increment-and-check a fixed window. Async because the Redis backend is async;
 * always resolves (never rejects) — falls back to the in-memory limiter on any
 * Redis error so authentication is never blocked by a Redis problem.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redis = await getRedis().catch(() => null);
  if (redis) {
    try {
      const k = `rl:${key}`;
      const count = await redis.incr(k);
      if (count === 1) await redis.pexpire(k, windowMs);
      if (count > limit) {
        const ttl = await redis.pttl(k);
        const ms = ttl > 0 ? ttl : windowMs;
        return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(ms / 1000)) };
      }
      return { ok: true, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 };
    } catch {
      // fall through to the in-memory limiter
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}
