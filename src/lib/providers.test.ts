import { describe, expect, it } from "vitest";
import { parseAIJson, resolveProviderChain } from "@/lib/ai/providers";

describe("resolveProviderChain", () => {
  it("keeps the configured order and appends openrouter when fallback is on", () => {
    expect(resolveProviderChain(["anthropic", "gemini"], true)).toEqual([
      "anthropic",
      "gemini",
      "openrouter",
    ]);
  });

  it("does not duplicate openrouter when it is already in the order", () => {
    expect(resolveProviderChain(["openrouter", "anthropic"], true)).toEqual([
      "openrouter",
      "anthropic",
    ]);
  });

  it("removes openrouter entirely when fallback is off", () => {
    expect(resolveProviderChain(["anthropic", "openrouter", "gemini"], false)).toEqual([
      "anthropic",
      "gemini",
    ]);
  });

  it("drops providers that have no runner available", () => {
    expect(resolveProviderChain(["anthropic", "gemini"], true, ["anthropic"])).toEqual([
      "anthropic",
    ]);
  });

  it("falls back to non-openrouter providers when the order is empty", () => {
    expect(resolveProviderChain([], false)).toEqual(["anthropic", "gemini"]);
  });
});

describe("parseAIJson", () => {
  it("parses clean JSON", () => {
    expect(parseAIJson('{"a":1,"b":[2,3]}')).toEqual({ a: 1, b: [2, 3] });
  });

  it("strips ```json code fences", () => {
    expect(parseAIJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("extracts JSON that has leading prose before the first brace", () => {
    expect(parseAIJson('Here is the result: {"x":"y"}')).toEqual({ x: "y" });
  });

  it("removes trailing commas", () => {
    expect(parseAIJson('{"a":1,"b":2,}')).toEqual({ a: 1, b: 2 });
  });

  it("repairs JSON truncated mid-string", () => {
    expect(parseAIJson('{"title":"Great product')).toEqual({ title: "Great product" });
  });

  it("repairs JSON truncated with open brackets", () => {
    expect(parseAIJson('{"items":["a","b"')).toEqual({ items: ["a", "b"] });
  });
});
