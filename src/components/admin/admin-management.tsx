'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Clock3,
  Database,
  FileText,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Plus,
  PauseCircle,
  PlayCircle,
  Trash2,
  CalendarPlus,
  Save,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminStatus } from '@/components/admin/admin-status';

function PageState({
  loading,
  forbidden,
  error,
  onRetry,
}: {
  loading: boolean;
  forbidden: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7E44E6]" />
      </div>
    );
  }
  if (forbidden) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <ShieldCheck className="h-10 w-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-[#0B0F1A]">Admin access required</h2>
        <p className="mt-1 text-sm text-slate-500">This report is restricted to platform administrators.</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Database className="h-10 w-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-[#0B0F1A]">Report unavailable</h2>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }
  return null;
}

function PageHeader({
  eyebrow,
  title,
  description,
  onRefresh,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7E44E6]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B0F1A]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Button variant="outline" size="sm" className="gap-2 bg-white" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" /> Refresh
      </Button>
    </div>
  );
}

export function AdminUsers() {
  const state = useAdminStatus();
  const [createOpen, setCreateOpen] = useState(false);
  const [manageUser, setManageUser] = useState<AdminStatusUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'starter',
    trialDays: '14',
  });
  const [manageForm, setManageForm] = useState({ plan: 'starter', trialDays: '0' });
  if (!state.data) return <PageState {...state} onRetry={state.reload} />;

  const request = async (url: string, init: RequestInit) => {
    setSubmitting(true);
    try {
      const response = await fetch(url, {
        ...init,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'The admin action failed.');
      await state.reload();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The admin action failed.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const createUser = async () => {
    const success = await request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        ...createForm,
        trialDays: Number(createForm.trialDays),
      }),
    });
    if (!success) return;
    toast.success('User and workspace created.');
    setCreateOpen(false);
    setCreateForm({ name: '', email: '', password: '', plan: 'starter', trialDays: '14' });
  };

  const toggleStatus = async (user: AdminStatusUser) => {
    const nextStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
    const success = await request('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: user.id, accountStatus: nextStatus }),
    });
    if (success) toast.success(nextStatus === 'active' ? 'Account reactivated.' : 'Account suspended immediately.');
  };

  const saveSubscription = async () => {
    if (!manageUser) return;
    const success = await request('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: manageUser.id,
        plan: manageForm.plan,
        trialDays: Number(manageForm.trialDays),
      }),
    });
    if (!success) return;
    toast.success('Plan and trial updated.');
    setManageUser(null);
  };

  const deleteUser = async (user: AdminStatusUser) => {
    const confirmed = window.confirm(
      `Delete ${user.email}? This permanently removes the account, owned workspace, projects, listings, and related data.`
    );
    if (!confirmed) return;
    const success = await request(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
    if (success) toast.success('User and owned workspace deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7E44E6]">Access control</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B0F1A]">Platform users</h2>
          <p className="mt-1 text-sm text-slate-500">Create accounts, control access, plans, trials, and account lifecycle.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-white" onClick={state.reload}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" className="gap-2 bg-[#0B0F1A] text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add user
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Account</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Trial</th>
                <th className="px-5 py-3 font-semibold">Credits</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.data.recentUsers.map((user) => (
                <tr key={user.id} className={user.accountStatus === 'suspended' ? 'bg-slate-50/70' : 'bg-white'}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{user.name || 'Unnamed user'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{user.workspaceName || 'No workspace'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={user.accountStatus === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-red-200 bg-red-50 text-red-600'}
                    >
                      {user.accountStatus}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-700">
                    <p className="font-semibold">{user.plan}</p>
                    <p className="text-[11px] capitalize text-slate-400">{user.subscriptionStatus}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {user.trialEndsAt ? (
                      <>
                        <p>{new Date(user.trialEndsAt).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-400">{trialLabel(user.trialEndsAt)}</p>
                      </>
                    ) : 'No trial'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{user.credits.toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={submitting}
                        className={user.accountStatus === 'suspended' ? 'text-emerald-600' : 'text-amber-600'}
                        onClick={() => toggleStatus(user)}
                      >
                        {user.accountStatus === 'suspended' ? <PlayCircle className="mr-1.5 h-4 w-4" /> : <PauseCircle className="mr-1.5 h-4 w-4" />}
                        {user.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setManageUser(user);
                          setManageForm({ plan: user.plan, trialDays: '0' });
                        }}
                      >
                        <CalendarPlus className="mr-1.5 h-4 w-4" /> Manage
                      </Button>
                      <Button size="icon" variant="ghost" disabled={submitting} aria-label={`Delete ${user.email}`} onClick={() => deleteUser(user)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create customer account</DialogTitle>
            <DialogDescription>This creates the user, workspace, subscription, and starting credit balance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Full name"><Input value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></Field>
            <Field label="Temporary password"><Input type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} /></Field>
            <Field label="Plan"><PlanSelect value={createForm.plan} onChange={(plan) => setCreateForm({ ...createForm, plan })} /></Field>
            <Field label="Trial days"><Input type="number" min="0" max="365" value={createForm.trialDays} onChange={(event) => setCreateForm({ ...createForm, trialDays: event.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={submitting} onClick={createUser} className="bg-[#0B0F1A] text-white">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(manageUser)} onOpenChange={(open) => !open && setManageUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage subscription</DialogTitle>
            <DialogDescription>{manageUser?.email} · change the plan or extend/reset the trial from today.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Plan"><PlanSelect value={manageForm.plan} onChange={(plan) => setManageForm({ ...manageForm, plan })} /></Field>
            <Field label="Trial days from today"><Input type="number" min="0" max="365" value={manageForm.trialDays} onChange={(event) => setManageForm({ ...manageForm, trialDays: event.target.value })} /></Field>
          </div>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Setting trial days to 0 ends the trial and activates the selected plan immediately.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageUser(null)}>Cancel</Button>
            <Button disabled={submitting} onClick={saveSubscription} className="bg-[#0B0F1A] text-white">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type AdminStatusUser = NonNullable<ReturnType<typeof useAdminStatus>['data']>['recentUsers'][number];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function PlanSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      <option value="starter">Starter</option>
      <option value="pro">Pro</option>
      <option value="agency">Agency</option>
      <option value="enterprise">Enterprise</option>
    </select>
  );
}

function trialLabel(value: string) {
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Ends today';
  return `${days} day${days === 1 ? '' : 's'} remaining`;
}

export function AdminOrganizations() {
  const state = useAdminStatus();
  if (!state.data) return <PageState {...state} onRetry={state.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenancy"
        title="Workspaces"
        description="Organizations, owners, membership, projects, and credit balances."
        onRefresh={state.reload}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {state.data.recentOrgs.map((org) => (
          <Card key={org.id} className="border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#035EF9]/8 text-[#035EF9]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900">{org.name}</h3>
                  <p className="truncate text-xs text-slate-500">{org.ownerName || org.ownerEmail} · {org.ownerEmail}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">{org.status}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <SmallMetric label="Members" value={org.members} />
              <SmallMetric label="Projects" value={org.projects} />
              <SmallMetric label="Credits" value={org.credits.toLocaleString()} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="font-semibold capitalize text-[#7E44E6]">{org.plan} plan</span>
              <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminSubscriptions() {
  const state = useAdminStatus();
  if (!state.data) return <PageState {...state} onRetry={state.reload} />;

  const active = state.data.recentOrgs.filter((org) => org.status === 'active').length;
  const credits = state.data.recentOrgs.reduce((sum, org) => sum + org.credits, 0);
  const used = state.data.recentOrgs.reduce((sum, org) => sum + org.creditsUsed, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial operations"
        title="Subscriptions"
        description="Plan status and credit utilization across all workspaces."
        onRefresh={state.reload}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={BadgeCheck} label="Active subscriptions" value={active} color="#36B46F" />
        <SummaryCard icon={WalletCards} label="Credits available" value={credits.toLocaleString()} color="#035EF9" />
        <SummaryCard icon={CircleDollarSign} label="Credits consumed" value={used.toLocaleString()} color="#FC7403" />
      </div>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Workspace</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Available</th>
                <th className="px-5 py-3 font-semibold">Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.data.recentOrgs.map((org) => (
                <tr key={org.id} className="bg-white">
                  <td className="px-5 py-4 font-semibold text-slate-900">{org.name}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{org.plan}</td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={org.status === 'active' ? 'border-emerald-200 text-emerald-600' : 'text-amber-600'}>
                      {org.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{org.credits.toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-600">{org.creditsUsed.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AdminAnalytics() {
  const state = useAdminStatus();
  if (!state.data) return <PageState {...state} onRetry={state.reload} />;

  const { counts, accuracy } = state.data;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin report"
        title="Platform analytics"
        description="Operational volume, workflow quality, and AI execution performance."
        onRefresh={state.reload}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Users" value={counts.users ?? 0} color="#035EF9" />
        <SummaryCard icon={Building2} label="Workspaces" value={counts.organizations ?? 0} color="#7E44E6" />
        <SummaryCard icon={FileText} label="Listings" value={counts.listings ?? 0} color="#FC7403" />
        <SummaryCard icon={Sparkles} label="Workflow runs" value={counts.workflowRuns ?? 0} color="#E82E33" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#035EF9]" />
            <h3 className="font-bold text-slate-900">Quality report</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <QualityBar label="Overall" value={accuracy.avgOverall} />
            <QualityBar label="Accuracy" value={accuracy.avgAccuracy} />
            <QualityBar label="Compliance" value={accuracy.avgCompliance} />
            <QualityBar label="SEO" value={accuracy.avgSeo} />
            <QualityBar label="Conversion" value={accuracy.avgConversion} />
            <QualityBar label="Quality" value={accuracy.avgQuality} />
          </div>
        </Card>
        <Card className="border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[#7E44E6]" />
            <h3 className="font-bold text-slate-900">Execution</h3>
          </div>
          <div className="mt-5 space-y-4">
            <ReportRow label="Completed runs" value={accuracy.completedRuns} />
            <ReportRow label="Blocked runs" value={accuracy.blockedRuns} />
            <ReportRow label="Average duration" value={`${Math.round(accuracy.avgDurationMs / 1000)}s`} />
            <ReportRow label="Hallucination risk" value={`${accuracy.avgHallucinationRisk}%`} />
          </div>
        </Card>
      </div>
      <Card className="border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#FC7403]" />
          <h3 className="font-bold text-slate-900">Provider distribution</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {accuracy.byProvider.length ? accuracy.byProvider.map((provider) => (
            <Badge key={provider.provider} variant="outline" className="px-3 py-1.5">
              {provider.provider}: {provider.count} runs
            </Badge>
          )) : <p className="text-sm text-slate-500">No workflow provider data yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Live</Badge>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-[#0B0F1A]">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Card>
  );
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#035EF9] to-[#7E44E6]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
