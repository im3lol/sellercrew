import type { ProductInput } from "@/lib/workflow";

// Deterministic, zero-cost pre-gate. Catches obviously prohibited Amazon claims
// in the seller's own input before any tokens are spent on the AI workflow.
const prohibitedClaimPatterns = [
  { label: "FDA approved", pattern: /\bfda[\s-]?approved\b/i },
  {
    label: "cures or treats disease",
    pattern: /\b(cure[sd]?|treats?|prevents?)\b.{0,35}\b(disease|cancer|diabetes|infection|anxiety|depression)\b/i,
  },
  { label: "guaranteed result", pattern: /\b(guaranteed results?|100%\s+(safe|effective)|risk[- ]free)\b/i },
  { label: "unverified ranking", pattern: /\b(#\s?1|number one|best seller|top[- ]rated)\b/i },
];

export function findBlockedTerms(input: Pick<
  ProductInput,
  "productName" | "description" | "specifications" | "materials" | "targetAudience"
>): string[] {
  const claimsText = [
    input.productName,
    input.description,
    input.specifications,
    input.materials,
    input.targetAudience,
  ]
    .filter(Boolean)
    .join(" ");

  return prohibitedClaimPatterns
    .filter(({ pattern }) => pattern.test(claimsText))
    .map(({ label }) => label);
}
