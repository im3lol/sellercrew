import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies the correct password and rejects a wrong one", () => {
    const stored = hashPassword("Sup3rSecret!");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("Sup3rSecret!", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("produces a unique hash per call (random salt)", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken({ id: "user-1", email: "a@b.com" });
    const payload = verifySessionToken(token);
    expect(payload?.uid).toBe("user-1");
    expect(payload?.email).toBe("a@b.com");
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken({ id: "user-1", email: "a@b.com" });
    expect(verifySessionToken(token.slice(0, -2) + "xy")).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
  });
});
