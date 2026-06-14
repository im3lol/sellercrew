import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateAIText, parseAIJson } from "@/lib/ai/providers";
import { ensureDefaultPolicyKnowledgeBase } from "@/lib/default-policies";

export const POLICY_CATEGORIES = [
  "health_medical_claims",
  "restricted_prohibited_products",
  "ip_trademark_brand",
  "images_media",
  "pricing_offers",
  "reviews_ratings",
  "product_safety",
  "listing_content_format",
  "general",
] as const;

export const POLICY_CATEGORY_LABELS: Record<string, string> = {
  health_medical_claims: "Health & Medical Claims",
  restricted_prohibited_products: "Restricted & Prohibited Products",
  ip_trademark_brand: "IP, Trademark & Brand",
  images_media: "Images & Media",
  pricing_offers: "Pricing & Offers",
  reviews_ratings: "Reviews & Ratings",
  product_safety: "Product Safety",
  listing_content_format: "Listing Content & Format",
  general: "General",
};

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

const extractedRuleSchema = z.object({
  category: z.string(),
  title: z.string().min(2).max(200),
  ruleText: z.string().min(4).max(1200),
  severity: z.enum(SEVERITIES).default("medium"),
  keywords: z.array(z.string().min(1).max(60)).max(20).default([]),
});

const extractionSchema = z.object({
  rules: z.array(extractedRuleSchema).max(200),
});

const dedupSchema = z.object({
  duplicates: z
    .array(
      z.object({
        newRuleIndex: z.number().int().min(0),
        duplicateOfId: z.string().min(1),
        reason: z.string().max(400).default(""),
      })
    )
    .default([]),
});

type ExtractedRule = z.infer<typeof extractedRuleSchema>;

function normalizeCategory(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (POLICY_CATEGORIES as readonly string[]).includes(normalized) ? normalized : "general";
}

export function fingerprintRule(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return crypto.createHash("sha1").update(normalized).digest("hex");
}

const EXTRACTION_SYSTEM = `You are Saleem, SellerCrew's Amazon compliance specialist.
You convert a raw policy document into a clean, deduplicated set of atomic compliance rules.

Rules:
- Output ONE entry per distinct, checkable rule. Split compound paragraphs into separate rules.
- "category" must be exactly one of: ${POLICY_CATEGORIES.join(", ")}.
- "title" is a short label (a few words).
- "ruleText" is a single, self-contained, imperative statement a reviewer can check a listing against.
- "severity": critical = legal/safety/banned; high = likely suspension; medium = common violation; low = style/quality.
- "keywords": terms that would appear in a product listing this rule governs (lowercase).
- Do not invent rules that are not supported by the document. Do not include commentary.`;

// Split a long document into chunks at newline boundaries so the whole policy
// is processed, not just the first slice.
function chunkMarkdown(markdown: string, size = 18_000, maxChunks = 8): string[] {
  const text = markdown.trim();
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < maxChunks) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const newline = text.lastIndexOf("\n", end);
      if (newline > start + size * 0.5) end = newline; // prefer a clean break
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

async function extractRules(markdown: string, fileName: string): Promise<ExtractedRule[]> {
  const chunks = chunkMarkdown(markdown);
  const collected: ExtractedRule[] = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const part = chunks.length > 1 ? ` (part ${i + 1} of ${chunks.length})` : "";
    try {
      const result = await generateAIText({
        system: EXTRACTION_SYSTEM,
        prompt: `Source file: ${fileName}${part}

Policy document:
"""
${chunks[i]}
"""

Return JSON matching this schema exactly:
${JSON.stringify(z.toJSONSchema(extractionSchema))}`,
        json: true,
        maxTokens: 8_000,
      });
      const parsed = extractionSchema.parse(parseAIJson(result.text));
      collected.push(...parsed.rules.map((rule) => ({ ...rule, category: normalizeCategory(rule.category) })));
    } catch {
      // Skip a chunk that fails extraction rather than failing the whole upload.
    }
  }

  // Drop exact duplicates produced across overlapping chunks before storage.
  const seen = new Set<string>();
  const unique: ExtractedRule[] = [];
  for (const rule of collected) {
    const fingerprint = fingerprintRule(rule.ruleText);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    unique.push(rule);
  }
  return unique.slice(0, 300);
}

interface ExistingRuleLite {
  id: string;
  category: string;
  title: string;
  ruleText: string;
}

async function semanticDedupe(
  candidates: { index: number; rule: ExtractedRule }[],
  existing: ExistingRuleLite[]
): Promise<Map<number, { duplicateOfId: string; reason: string }>> {
  const flagged = new Map<number, { duplicateOfId: string; reason: string }>();
  if (!candidates.length || !existing.length) return flagged;

  try {
    const result = await generateAIText({
      system:
        "You detect semantically duplicate compliance rules. A new rule is a duplicate only if an existing rule already enforces the same requirement (even if worded differently). Be conservative: when unsure, do not flag.",
      prompt: `EXISTING rules:
${JSON.stringify(existing.map((rule) => ({ id: rule.id, category: rule.category, title: rule.title, ruleText: rule.ruleText.slice(0, 300) })))}

NEW rules (by index):
${JSON.stringify(candidates.map(({ index, rule }) => ({ index, category: rule.category, title: rule.title, ruleText: rule.ruleText })))}

Return JSON matching this schema exactly:
${JSON.stringify(z.toJSONSchema(dedupSchema))}`,
      json: true,
      maxTokens: 2_000,
    });
    const parsed = dedupSchema.parse(parseAIJson(result.text));
    const existingIds = new Set(existing.map((rule) => rule.id));
    for (const dup of parsed.duplicates) {
      if (existingIds.has(dup.duplicateOfId) && !flagged.has(dup.newRuleIndex)) {
        flagged.set(dup.newRuleIndex, { duplicateOfId: dup.duplicateOfId, reason: dup.reason });
      }
    }
  } catch {
    // Semantic pass is best-effort; exact-fingerprint dedup still applies.
  }
  return flagged;
}

export interface IngestSummary {
  documentId: string;
  ruleCount: number;
  created: number;
  exactDuplicates: number;
  semanticDuplicates: number;
}

export async function ingestPolicyDocument(input: {
  title: string;
  fileName: string;
  markdown: string;
  uploadedById?: string;
}): Promise<IngestSummary> {
  const extracted = await extractRules(input.markdown, input.fileName);

  const document = await db.policyDocument.create({
    data: {
      title: input.title,
      fileName: input.fileName,
      rawMarkdown: input.markdown.slice(0, 100_000),
      uploadedById: input.uploadedById ?? null,
    },
  });

  if (!extracted.length) {
    return { documentId: document.id, ruleCount: 0, created: 0, exactDuplicates: 0, semanticDuplicates: 0 };
  }

  const existing = await db.policyRule.findMany({
    where: { status: "active" },
    select: { id: true, category: true, title: true, ruleText: true, fingerprint: true },
    take: 400,
    orderBy: { createdAt: "desc" },
  });
  const existingByFingerprint = new Map(existing.map((rule) => [rule.fingerprint, rule.id]));

  // 1) Deterministic exact-duplicate detection by fingerprint.
  const prepared = extracted.map((rule, index) => {
    const fingerprint = fingerprintRule(rule.ruleText);
    const exactDupId = existingByFingerprint.get(fingerprint);
    return { index, rule, fingerprint, exactDupId };
  });

  // 2) AI semantic-duplicate detection for the rest.
  const semanticCandidates = prepared
    .filter((item) => !item.exactDupId)
    .map(({ index, rule }) => ({ index, rule }));
  const semanticFlags = await semanticDedupe(
    semanticCandidates,
    existing.map(({ id, category, title, ruleText }) => ({ id, category, title, ruleText }))
  );

  let created = 0;
  let exactDuplicates = 0;
  let semanticDuplicates = 0;

  await db.$transaction(
    prepared.map((item) => {
      const exact = item.exactDupId;
      const semantic = semanticFlags.get(item.index);
      let status = "active";
      let duplicateOfId: string | null = null;
      let note: string | null = null;

      if (exact) {
        status = "duplicate";
        duplicateOfId = exact;
        note = "Exact duplicate of an existing active rule.";
        exactDuplicates += 1;
      } else if (semantic) {
        status = "duplicate";
        duplicateOfId = semantic.duplicateOfId;
        note = semantic.reason || "Semantically duplicates an existing rule.";
        semanticDuplicates += 1;
      } else {
        created += 1;
      }

      return db.policyRule.create({
        data: {
          documentId: document.id,
          category: item.rule.category,
          title: item.rule.title,
          ruleText: item.rule.ruleText,
          severity: item.rule.severity,
          keywords: JSON.stringify(item.rule.keywords),
          fingerprint: item.fingerprint,
          status,
          duplicateOfId,
          note,
        },
      });
    })
  );

  return {
    documentId: document.id,
    ruleCount: prepared.length,
    created,
    exactDuplicates,
    semanticDuplicates,
  };
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Build the authoritative policy context injected into Saleem's reviews.
 * All critical/high rules are always included; remaining rules are ranked by
 * relevance to the product and trimmed to a character budget so Saleem stays
 * accurate without blowing the token budget as the bank grows.
 */
export async function getPolicyContextForSaleem(product: {
  productName?: string;
  description?: string;
  category?: string;
  specifications?: string;
  materials?: string;
  targetAudience?: string;
  keywords?: string[];
}): Promise<string> {
  await ensureDefaultPolicyKnowledgeBase();
  const rules = await db.policyRule.findMany({
    where: { status: "active" },
    select: { category: true, title: true, ruleText: true, severity: true, keywords: true },
  });
  if (!rules.length) return "";

  const productText = [
    product.productName,
    product.description,
    product.category,
    product.specifications,
    product.materials,
    product.targetAudience,
    ...(product.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scored = rules.map((rule) => {
    let keywords: string[] = [];
    try {
      keywords = JSON.parse(rule.keywords) as string[];
    } catch {
      keywords = [];
    }
    const relevance = keywords.reduce(
      (count, keyword) => (keyword && productText.includes(keyword.toLowerCase()) ? count + 1 : count),
      0
    );
    return { ...rule, relevance };
  });

  scored.sort((a, b) => {
    const severity = (SEVERITY_RANK[a.severity] ?? 2) - (SEVERITY_RANK[b.severity] ?? 2);
    if (severity !== 0) return severity;
    return b.relevance - a.relevance;
  });

  const BUDGET = 8_000;
  let used = 0;
  const selected: typeof scored = [];
  for (const rule of scored) {
    const alwaysInclude = rule.severity === "critical" || rule.severity === "high";
    const line = rule.ruleText.length + rule.title.length + 16;
    if (alwaysInclude || used + line <= BUDGET) {
      selected.push(rule);
      used += line;
    }
  }

  const byCategory = new Map<string, string[]>();
  for (const rule of selected) {
    const label = POLICY_CATEGORY_LABELS[rule.category] ?? rule.category;
    const list = byCategory.get(label) ?? [];
    list.push(`- [${rule.severity.toUpperCase()}] ${rule.title}: ${rule.ruleText}`);
    byCategory.set(label, list);
  }

  const sections = Array.from(byCategory.entries()).map(
    ([label, lines]) => `## ${label}\n${lines.join("\n")}`
  );

  return [
    "ACTIVE POLICY KNOWLEDGE BASE (authoritative — base every compliance decision on these rules; cite the relevant rule titles in your notes):",
    ...sections,
  ].join("\n\n");
}
