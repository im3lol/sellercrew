import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guard";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const settings = await getSettings();

  // ── Database health ──
  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  // ── Provider configuration (keys live in env) ──
  const providers = [
    { id: "anthropic", label: "Anthropic (Claude)", configured: !!process.env.ANTHROPIC_API_KEY, model: settings.models.anthropic },
    { id: "gemini", label: "Google Gemini", configured: !!process.env.GEMINI_API_KEY, model: settings.models.gemini },
    { id: "openrouter", label: "OpenRouter", configured: !!process.env.OPENROUTER_API_KEY, model: settings.models.openrouter },
    { id: "openai", label: "OpenAI", configured: !!process.env.OPENAI_API_KEY, model: settings.models.openai },
  ];

  // ── Entity counts ──
  const [
    users,
    organizations,
    projects,
    listings,
    generations,
    activityLogs,
    policyDocuments,
    activeRules,
    duplicateRules,
    workflowRuns,
  ] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.project.count(),
    db.listing.count(),
    db.generation.count(),
    db.activityLog.count(),
    db.policyDocument.count(),
    db.policyRule.count({ where: { status: "active" } }),
    db.policyRule.count({ where: { status: "duplicate" } }),
    db.workflowRun.count(),
  ]);

  // ── Accuracy aggregates (from completed runs) ──
  const completedAgg = await db.workflowRun.aggregate({
    where: { status: "completed" },
    _avg: {
      overallScore: true,
      qualityScore: true,
      seoScore: true,
      conversionScore: true,
      complianceScore: true,
      accuracyScore: true,
      hallucinationRisk: true,
      durationMs: true,
    },
    _count: { _all: true },
  });
  const blockedCount = await db.workflowRun.count({ where: { blocked: true } });
  const byProvider = await db.workflowRun.groupBy({ by: ["provider"], _count: { _all: true } });
  const recentRuns = await db.workflowRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, provider: true, model: true, status: true, blocked: true,
      overallScore: true, complianceScore: true, accuracyScore: true,
      hallucinationRisk: true, policyStatus: true, durationMs: true, createdAt: true,
    },
  });

  const round = (value: number | null) => (value == null ? 0 : Math.round(value));
  const accuracy = {
    completedRuns: completedAgg._count._all,
    blockedRuns: blockedCount,
    avgOverall: round(completedAgg._avg.overallScore),
    avgQuality: round(completedAgg._avg.qualityScore),
    avgSeo: round(completedAgg._avg.seoScore),
    avgConversion: round(completedAgg._avg.conversionScore),
    avgCompliance: round(completedAgg._avg.complianceScore),
    avgAccuracy: round(completedAgg._avg.accuracyScore),
    avgHallucinationRisk: round(completedAgg._avg.hallucinationRisk),
    avgDurationMs: round(completedAgg._avg.durationMs),
    byProvider: byProvider.map((row) => ({ provider: row.provider ?? "unknown", count: row._count._all })),
  };

  // ── Development / feature status ──
  const features = [
    { name: "Authentication (sessions + Prisma)", status: "live" },
    { name: "API auth + rate limiting", status: "live" },
    { name: "Multi-agent listing workflow", status: "live" },
    { name: "Compliance hard-gate", status: "live" },
    { name: "Policy knowledge base (Saleem memory)", status: "live" },
    { name: "AI provider fallback (OpenRouter)", status: settings.features.openRouterFallback ? "live" : "disabled" },
    { name: "Product image generation", status: settings.features.imageGeneration ? "live" : "disabled" },
    { name: "Exports (txt / json / csv)", status: "live" },
    { name: "Admin dashboard & settings", status: "live" },
    { name: "Server-side project/listing persistence", status: "planned" },
    { name: "Billing & payments", status: "planned" },
    { name: "Multi-marketplace (Noon / Shopify)", status: "planned" },
  ];

  // ── Recent users / orgs for admin tables ──
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const recentOrgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, name: true, createdAt: true,
      subscription: { select: { plan: true, status: true } },
      credits: { select: { balance: true, used: true } },
      _count: { select: { members: true, projects: true } },
    },
  });

  return NextResponse.json({
    health: {
      database: dbOk,
      sessionSecret: !!process.env.SESSION_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      anyProvider: providers.some((p) => p.configured),
    },
    providers,
    settings,
    counts: {
      users, organizations, projects, listings, generations, activityLogs,
      policyDocuments, activeRules, duplicateRules, workflowRuns,
    },
    accuracy,
    recentRuns,
    features,
    recentUsers,
    recentOrgs: recentOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      plan: org.subscription?.plan ?? "—",
      status: org.subscription?.status ?? "—",
      credits: org.credits?.balance ?? 0,
      members: org._count.members,
      projects: org._count.projects,
    })),
  });
}
