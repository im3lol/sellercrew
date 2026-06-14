import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "@/lib/pricing";

describe("estimateCostUsd", () => {
  it("prices Claude Sonnet at 3/15 per million", () => {
    expect(estimateCostUsd("claude-sonnet-4-6", 1_000_000, 1_000_000)).toBe(18);
  });

  it("prices Gemini Flash at 0.3/2.5 per million", () => {
    expect(estimateCostUsd("gemini-2.5-flash", 1_000_000, 1_000_000)).toBe(2.8);
  });

  it("uses the fallback rate for unknown models", () => {
    expect(estimateCostUsd("some-unknown-model", 1_000_000, 1_000_000)).toBe(4);
  });

  it("returns 0 for no tokens", () => {
    expect(estimateCostUsd("claude-sonnet-4-6", 0, 0)).toBe(0);
  });

  it("handles a null model", () => {
    expect(estimateCostUsd(null, 1_000_000, 0)).toBe(1);
  });
});
