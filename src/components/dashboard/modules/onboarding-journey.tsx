'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, FolderPlus, Sparkles, Cloud, X, Rocket } from 'lucide-react';
import { useAppStore, type DashboardPage } from '@/lib/store';
import { useDashboardStore } from '@/lib/dashboard-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  done: boolean;
  cta: string;
  page: DashboardPage;
  optional?: boolean;
}

export function OnboardingJourney() {
  const setDashboardPage = useAppStore((s) => s.setDashboardPage);
  const activeWorkspace = useAppStore((s) => s.activeWorkspace);
  const user = useAppStore((s) => s.user);
  const projects = useDashboardStore((s) => s.projects);
  const listings = useDashboardStore((s) => s.listings);
  const dismissed = useDashboardStore((s) => s.onboardingDismissed);
  const dismissOnboarding = useDashboardStore((s) => s.dismissOnboarding);

  const [driveConnected, setDriveConnected] = useState(false);

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    let active = true;
    fetch(`/api/google-drive?workspaceId=${encodeURIComponent(activeWorkspace.id)}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setDriveConnected(Boolean(data.connected));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeWorkspace?.id]);

  const steps: Step[] = [
    {
      id: 'project',
      title: 'Create your first product project',
      description: 'A project holds one product, its assets, and its generated listing.',
      icon: FolderPlus,
      done: projects.length > 0,
      cta: 'New project',
      page: 'projects',
    },
    {
      id: 'workflow',
      title: 'Run the Full Listing Workflow',
      description: 'Let the 11-agent crew produce a compliant, evidence-locked Amazon listing.',
      icon: Sparkles,
      done: listings.length > 0,
      cta: 'Generate a listing',
      page: 'listing-builder',
    },
    {
      id: 'drive',
      title: 'Connect Google Drive',
      description: 'Back up your product images and listings to your own Drive (optional).',
      icon: Cloud,
      done: driveConnected,
      cta: 'Connect Drive',
      page: 'account-settings',
      optional: true,
    },
  ];

  const required = steps.filter((s) => !s.optional);
  const completed = steps.filter((s) => s.done).length;
  const allRequiredDone = required.every((s) => s.done);

  if (dismissed || allRequiredDone) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#7E44E6]/15 bg-gradient-to-br from-[#035EF9]/5 via-white to-[#7E44E6]/8 p-5">
      <button
        type="button"
        aria-label="Dismiss onboarding"
        onClick={dismissOnboarding}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#035EF9] to-[#7E44E6] text-white">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h2>
          <p className="text-xs text-slate-500">Get your first Amazon listing live in three steps.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={(completed / steps.length) * 100} className="h-2 flex-1" />
        <span className="text-xs font-medium text-slate-500">{completed}/{steps.length}</span>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-xl border bg-white/70 p-3 ${
              step.done ? 'border-emerald-200' : 'border-slate-200'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step.done ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                {step.title}
                {step.optional && <span className="text-[10px] font-normal text-slate-400">optional</span>}
              </p>
              <p className="truncate text-xs text-slate-500">{step.description}</p>
            </div>
            {!step.done && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1 text-xs"
                onClick={() => setDashboardPage(step.page)}
              >
                {step.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
