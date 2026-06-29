import { describe, expect, it } from "vitest";
import { isTruncatedJson, parseAIJson, resolveProviderChain } from "@/lib/ai/providers";

describe("isTruncatedJson", () => {
  it("is false for complete JSON", () => {
    expect(isTruncatedJson('{"a":1,"b":[1,2,3]}')).toBe(false);
    expect(isTruncatedJson('```json\n{"a":"x"}\n```')).toBe(false);
  });

  it("is true for cut-off objects/arrays", () => {
    expect(isTruncatedJson('{"a":1,"b":[1,2')).toBe(true);
    expect(isTruncatedJson('{"title":"unterminated')).toBe(true);
    expect(isTruncatedJson('{"nested":{"x":1}')).toBe(true);
  });

  it("is false when there is no JSON at all", () => {
    expect(isTruncatedJson("I cannot help with that.")).toBe(false);
    expect(isTruncatedJson("")).toBe(false);
  });

  it("ignores brackets inside strings", () => {
    expect(isTruncatedJson('{"a":"has } and ] inside"}')).toBe(false);
  });
});

describe("parseAIJson", () => {
  it("parses fenced JSON and repairs trailing commas", () => {
    expect(parseAIJson('```json\n{"a":1,}\n```')).toEqual({ a: 1 });
  });
});

describe("resolveProviderChain", () => {
  it("keeps OpenRouter as a fallback when enabled", () => {
    expect(resolveProviderChain(["anthropic"], true)).toEqual(["anthropic", "openrouter"]);
  });
  it("drops OpenRouter when fallback is disabled", () => {
    expect(resolveProviderChain(["anthropic", "openrouter"], false)).toEqual(["anthropic"]);
  });
});
