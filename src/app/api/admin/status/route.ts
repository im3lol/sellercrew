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
    subscriptions,
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
    db.subscription.count(),
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
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [runs24h, runs7d, providerGroups] = await Promise.all([
    db.workflowRun.count({ where: { createdAt: { gte: last24Hours } } }),
    db.workflowRun.count({ where: { createdAt: { gte: last7Days } } }),
    db.workflowRun.groupBy({
      by: ["provider", "model", "status"],
      _count: { _all: true },
      _avg: { durationMs: true },
      _sum: { generatedImages: true, inputTokens: true, outputTokens: true },
      _max: { createdAt: true },
    }),
  ]);
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
  const usageByProvider = new Map<string, {
    provider: string;
    model: string | null;
    totalRuns: number;
    completedRuns: number;
    blockedRuns: number;
    failedRuns: number;
    totalDurationMs: number;
    generatedImages: number;
    inputTokens: number;
    outputTokens: number;
    lastUsedAt: Date | null;
  }>();
  for (const row of providerGroups) {
    const provider = row.provider ?? "unknown";
    const key = `${provider}:${row.model ?? "default"}`;
    const current = usageByProvider.get(key) ?? {
      provider,
      model: row.model,
      totalRuns: 0,
      completedRuns: 0,
      blockedRuns: 0,
      failedRuns: 0,
      totalDurationMs: 0,
      generatedImages: 0,
      inputTokens: 0,
      outputTokens: 0,
      lastUsedAt: null,
    };
    const count = row._count._all;
    current.totalRuns += count;
    current.totalDurationMs += Math.round((row._avg.durationMs ?? 0) * count);
    current.generatedImages += row._sum.generatedImages ?? 0;
    current.inputTokens += row._sum.inputTokens ?? 0;
    current.outputTokens += row._sum.outputTokens ?? 0;
    if (row.status === "completed") current.completedRuns += count;
    else if (row.status === "blocked") current.blockedRuns += count;
    else if (row.status === "failed") current.failedRuns += count;
    if (row._max.createdAt && (!current.lastUsedAt || row._max.createdAt > current.lastUsedAt)) {
      current.lastUsedAt = row._max.createdAt;
    }
    usageByProvider.set(key, current);
  }
  const providerUsage = Array.from(usageByProvider.values())
    .map((usage) => ({
      provider: usage.provider,
      model: usage.model,
      totalRuns: usage.totalRuns,
      completedRuns: usage.completedRuns,
      blockedRuns: usage.blockedRuns,
      failedRuns: usage.failedRuns,
      successRate: usage.totalRuns ? Math.round((usage.completedRuns / usage.totalRuns) * 100) : 0,
      avgDurationMs: usage.totalRuns ? Math.round(usage.totalDurationMs / usage.totalRuns) : 0,
      generatedImages: usage.generatedImages,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.inputTokens + usage.outputTokens,
      lastUsedAt: usage.lastUsedAt,
    }))
    .sort((a, b) => b.totalRuns - a.totalRuns);
  const apiUsage = {
    totalRuns: workflowRuns,
    runs24h,
    runs7d,
    completedRuns: completedAgg._count._all,
    blockedRuns: blockedCount,
    failedRuns: providerUsage.reduce((total, usage) => total + usage.failedRuns, 0),
    trackedTokens: true,
    trackedCost: false,
    totalInputTokens: providerUsage.reduce((total, usage) => total + usage.inputTokens, 0),
    totalOutputTokens: providerUsage.reduce((total, usage) => total + usage.outputTokens, 0),
    totalTokens: providerUsage.reduce((total, usage) => total + usage.totalTokens, 0),
    providerUsage,
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
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      suspendedAt: true,
      emailVerified: true,
      createdAt: true,
      memberships: {
        orderBy: { joinedAt: "asc" },
        take: 1,
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              subscription: { select: { plan: true, status: true, trialEndsAt: true } },
              credits: { select: { balance: true, used: true } },
            },
          },
        },
      },
    },
  });
  const recentOrgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, name: true, createdAt: true,
      owner: { select: { name: true, email: true } },
      subscription: { select: { plan: true, status: true } },
      credits: { select: { balance: true, used: true } },
      _count: { select: { members: true, projects: true } },
    },
  });

  return NextResponse.json({
    health: {
      database: dbOk,
      sessionSecret: !!process.env.SESSION_SECRET,
      appUrl: request.nextUrl.origin,
      anyProvider: providers.some((p) => p.configured),
    },
    providers,
    settings,
    counts: {
      users, organizations, projects, listings, generations, activityLogs,
      policyDocuments, activeRules, duplicateRules, workflowRuns, subscriptions,
    },
    accuracy,
    apiUsage,
    recentRuns,
    features,
    recentUsers: recentUsers.map((user) => {
      const organization = user.memberships[0]?.organization;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        suspendedAt: user.suspendedAt,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        workspaceId: organization?.id ?? null,
        workspaceName: organization?.name ?? null,
        plan: organization?.subscription?.plan ?? "starter",
        subscriptionStatus: organization?.subscription?.status ?? "inactive",
        trialEndsAt: organization?.subscription?.trialEndsAt ?? null,
        credits: organization?.credits?.balance ?? 0,
        creditsUsed: organization?.credits?.used ?? 0,
      };
    }),
    recentOrgs: recentOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      plan: org.subscription?.plan ?? "—",
      status: org.subscription?.status ?? "—",
      credits: org.credits?.balance ?? 0,
      creditsUsed: org.credits?.used ?? 0,
      members: org._count.members,
      projects: org._count.projects,
      ownerName: org.owner.name,
      ownerEmail: org.owner.email,
    })),
  });
}
