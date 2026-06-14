'use client';

import { useState } from 'react';
import {
  BarChart3,
  Building2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AdminOverview } from '@/components/dashboard/modules/admin-overview';
import { PolicyBank } from '@/components/dashboard/modules/policy-bank';
import { AdminSettings } from '@/components/dashboard/modules/admin-settings';
import {
  AdminAnalytics,
  AdminOrganizations,
  AdminSubscriptions,
  AdminUsers,
} from '@/components/admin/admin-management';

type AdminPage = 'overview' | 'users' | 'organizations' | 'subscriptions' | 'analytics' | 'policies' | 'settings';

const NAV: { label: string; items: { id: AdminPage; label: string; icon: React.ElementType }[] }[] = [
  {
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'organizations', label: 'Workspaces', icon: Building2 },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: 'analytics', label: 'Reports & analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Governance',
    items: [
      { id: 'policies', label: 'Policy knowledge', icon: ShieldCheck },
      { id: 'settings', label: 'AI & system settings', icon: Settings },
    ],
  },
];

const TITLES: Record<AdminPage, { title: string; description: string }> = {
  overview: { title: 'Admin overview', description: 'Platform health and operating status' },
  users: { title: 'Users', description: 'Platform accounts and access levels' },
  organizations: { title: 'Workspaces', description: 'Seller organizations and ownership' },
  subscriptions: { title: 'Subscriptions', description: 'Plans, status, and credit usage' },
  analytics: { title: 'Reports & analytics', description: 'Workflow quality and platform activity' },
  policies: { title: 'Policy knowledge', description: 'Saleem compliance rules and sources' },
  settings: { title: 'AI & system settings', description: 'Providers, models, and workflow controls' },
};

function renderPage(page: AdminPage) {
  switch (page) {
    case 'users':
      return <AdminUsers />;
    case 'organizations':
      return <AdminOrganizations />;
    case 'subscriptions':
      return <AdminSubscriptions />;
    case 'analytics':
      return <AdminAnalytics />;
    case 'policies':
      return <PolicyBank />;
    case 'settings':
      return <AdminSettings />;
    default:
      return <AdminOverview />;
  }
}

export function AdminDashboard({ adminEmail, onSignedOut }: { adminEmail: string; onSignedOut: () => void }) {
  const [page, setPage] = useState<AdminPage>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = TITLES[page];
  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null);
    onSignedOut();
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F8F9FB] text-[#0B0F1A]">
      <aside
        className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-[272px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex`}
      >
        <div className="flex h-[70px] items-center justify-between border-b border-slate-100 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#035EF9] via-[#7E44E6] to-[#FC7403] p-1 shadow-sm shadow-[#7E44E6]/20">
              <div className="h-full w-full overflow-hidden rounded-[9px] bg-white">
                <img src="/agents/ali.png" alt="SellerCrew" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold tracking-[-0.055em] text-[#07101f]">sellercrew</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7E44E6]">Admin console</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mt-4 rounded-xl border border-[#7E44E6]/15 bg-gradient-to-br from-[#035EF9]/5 to-[#7E44E6]/8 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#7E44E6]" />
            <p className="text-xs font-bold text-slate-800">Restricted administration</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">Platform data, policies, providers, and system reports.</p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPage(item.id);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#035EF9]/10 text-[#035EF9]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#035EF9]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/35 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <span>Administration</span>
                <ChevronRight className="h-3 w-3" />
                <span className="truncate text-slate-600">{meta.title}</span>
              </div>
              <p className="truncate text-sm font-bold text-slate-950">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden border-[#7E44E6]/20 bg-[#7E44E6]/5 text-[#6D35D4] sm:inline-flex">
              Admin only
            </Badge>
            <div className="hidden text-right lg:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">SellerCrew Admin</p>
              <p className="text-[11px] text-slate-400">{adminEmail}</p>
            </div>
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarFallback className="bg-[#0B0F1A] text-xs font-bold text-white">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">{renderPage(page)}</div>
        </main>
      </div>
    </div>
  );
}
