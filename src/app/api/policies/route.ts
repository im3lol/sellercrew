import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import { ingestPolicyDocument } from "@/lib/policies";
import { ensureDefaultPolicyKnowledgeBase } from "@/lib/default-policies";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const uploadSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  fileName: z.string().trim().min(1).max(200),
  markdown: z.string().trim().min(10).max(100_000),
});

// GET — list all policy documents with their rules (admin only).
export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  await ensureDefaultPolicyKnowledgeBase();
  const documents = await db.policyDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rules: { orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "asc" }] },
    },
  });

  const totals = await db.policyRule.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      status: doc.status,
      createdAt: doc.createdAt,
      rules: doc.rules.map((rule) => ({
        id: rule.id,
        category: rule.category,
        title: rule.title,
        ruleText: rule.ruleText,
        severity: rule.severity,
        keywords: safeParseKeywords(rule.keywords),
        status: rule.status,
        duplicateOfId: rule.duplicateOfId,
        note: rule.note,
      })),
    })),
    totals: Object.fromEntries(totals.map((t) => [t.status, t._count._all])),
  });
}

// POST — upload + ingest a markdown policy document (admin only).
export async function POST(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const limited = rateLimit(`policy-upload:${access.session.email}`, 10, 5 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many uploads. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a markdown policy file (at least 10 characters)." },
      { status: 400 }
    );
  }

  const { fileName, markdown } = parsed.data;
  const title = parsed.data.title || fileName.replace(/\.(md|markdown|txt)$/i, "");

  try {
    const summary = await ingestPolicyDocument({
      title,
      fileName,
      markdown,
    });
    return NextResponse.json({ success: true, summary }, { status: 201 });
  } catch (error) {
    console.error("Policy ingest error:", error);
    const message = error instanceof Error ? error.message : "Failed to process the policy document.";
    const isConfig = message.toLowerCase().includes("configured") || message.toLowerCase().includes("provider");
    return NextResponse.json(
      { error: isConfig ? "AI provider is not configured, so rules could not be extracted." : "Failed to process the policy document." },
      { status: isConfig ? 503 : 500 }
    );
  }
}

// DELETE — remove a policy document and its rules (admin only). ?id=<documentId>
export async function DELETE(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id." }, { status: 400 });

  try {
    await db.policyDocument.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
}

function safeParseKeywords(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
