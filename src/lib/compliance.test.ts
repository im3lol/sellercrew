import { describe, expect, it } from "vitest";
import { findBlockedTerms } from "@/lib/compliance";

const base = { productName: "", description: "", specifications: "", materials: "", targetAudience: "" };

describe("findBlockedTerms", () => {
  it("flags prohibited medical claims", () => {
    const result = findBlockedTerms({ ...base, description: "This cream cures cancer in days." });
    expect(result.length).toBeGreaterThan(0);
  });

  it("flags FDA-approved and risk-free claims", () => {
    expect(findBlockedTerms({ ...base, description: "FDA approved and risk-free." }).length).toBeGreaterThan(0);
  });

  it("passes clean copy", () => {
    expect(findBlockedTerms({ ...base, description: "A comfortable cotton t-shirt in three sizes." })).toEqual([]);
  });

  it("flags admin-configured extra terms", () => {
    const result = findBlockedTerms({ ...base, description: "Our miracle blend." }, ["miracle"]);
    expect(result.some((r) => r.toLowerCase().includes("miracle"))).toBe(true);
  });
});
