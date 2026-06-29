import { describe, expect, it } from "vitest";
import { mergeSettings, type AppSettings } from "@/lib/settings";

const base: AppSettings = {
  models: {
    anthropic: "claude-sonnet-4-6",
    gemini: "gemini-2.5-flash",
    openrouter: "qwen/qwen3.7-plus",
    openai: "gpt-5.4-mini",
    geminiImage: "google/gemini-2.5-flash-image",
    openrouterTextFallbacks: ["a", "b"],
    openrouterImageFallbacks: ["x", "y"],
    byAgent: { bayan: { anthropic: "claude-sonnet-4-6" } },
  },
  providerOrder: ["openrouter", "anthropic", "gemini"],
  features: { openRouterFallback: true, imageGeneration: true },
  compliance: { extraBlockedTerms: [] },
};

describe("mergeSettings", () => {
  it("returns the base unchanged when there is no stored patch", () => {
    expect(mergeSettings(base, null)).toEqual(base);
  });

  it("deep-merges partial model overrides without dropping the rest", () => {
    const merged = mergeSettings(base, { models: { anthropic: "claude-opus-4-8" } });
    expect(merged.models.anthropic).toBe("claude-opus-4-8");
    expect(merged.models.gemini).toBe("gemini-2.5-flash");
    expect(merged.models.openrouterTextFallbacks).toEqual(["a", "b"]);
  });

  it("merges feature flags partially", () => {
    const merged = mergeSettings(base, { features: { imageGeneration: false } });
    expect(merged.features.imageGeneration).toBe(false);
    expect(merged.features.openRouterFallback).toBe(true);
  });

  it("ignores an empty providerOrder and keeps the base order", () => {
    expect(mergeSettings(base, { providerOrder: [] }).providerOrder).toEqual(base.providerOrder);
  });

  it("applies a non-empty providerOrder", () => {
    const merged = mergeSettings(base, { providerOrder: ["anthropic", "gemini"] });
    expect(merged.providerOrder).toEqual(["anthropic", "gemini"]);
  });

  it("does not mutate the base object", () => {
    mergeSettings(base, { models: { gemini: "changed" } });
    expect(base.models.gemini).toBe("gemini-2.5-flash");
  });

  it("replaces the per-agent model tiers when provided", () => {
    const merged = mergeSettings(base, {
      models: { byAgent: { hakim: { anthropic: "claude-opus-4-8" } } },
    });
    expect(merged.models.byAgent).toEqual({ hakim: { anthropic: "claude-opus-4-8" } });
    expect(merged.models.anthropic).toBe("claude-sonnet-4-6");
  });
});
