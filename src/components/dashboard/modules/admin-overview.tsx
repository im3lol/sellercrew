'use client';

import {
  Activity,
  Database,
  ShieldCheck,
  Cpu,
  Users,
  Building2,
  FolderKanban,
  FileText,
  Gauge,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
  Timer,
  Zap,
  ImageIcon,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminStatus } from '@/components/admin/admin-status';

export function AdminOverview() {
  const { data, loading, forbidden, error, reload } = useAdminStatus();

  if (forbidden) return <Forbidden />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Database className="h-10 w-10 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-800">System report unavailable</h3>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={reload}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const c = data.counts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">System Status & Report</h2>
          <p className="text-sm text-slate-500">Live health, data, accuracy, and development status.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={reload}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Health */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard icon={Database} label="Database" ok={data.health.database} okText="Connected" badText="Unreachable" />
        <HealthCard icon={ShieldCheck} label="Session secret" ok={data.health.sessionSecret} okText="Configured" badText="Missing" />
        <HealthCard icon={Cpu} label="AI providers" ok={data.health.anyProvider} okText="Available" badText="None configured" />
        <HealthCard icon={Activity} label="App URL" ok value={data.health.appUrl} />
      </div>

      {/* Counts */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={Users} label="Users" value={c.users} />
        <Stat icon={Building2} label="Workspaces" value={c.organizations} />
        <Stat icon={FolderKanban} label="Projects" value={c.projects} />
        <Stat icon={FileText} label="Policy docs" value={c.policyDocuments} />
        <Stat icon={ShieldCheck} label="Active rules" value={c.activeRules} />
        <Stat icon={Gauge} label="Workflow runs" value={c.workflowRuns} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accuracy */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#035EF9]" />
            <h3 className="text-sm font-semibold text-slate-800">Accuracy & Quality (completed runs)</h3>
          </div>
          {data.accuracy.completedRuns === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No completed workflow runs yet. Generate a listing to start collecting accuracy data.
            </p>
          ) : (
            <div className="space-y-3">
              <ScoreBar label="Overall" value={data.accuracy.avgOverall} />
              <ScoreBar label="Accuracy" value={data.accuracy.avgAccuracy} />
              <ScoreBar label="Compliance" value={data.accuracy.avgCompliance} />
              <ScoreBar label="SEO" value={data.accuracy.avgSeo} />
              <ScoreBar label="Conversion" value={data.accuracy.avgConversion} />
              <ScoreBar label="Quality" value={data.accuracy.avgQuality} />
              <ScoreBar label="Hallucination risk" value={data.accuracy.avgHallucinationRisk} invert />
              <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-500">
                <Badge variant="outline">{data.accuracy.completedRuns} completed</Badge>
                <Badge variant="outline" className="text-amber-600">{data.accuracy.blockedRuns} blocked</Badge>
                <Badge variant="outline">~{Math.round(data.accuracy.avgDurationMs / 1000)}s avg</Badge>
                {data.accuracy.byProvider.map((p) => (
                  <Badge key={p.provider} variant="outline">{p.provider}: {p.count}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Development status */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">Development Status</h3>
          </div>
          <div className="space-y-2">
            {data.features.map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{f.name}</span>
                <FeatureBadge status={f.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* API usage */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#7E44E6]" />
              <h3 className="text-sm font-bold text-slate-900">API usage & provider data</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Usage recorded from full listing workflow runs.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
            <Info className="h-3.5 w-3.5" />
            Token and cost tracking is not enabled yet.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
          <UsageMetric label="Total runs" value={data.apiUsage.totalRuns} />
          <UsageMetric label="Last 24 hours" value={data.apiUsage.runs24h} />
          <UsageMetric label="Last 7 days" value={data.apiUsage.runs7d} />
          <UsageMetric label="Completed" value={data.apiUsage.completedRuns} tone="green" />
          <UsageMetric label="Blocked" value={data.apiUsage.blockedRuns} tone="amber" />
          <UsageMetric label="Failed" value={data.apiUsage.failedRuns} tone="red" />
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {data.providers.map((provider) => {
            const usageRows = data.apiUsage.providerUsage.filter((usage) => usage.provider === provider.id);
            const totalRuns = usageRows.reduce((total, usage) => total + usage.totalRuns, 0);
            const completedRuns = usageRows.reduce((total, usage) => total + usage.completedRuns, 0);
            const blockedRuns = usageRows.reduce((total, usage) => total + usage.blockedRuns, 0);
            const generatedImages = usageRows.reduce((total, usage) => total + usage.generatedImages, 0);
            const weightedDuration = usageRows.reduce((total, usage) => total + usage.avgDurationMs * usage.totalRuns, 0);
            const avgDurationMs = totalRuns ? Math.round(weightedDuration / totalRuns) : 0;
            const successRate = totalRuns ? Math.round((completedRuns / totalRuns) * 100) : 0;
            const lastUsedAt = usageRows
              .map((usage) => usage.lastUsedAt)
              .filter((value): value is string => Boolean(value))
              .sort()
              .at(-1);

            return (
              <div key={provider.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{provider.label}</p>
                    <p className="truncate text-xs text-slate-500">{provider.model}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={provider.configured ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'text-slate-400'}
                  >
                    {provider.configured ? 'Configured' : 'Not set'}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ProviderMetric label="Runs" value={totalRuns} />
                  <ProviderMetric label="Success" value={totalRuns ? `${successRate}%` : '—'} />
                  <ProviderMetric label="Avg time" value={totalRuns ? formatDuration(avgDurationMs) : '—'} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {completedRuns} completed</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> {blockedRuns} blocked</span>
                  <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5 text-[#7E44E6]" /> {generatedImages} images</span>
                  <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-slate-400" /> {lastUsedAt ? `Last used ${new Date(lastUsedAt).toLocaleString()}` : 'No recorded usage'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent runs */}
      {data.recentRuns.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Recent workflow runs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Overall</th>
                  <th className="px-3 py-2 font-medium">Compliance</th>
                  <th className="px-3 py-2 font-medium">Halluc.</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRuns.map((r) => (
                  <tr key={r.id} className="border-t border-slate-50">
                    <td className="px-5 py-2 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-600">{r.provider ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={r.blocked ? 'text-amber-600' : 'text-emerald-600'}>
                        {r.blocked ? 'blocked' : r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{r.overallScore}</td>
                    <td className="px-3 py-2 text-slate-700">{r.complianceScore}</td>
                    <td className="px-3 py-2 text-slate-700">{r.hallucinationRisk}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users & orgs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MiniTable
          title="Recent users"
          rows={data.recentUsers.slice(0, 10).map((u) => [u.name || u.email, u.email, new Date(u.createdAt).toLocaleDateString()])}
          headers={['Name', 'Email', 'Joined']}
          empty="No users yet."
        />
        <MiniTable
          title="Workspaces"
          rows={data.recentOrgs.slice(0, 10).map((o) => [o.name, `${o.plan} · ${o.credits} cr`, `${o.members} member(s) · ${o.projects} project(s)`])}
          headers={['Workspace', 'Plan', 'Activity']}
          empty="No workspaces yet."
        />
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, label, ok, okText, badText, value }: { icon: React.ElementType; label: string; ok: boolean; okText?: string; badText?: string; value?: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ok ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <Icon className={`h-4 w-4 ${ok ? 'text-emerald-600' : 'text-red-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`truncate text-sm font-medium ${ok ? 'text-slate-800' : 'text-red-600'}`}>
          {value ?? (ok ? okText : badText)}
        </p>
      </div>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-slate-300" />
      <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? 0}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}

function UsageMetric({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'green' | 'amber' | 'red' }) {
  const color = tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : tone === 'red' ? 'text-red-600' : 'text-slate-900';
  return (
    <div className="bg-white px-4 py-3">
      <p className={`text-xl font-extrabold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function ProviderMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-base font-extrabold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function formatDuration(durationMs: number) {
  if (durationMs < 1_000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${Math.round(durationMs / 1_000)}s`;
  return `${Math.round(durationMs / 60_000)}m`;
}

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value <= 25 : value >= 70;
  const mid = invert ? value <= 50 : value >= 45;
  const color = good ? 'bg-emerald-500' : mid ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value}{invert ? '%' : ''}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function FeatureBadge({ status }: { status: string }) {
  if (status === 'live') return <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Live</Badge>;
  if (status === 'disabled') return <Badge variant="outline" className="gap-1 text-slate-400"><MinusCircle className="h-3 w-3" /> Disabled</Badge>;
  return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200"><XCircle className="h-3 w-3" /> Planned</Badge>;
}

function MiniTable({ title, headers, rows, empty }: { title: string; headers: string[]; rows: string[][]; empty: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                {headers.map((h) => <th key={h} className="px-5 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-50">
                  {row.map((cell, j) => <td key={j} className="px-5 py-2 text-slate-600">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldCheck className="h-10 w-10 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-800">Admin access required</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">This area is restricted to platform administrators.</p>
    </div>
  );
}
