import { describe, expect, it } from "vitest";
import {
  FULL_GENERATION_COST,
  FULL_WORKFLOW_COST,
  canAfford,
  canAffordFullGeneration,
  getAgentCost,
} from "@/lib/credits";

describe("credits", () => {
  it("sums the per-agent costs to 95", () => {
    expect(FULL_GENERATION_COST).toBe(95);
  });

  it("charges a fixed 150 per full workflow", () => {
    expect(FULL_WORKFLOW_COST).toBe(150);
  });

  it("returns per-agent costs (0 for unknown/free agents)", () => {
    expect(getAgentCost("noor")).toBe(15);
    expect(getAgentCost("ali")).toBe(0);
    expect(getAgentCost("nope")).toBe(0);
  });

  it("checks affordability", () => {
    expect(canAfford(20, "noor")).toBe(true);
    expect(canAfford(10, "noor")).toBe(false);
    expect(canAffordFullGeneration(95)).toBe(true);
    expect(canAffordFullGeneration(94)).toBe(false);
  });
});
