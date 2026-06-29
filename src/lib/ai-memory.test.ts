import { describe, expect, it } from "vitest";
import { selectRelevantMemories, fingerprintMemory, type ScorableMemory } from "@/lib/ai-memory";

const mem = (title: string, content: string, keywords: string[], useCount = 0): ScorableMemory => ({
  kind: "verified_fact",
  title,
  content,
  keywords: JSON.stringify(keywords),
  useCount,
});

describe("selectRelevantMemories", () => {
  it("returns only memories whose keywords overlap the product", () => {
    const memories = [
      mem("watch", "Leather strap watch", ["watch", "leather", "strap"]),
      mem("blender", "Kitchen blender", ["blender", "kitchen"]),
    ];
    const selected = selectRelevantMemories(memories, { productName: "Hugo Boss leather watch" });
    expect(selected).toHaveLength(1);
    expect(selected[0].title).toBe("watch");
  });

  it("ranks higher-overlap memories first, then by useCount", () => {
    const memories = [
      mem("a", "x", ["watch"], 0),
      mem("b", "y", ["watch", "leather"], 0),
      mem("c", "z", ["watch"], 9),
    ];
    const selected = selectRelevantMemories(memories, { productName: "leather watch" });
    expect(selected.map((m) => m.title)).toEqual(["b", "c", "a"]);
  });

  it("respects the character budget", () => {
    const big = "k ".repeat(1).trim();
    const memories = [
      mem("one", "A".repeat(300), [big]),
      mem("two", "B".repeat(300), [big]),
      mem("three", "C".repeat(300), [big]),
    ];
    const selected = selectRelevantMemories(memories, { productName: "k" }, { budget: 350 });
    expect(selected.length).toBe(1);
  });

  it("returns nothing for an unrelated product", () => {
    const memories = [mem("watch", "x", ["watch", "leather"])];
    expect(selectRelevantMemories(memories, { productName: "garden hose" })).toHaveLength(0);
  });

  it("fingerprints are stable and normalized", () => {
    expect(fingerprintMemory("Hello, World!")).toBe(fingerprintMemory("hello   world"));
  });
});
