'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AdminStatusData {
  health: { database: boolean; sessionSecret: boolean; appUrl: string; anyProvider: boolean };
  providers: { id: string; label: string; configured: boolean; model: string }[];
  counts: Record<string, number>;
  accuracy: {
    completedRuns: number;
    blockedRuns: number;
    avgOverall: number;
    avgQuality: number;
    avgSeo: number;
    avgConversion: number;
    avgCompliance: number;
    avgAccuracy: number;
    avgHallucinationRisk: number;
    avgDurationMs: number;
    byProvider: { provider: string; count: number }[];
  };
  apiUsage: {
    totalRuns: number;
    runs24h: number;
    runs7d: number;
    completedRuns: number;
    blockedRuns: number;
    failedRuns: number;
    trackedTokens: boolean;
    trackedCost: boolean;
    providerUsage: {
      provider: string;
      model: string | null;
      totalRuns: number;
      completedRuns: number;
      blockedRuns: number;
      failedRuns: number;
      successRate: number;
      avgDurationMs: number;
      generatedImages: number;
      lastUsedAt: string | null;
    }[];
  };
  recentRuns: {
    id: string;
    provider: string | null;
    model: string | null;
    status: string;
    blocked: boolean;
    overallScore: number;
    complianceScore: number;
    accuracyScore: number;
    hallucinationRisk: number;
    policyStatus: string | null;
    durationMs: number;
    createdAt: string;
  }[];
  features: { name: string; status: string }[];
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    accountStatus: string;
    suspendedAt: string | null;
    emailVerified: boolean;
    createdAt: string;
    workspaceId: string | null;
    workspaceName: string | null;
    plan: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    credits: number;
    creditsUsed: number;
  }[];
  recentOrgs: {
    id: string;
    name: string;
    plan: string;
    status: string;
    credits: number;
    creditsUsed: number;
    members: number;
    projects: number;
    ownerName: string | null;
    ownerEmail: string;
    createdAt: string;
  }[];
}

function normalizeAdminStatus(payload: AdminStatusData): AdminStatusData {
  const accuracy = payload.accuracy ?? {
    completedRuns: 0,
    blockedRuns: 0,
    avgOverall: 0,
    avgQuality: 0,
    avgSeo: 0,
    avgConversion: 0,
    avgCompliance: 0,
    avgAccuracy: 0,
    avgHallucinationRisk: 0,
    avgDurationMs: 0,
    byProvider: [],
  };

  return {
    ...payload,
    providers: payload.providers ?? [],
    counts: payload.counts ?? {},
    accuracy,
    apiUsage: payload.apiUsage ?? {
      totalRuns: payload.counts?.workflowRuns ?? 0,
      runs24h: 0,
      runs7d: 0,
      completedRuns: accuracy.completedRuns,
      blockedRuns: accuracy.blockedRuns,
      failedRuns: 0,
      trackedTokens: false,
      trackedCost: false,
      providerUsage: [],
    },
    recentRuns: payload.recentRuns ?? [],
    features: payload.features ?? [],
    recentUsers: payload.recentUsers ?? [],
    recentOrgs: payload.recentOrgs ?? [],
  };
}

export function useAdminStatus() {
  const [data, setData] = useState<AdminStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/status', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.status === 401 || response.status === 403) {
        setForbidden(true);
        setData(null);
        return;
      }
      if (!response.ok) throw new Error('Could not load the administration report.');
      setForbidden(false);
      setData(normalizeAdminStatus(await response.json()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the administration report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, forbidden, error, reload: load };
}
