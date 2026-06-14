import type { ProductInput } from "@/lib/workflow";
import { getSettings } from "@/lib/settings";

type ComplianceInput = Pick<
  ProductInput,
  "productName" | "description" | "specifications" | "materials" | "targetAudience"
>;

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

export function findBlockedTerms(input: ComplianceInput, extraTerms: string[] = []): string[] {
  const claimsText = [
    input.productName,
    input.description,
    input.specifications,
    input.materials,
    input.targetAudience,
  ]
    .filter(Boolean)
    .join(" ");

  const matches = prohibitedClaimPatterns
    .filter(({ pattern }) => pattern.test(claimsText))
    .map(({ label }) => label);

  const lower = claimsText.toLowerCase();
  for (const term of extraTerms) {
    const normalized = term.trim().toLowerCase();
    if (normalized && lower.includes(normalized)) {
      matches.push(`Custom blocked term: ${term.trim()}`);
    }
  }

  return [...new Set(matches)];
}

// Settings-aware variant: merges admin-configured extra blocked terms.
export async function getBlockedTerms(input: ComplianceInput): Promise<string[]> {
  let extra: string[] = [];
  try {
    extra = (await getSettings()).compliance.extraBlockedTerms;
  } catch {
    extra = [];
  }
  return findBlockedTerms(input, extra);
}
