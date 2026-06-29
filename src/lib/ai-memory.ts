import crypto from "crypto";
import { db } from "@/lib/db";
import type { FullWorkflowResult, ProductInput } from "@/lib/workflow";

// The crew's long-term memory. After each successful run we distill durable
// knowledge (verified facts, brand context, an approved-keyword glossary) into
// per-user AiMemory rows. At the start of the next run we retrieve the entries
// most relevant to the current product (lexical keyword overlap, à la the policy
// bank) and inject them so the agents build on prior work instead of starting
// cold. Lexical now; the schema leaves room for embeddings (semantic RAG) later.

const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "your", "you", "are", "was",
  "has", "have", "will", "can", "all", "any", "our", "its", "their", "made", "use",
  "used", "into", "out", "per", "one", "two", "new", "more", "most", "very", "also",
  "amazon", "product", "listing", "item", "items", "quality", "high", "best",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function keywordsFrom(text: string, limit = 12): string[] {
  return [...new Set(tokenize(text))].slice(0, limit);
}

export function fingerprintMemory(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return crypto.createHash("sha1").update(normalized).digest("hex");
}

function productText(product: {
  productName?: string;
  brandName?: string;
  category?: string;
  description?: string;
  specifications?: string;
  materials?: string;
  targetAudience?: string;
  keywords?: string[];
}): string {
  return [
    product.productName,
    product.brandName,
    product.category,
    product.description,
    product.specifications,
    product.materials,
    product.targetAudience,
    ...(product.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export interface ScorableMemory {
  kind: string;
  title: string;
  content: string;
  keywords: string;
  useCount?: number;
}

/**
 * Rank memories by lexical relevance to the product and select the top entries
 * under a character budget. Pure + exported so it can be unit-tested without a DB.
 */
export function selectRelevantMemories<T extends ScorableMemory>(
  memories: T[],
  product: Parameters<typeof productText>[0],
  opts: { limit?: number; budget?: number } = {}
): T[] {
  const limit = opts.limit ?? 12;
  const budget = opts.budget ?? 4_000;
  const haystack = productText(product);

  const scored = memories
    .map((memory) => {
      let keywords: string[] = [];
      try {
        keywords = JSON.parse(memory.keywords) as string[];
      } catch {
        keywords = [];
      }
      const relevance = keywords.reduce(
        (count, keyword) => (keyword && haystack.includes(keyword.toLowerCase()) ? count + 1 : count),
        0
      );
      return { memory, relevance };
    })
    .filter((entry) => entry.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || (b.memory.useCount ?? 0) - (a.memory.useCount ?? 0));

  const selected: T[] = [];
  let used = 0;
  for (const { memory } of scored) {
    if (selected.length >= limit) break;
    const cost = memory.title.length + memory.content.length + 8;
    if (used + cost > budget && selected.length) break;
    selected.push(memory);
    used += cost;
  }
  return selected;
}

const KIND_LABELS: Record<string, string> = {
  brand: "Brand & product context",
  verified_fact: "Verified facts",
  glossary: "Approved keyword glossary",
  preference: "Seller preferences",
};

/**
 * Build the prior-knowledge block injected into every agent for this user. Empty
 * string when there is nothing relevant (so the prompt stays clean for new users).
 */
export async function getMemoryContextForCrew(
  userId: string,
  product: Parameters<typeof productText>[0]
): Promise<string> {
  let memories: Array<ScorableMemory & { id: string }> = [];
  try {
    memories = await db.aiMemory.findMany({
      where: { userId },
      select: { id: true, kind: true, title: true, content: true, keywords: true, useCount: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  } catch {
    return "";
  }
  if (!memories.length) return "";

  const selected = selectRelevantMemories(memories, product);
  if (!selected.length) return "";

  // Count usage so frequently-relevant memories rank higher over time (best-effort).
  db.aiMemory
    .updateMany({ where: { id: { in: selected.map((m) => m.id) } }, data: { useCount: { increment: 1 } } })
    .catch(() => {});

  const byKind = new Map<string, string[]>();
  for (const memory of selected) {
    const label = KIND_LABELS[memory.kind] ?? "Other";
    const list = byKind.get(label) ?? [];
    list.push(`- ${memory.title}: ${memory.content}`);
    byKind.set(label, list);
  }
  const sections = Array.from(byKind.entries()).map(([label, lines]) => `## ${label}\n${lines.join("\n")}`);

  return [
    "PRIOR KNOWLEDGE FROM THIS SELLER'S PAST WORK (reference only — reuse it when it matches the current product, but always verify against the current seller input and uploaded images; never let it override or contradict what the seller submitted now):",
    ...sections,
  ].join("\n\n");
}

/**
 * Distill durable knowledge from a completed (non-blocked) run into the user's
 * memory. Deterministic — no extra AI calls. Best-effort: never throws into the
 * workflow path.
 */
export async function recordWorkflowMemories(
  userId: string,
  input: ProductInput,
  result: FullWorkflowResult
): Promise<void> {
  try {
    const product = input.productName?.trim() || "this product";
    const records: Array<{ kind: string; title: string; content: string; keywords: string[] }> = [];

    // Verified facts established during the run.
    for (const entry of result.evidenceLock.slice(0, 40)) {
      if (entry.status !== "verified") continue;
      const claim = entry.claim.trim();
      if (claim.length < 8) continue;
      records.push({
        kind: "verified_fact",
        title: `${product}: verified`,
        content: `${claim}${entry.sourceReference ? ` (source: ${entry.sourceReference})` : ""}`,
        keywords: keywordsFrom(`${claim} ${input.productName ?? ""} ${input.category ?? ""}`),
      });
      if (records.length >= 10) break;
    }

    // Brand/product snapshot — the approved title anchors future similar listings.
    const title = result.listingContent.title?.trim();
    if (title) {
      records.push({
        kind: "brand",
        title: `${product} (${input.category || "general"})`,
        content: `Approved title: ${title}`,
        keywords: keywordsFrom(`${input.productName ?? ""} ${input.brandName ?? ""} ${input.category ?? ""} ${title}`),
      });
    }

    // Approved keyword glossary for future keyword/SEO work.
    const terms = (result.listingContent.backendSearchTerms ?? [])
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 25);
    if (terms.length) {
      records.push({
        kind: "glossary",
        title: `${product}: approved keywords`,
        content: terms.join(", "),
        keywords: keywordsFrom(`${input.productName ?? ""} ${input.category ?? ""} ${terms.join(" ")}`),
      });
    }

    for (const record of records) {
      const fingerprint = fingerprintMemory(`${record.kind}:${record.content}`);
      await db.aiMemory
        .upsert({
          where: { userId_fingerprint: { userId, fingerprint } },
          create: {
            userId,
            kind: record.kind,
            title: record.title.slice(0, 200),
            content: record.content.slice(0, 2_000),
            keywords: JSON.stringify(record.keywords),
            source: input.productName?.slice(0, 200) ?? null,
            fingerprint,
          },
          update: { updatedAt: new Date(), useCount: { increment: 1 } },
        })
        .catch(() => {});
    }
  } catch {
    // Memory capture is best-effort; never break the workflow over it.
  }
}
