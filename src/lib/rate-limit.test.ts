import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

// No REDIS_URL in the test env, so these exercise the in-memory backend.
describe("rateLimit", () => {
  it("allows up to the limit, then blocks", async () => {
    const key = `t-${Math.random()}`;
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    const third = await rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    const key = `t-${Math.random()}`;
    expect((await rateLimit(key, 1, 40)).ok).toBe(true);
    expect((await rateLimit(key, 1, 40)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect((await rateLimit(key, 1, 40)).ok).toBe(true);
  });

  it("tracks separate keys independently", async () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect((await rateLimit(a, 1, 60_000)).ok).toBe(true);
    expect((await rateLimit(a, 1, 60_000)).ok).toBe(false);
    expect((await rateLimit(b, 1, 60_000)).ok).toBe(true);
  });
});
