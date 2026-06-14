import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const third = rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 1, 40).ok).toBe(true);
    expect(rateLimit(key, 1, 40).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(rateLimit(key, 1, 40).ok).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });
});
