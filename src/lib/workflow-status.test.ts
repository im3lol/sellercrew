import { describe, expect, it } from "vitest";
import { coerceWorkflowStepStatus } from "@/lib/workflow";

describe("coerceWorkflowStepStatus", () => {
  it("passes the canonical statuses through", () => {
    expect(coerceWorkflowStepStatus("completed")).toBe("completed");
    expect(coerceWorkflowStepStatus("needs_review")).toBe("needs_review");
    expect(coerceWorkflowStepStatus("blocked")).toBe("blocked");
    expect(coerceWorkflowStepStatus("skipped")).toBe("skipped");
  });

  it("normalizes casing, spaces and dashes", () => {
    expect(coerceWorkflowStepStatus("Needs Review")).toBe("needs_review");
    expect(coerceWorkflowStepStatus("NEEDS-REVIEW")).toBe("needs_review");
  });

  it("maps in-progress-style aliases to completed", () => {
    for (const v of ["working", "running", "in_progress", "done", "success", "approved"]) {
      expect(coerceWorkflowStepStatus(v)).toBe("completed");
    }
  });

  it("maps pending/queued/waiting to skipped", () => {
    for (const v of ["pending", "queued", "waiting", "not_started"]) {
      expect(coerceWorkflowStepStatus(v)).toBe("skipped");
    }
  });

  it("maps failure-style aliases to needs_review", () => {
    for (const v of ["failed", "error", "warning"]) {
      expect(coerceWorkflowStepStatus(v)).toBe("needs_review");
    }
  });

  it("maps rejected to blocked", () => {
    expect(coerceWorkflowStepStatus("rejected")).toBe("blocked");
  });

  it("falls back to completed for unknown or non-string input", () => {
    expect(coerceWorkflowStepStatus("banana")).toBe("completed");
    expect(coerceWorkflowStepStatus(null)).toBe("completed");
    expect(coerceWorkflowStepStatus(42)).toBe("completed");
  });
});
