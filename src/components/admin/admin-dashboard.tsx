'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Bot,
  FileSearch,
  Target,
  TrendingUp,
  Eye,
  LogOut,
  ArrowLeft,
  Menu,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AdminOverview } from '@/components/dashboard/modules/admin-overview';
import { PolicyBank } from '@/components/dashboard/modules/policy-bank';
import { AdminSettings } from '@/components/dashboard/modules/admin-settings';
import { AgentsView } from '@/components/dashboard/modules/agents-view';
import { ListingAnalyzer } from '@/components/dashboard/modules/listing-analyzer';
import { CompetitorAnalyzer } from '@/components/dashboard/modules/competitor-analyzer';
import { KeywordCenter } from '@/components/dashboard/modules/keyword-center';
import { ImageBriefGenerator } from '@/components/dashboard/modules/image-brief-generator';

type AdminPage =
  | 'overview'
  | 'policies'
  | 'settings'
  | 'agents'
  | 'listing-review'
  | 'competitors'
  | 'keywords'
  | 'images';

const NAV: { label: string; items: { id: AdminPage; label: string; icon: React.ElementType }[] }[] = [
  {
    label: 'System',
    items: [
      { id: 'overview', label: 'System Status', icon: LayoutDashboard },
      { id: 'policies', label: 'Policy Bank', icon: ShieldCheck },
      { id: 'settings', label: 'Settings & API', icon: Settings },
    ],
  },
  {
    label: 'Workspace Tools',
    items: [
      { id: 'agents', label: 'AI Agents', icon: Bot },
      { id: 'listing-review', label: 'Listing Review', icon: FileSearch },
      { id: 'competitors', label: 'Market & Competitors', icon: Target },
      { id: 'keywords', label: 'Keywords & SEO', icon: TrendingUp },
      { id: 'images', label: 'Images & A+ Content', icon: Eye },
    ],
  },
];

const TITLES: Record<AdminPage, string> = {
  overview: 'System Status & Report',
  policies: 'Policy Knowledge Base',
  settings: 'Settings & API',
  agents: 'AI Agents',
  'listing-review': 'Listing Review',
  competitors: 'Market & Competitors',
  keywords: 'Keywords & SEO',
  images: 'Images & A+ Content',
};

function renderPage(page: AdminPage) {
  switch (page) {
    case 'overview':
      return <AdminOverview />;
    case 'policies':
      return <PolicyBank />;
    case 'settings':
      return <AdminSettings />;
    case 'agents':
      return <AgentsView />;
    case 'listing-review':
      return <ListingAnalyzer />;
    case 'competitors':
      return <CompetitorAnalyzer />;
    case 'keywords':
      return <KeywordCenter />;
    case 'images':
      return <ImageBriefGenerator />;
    default:
      return <AdminOverview />;
  }
}

export function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const [page, setPage] = useState<AdminPage>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    useAppStore.getState().logout();
    window.location.href = '/';
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-64 shrink-0 flex-col bg-[#0B0F1A] text-white md:flex`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#035EF9] to-[#7E44E6] text-sm font-bold">
            S
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">SellerCrew</p>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <a
            href="/"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to app
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-slate-500" />
            </button>
            <h1 className="text-base font-semibold text-slate-900">{TITLES[page]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{user?.email}</span>
            <span className="rounded-full bg-[#0B0F1A] px-2.5 py-1 text-[11px] font-medium text-white">Admin</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{renderPage(page)}</main>
      </div>
    </div>
  );
}
