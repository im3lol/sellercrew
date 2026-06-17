'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  FileText,
  FolderKanban,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppStore, type DashboardPage } from '@/lib/store';
import { useDashboardStore } from '@/lib/dashboard-store';
import { Button } from '@/components/ui/button';

interface TourStep {
  kicker: string;
  title: string;
  description: string;
  highlights: string[];
  icon: React.ElementType;
  /** Optional jump target for the final "Get started" action. */
  page?: DashboardPage;
}

const STEPS: TourStep[] = [
  {
    kicker: 'Welcome aboard',
    title: 'Meet SellerCrew',
    description:
      'Your AI crew that turns a single product into a compliant, high-converting Amazon listing — research, copy, compliance, and images, end to end.',
    highlights: ['11 specialist AI agents', 'Evidence-locked, policy-safe output', 'A quick 60-second tour'],
    icon: Sparkles,
  },
  {
    kicker: 'Step 1 · Organize',
    title: 'Projects keep each product tidy',
    description:
      'Every product lives in its own project — its source images, generated listing, and history all in one place.',
    highlights: ['One project per product', 'Switch products in a click', 'Nothing gets mixed up'],
    icon: FolderKanban,
  },
  {
    kicker: 'Step 2 · Generate',
    title: 'The crew writes your listing',
    description:
      'Run the Full Listing Workflow and the 11-agent crew — Ali, Saleem, Noor, Raed and the rest — researches, writes, checks compliance, and designs the images for you.',
    highlights: ['Title, bullets, description & keywords', 'Compliance gate before delivery', 'Product images generated for you'],
    icon: Bot,
  },
  {
    kicker: 'Step 3 · Review',
    title: 'Listings & assets, ready to use',
    description:
      'Review and edit everything the crew produced. Generated images are backed up to your own Google Drive automatically.',
    highlights: ['Edit title, bullets & keywords', 'Compliance score per listing', 'Images saved to your Drive'],
    icon: FileText,
  },
  {
    kicker: 'Step 4 · Go deeper',
    title: 'Standalone tools when you need them',
    description:
      'Beyond the full workflow, use any tool on its own — keyword research, competitor analysis, listing review, and policy checks.',
    highlights: ['Keyword & SEO research', 'Market & competitor analysis', 'Listing review & policy check'],
    icon: BarChart3,
  },
  {
    kicker: "You're all set",
    title: 'Create your first project',
    description:
      'That’s the whole tour. Start a project, run the workflow, and your first listing is minutes away.',
    highlights: ['Start with one product', 'Run the Full Listing Workflow', 'Refine and publish'],
    icon: Rocket,
    page: 'projects',
  },
];

export function OnboardingJourney() {
  const setDashboardPage = useAppStore((s) => s.setDashboardPage);
  const user = useAppStore((s) => s.user);
  const dismissed = useDashboardStore((s) => s.onboardingDismissed);
  const dismissOnboarding = useDashboardStore((s) => s.dismissOnboarding);
  const [index, setIndex] = useState(0);

  if (dismissed) return null;

  const step = STEPS[index];
  const StepIcon = step.icon;
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const firstName = user?.name ? user.name.split(' ')[0] : null;

  const finish = (page?: DashboardPage) => {
    dismissOnboarding();
    if (page) setDashboardPage(page);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SellerCrew product tour"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Local keyframes for the left-panel effects (kept off the global bundle). */}
      <style>{`
        @keyframes sc-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes sc-blob {
          0%,100%{ transform: translate(0,0) scale(1); }
          33%{ transform: translate(12px,-14px) scale(1.12); }
          66%{ transform: translate(-10px,10px) scale(0.94); }
        }
        @keyframes sc-shine { 0%{ background-position: 0% 50% } 100%{ background-position: 200% 50% } }
        .sc-float{ animation: sc-float 3.2s ease-in-out infinite; }
        .sc-blob{ animation: sc-blob 9s ease-in-out infinite; }
        .sc-shine{ background-size: 200% 200%; animation: sc-shine 6s linear infinite; }
      `}</style>

      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-300 md:flex-row md:max-h-[88vh]">
        <button
          type="button"
          aria-label="Skip tour"
          onClick={() => finish()}
          className="absolute right-4 top-4 z-20 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white md:text-slate-300 md:hover:bg-slate-100 md:hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Left animated panel ─────────────────────────────── */}
        <div className="sc-shine relative flex shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#035EF9] via-[#7E44E6] to-[#FC7403] p-8 text-white md:w-2/5">
          {/* floating blobs */}
          <div className="sc-blob pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="sc-blob pointer-events-none absolute -bottom-12 right-0 h-44 w-44 rounded-full bg-white/10 blur-2xl" style={{ animationDelay: '1.5s' }} />

          <div className="relative flex items-center gap-2.5">
            {/* colorful app-icon tile, edge-to-edge (no white frame) */}
            <img
              src="/logo2.png"
              alt="SellerCrew"
              className="h-10 w-10 rounded-xl object-cover shadow-lg ring-1 ring-white/40"
            />
            <span className="text-lg font-extrabold tracking-tight drop-shadow-sm">sellercrew</span>
          </div>

          <div key={index} className="relative my-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 slide-in-from-left-3 duration-500">
            <span className="sc-float flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <StepIcon className="h-11 w-11" />
            </span>
            <p className="mt-5 text-sm font-medium uppercase tracking-wider text-white/80">{step.kicker}</p>
          </div>

          <div className="relative flex items-center gap-1.5">
            {STEPS.map((_, d) => (
              <span
                key={d}
                className={`h-1.5 rounded-full transition-all duration-300 ${d === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* ── Right content panel ─────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto p-8">
          <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isFirst && firstName && (
              <p className="mb-1 text-sm font-medium text-[#7E44E6]">Hi {firstName} 👋</p>
            )}
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>

            <ul className="mt-5 space-y-2.5">
              {step.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#035EF9]/10 text-[#035EF9]">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            <span className="text-xs font-medium text-slate-400">
              {index + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500" onClick={() => setIndex((i) => i - 1)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {isLast ? (
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-[#035EF9] to-[#7E44E6] hover:opacity-90"
                  onClick={() => finish(step.page)}
                >
                  Get started <Rocket className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => setIndex((i) => i + 1)}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {!isLast && (
            <button
              type="button"
              onClick={() => finish()}
              className="mt-3 self-end text-xs text-slate-400 transition hover:text-slate-600"
            >
              Skip the tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
