import { describe, expect, it } from "vitest";
import { cleanSecretValue } from "@/lib/secrets";

describe("cleanSecretValue", () => {
  it("returns a plain value untouched", () => {
    expect(cleanSecretValue("sk-abc123")).toBe("sk-abc123");
  });

  it("trims surrounding whitespace", () => {
    expect(cleanSecretValue("  sk-abc123  ")).toBe("sk-abc123");
  });

  it("strips a NAME= prefix from a pasted .env line", () => {
    expect(cleanSecretValue('REDIS_URL="rediss://user:pass@host:6379"')).toBe(
      "rediss://user:pass@host:6379"
    );
  });

  it("strips the prefix without quotes", () => {
    expect(cleanSecretValue("ANTHROPIC_API_KEY=sk-ant-123")).toBe("sk-ant-123");
  });

  it("strips single quotes", () => {
    expect(cleanSecretValue("'value-here'")).toBe("value-here");
  });

  it("handles spaces around the equals sign", () => {
    expect(cleanSecretValue("OPENAI_API_KEY = sk-xyz")).toBe("sk-xyz");
  });

  it("keeps everything after the first NAME= including later '=' chars", () => {
    expect(cleanSecretValue("REDIS_URL=rediss://h?token=ab=cd")).toBe("rediss://h?token=ab=cd");
  });

  it("does not treat a dashed key like sk-ant-... as a NAME= prefix", () => {
    expect(cleanSecretValue("sk-ant-api03-abc")).toBe("sk-ant-api03-abc");
  });
});
