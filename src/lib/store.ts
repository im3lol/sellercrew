import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDashboardStore } from '@/lib/dashboard-store';

export type AppView = 'landing' | 'auth' | 'dashboard';

export interface AccountPayload {
  user: { id: string; email: string; name: string; avatar: string | null };
  workspace: {
    id: string;
    name: string;
    role: string;
    plan: string;
    credits: { balance: number; used: number };
  } | null;
}
export type AuthPage = 'login' | 'register' | 'forgot-password' | 'verify-email';
export type DashboardPage =
  | 'home'
  | 'projects'
  | 'project-detail'
  | 'listings'
  | 'assets'
  | 'listing-builder'
  | 'listing-analyzer'
  | 'competitor-analyzer'
  | 'keyword-center'
  | 'image-brief'
  | 'research-report'
  | 'compliance-check'
  | 'listing-score'
  | 'agents'
  | 'agent-performance'
  | 'agent-history'
  | 'billing'
  | 'plans'
  | 'invoices'
  | 'credits'
  | 'usage'
  | 'admin-overview'
  | 'admin-users'
  | 'admin-orgs'
  | 'admin-subscriptions'
  | 'admin-analytics'
  | 'admin-policies'
  | 'admin-settings';

export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  logo: string | null;
  role: UserRole;
  purpose?: 'account' | 'category';
  label?: string;
}

interface AppState {
  // View management
  view: AppView;
  authPage: AuthPage;
  dashboardPage: DashboardPage;
  selectedAgent: string | null;
  sidebarOpen: boolean;

  // Auth
  isAuthenticated: boolean;
  authChecked: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
  } | null;

  // Workspace
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;

  // Actions
  setView: (view: AppView) => void;
  setAuthPage: (page: AuthPage) => void;
  setDashboardPage: (page: DashboardPage) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  login: (user: AppState['user']) => void;
  applyAccount: (account: AccountPayload, navigate?: boolean) => void;
  bootstrap: () => Promise<void>;
  logout: () => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (input: Pick<Workspace, 'name' | 'purpose' | 'label'>) => Workspace;
  removeWorkspace: (workspaceId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'landing',
      authPage: 'login',
      dashboardPage: 'home',
      selectedAgent: null,
      sidebarOpen: true,
      isAuthenticated: false,
      authChecked: false,
      user: null,
      workspaces: [],
      activeWorkspace: null,

      setView: (view) => set({ view }),
      setAuthPage: (authPage) => set({ authPage }),
      setDashboardPage: (dashboardPage) => set({ dashboardPage }),
      setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      login: (user) => set((state) => {
        const defaultWorkspace: Workspace = {
          id: 'sellercrew-main',
          name: 'SellerCrew Workspace',
          logo: null,
          role: 'owner',
          purpose: 'account',
          label: 'Primary Amazon account',
        };
        const workspaces = state.workspaces.length ? state.workspaces : [defaultWorkspace];
        return {
          isAuthenticated: true,
          user,
          view: 'dashboard',
          workspaces,
          activeWorkspace: state.activeWorkspace ?? workspaces[0],
        };
      }),
      applyAccount: (account, navigate = true) => {
        set((state) => {
          const workspaces: Workspace[] = account.workspace
            ? [{
                id: account.workspace.id,
                name: account.workspace.name,
                logo: null,
                role: account.workspace.role as UserRole,
                purpose: 'account',
                label: 'Primary Amazon account',
              }]
            : state.workspaces;
          return {
            isAuthenticated: true,
            authChecked: true,
            user: account.user,
            workspaces,
            activeWorkspace: account.workspace ? workspaces[0] : state.activeWorkspace,
            view: navigate ? 'dashboard' : state.view,
          };
        });
        if (account.workspace) {
          useDashboardStore.getState().hydrateAccount({
            workspaceId: account.workspace.id,
            balance: account.workspace.credits.balance,
            used: account.workspace.credits.used,
            plan: account.workspace.plan,
          });
        }
      },

      bootstrap: async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          const data = await res.json().catch(() => null);
          if (data?.authenticated && data.user) {
            get().applyAccount({ user: data.user, workspace: data.workspace ?? null }, false);
          } else {
            set({ isAuthenticated: false, user: null, authChecked: true });
          }
        } catch {
          set({ authChecked: true });
        }
      },

      logout: () => {
        void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        set({
          isAuthenticated: false,
          authChecked: true,
          user: null,
          view: 'landing',
          dashboardPage: 'home',
          workspaces: [],
          activeWorkspace: null,
        });
      },

      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
      createWorkspace: (input) => {
        const workspace: Workspace = {
          id: crypto.randomUUID(),
          name: input.name.trim(),
          logo: null,
          role: 'owner',
          purpose: input.purpose ?? 'account',
          label: input.label?.trim() || undefined,
        };
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspace: workspace,
        }));
        return workspace;
      },
      removeWorkspace: (workspaceId) =>
        set((state) => {
          const workspaces = state.workspaces.filter((workspace) => workspace.id !== workspaceId);
          return {
            workspaces,
            activeWorkspace:
              state.activeWorkspace?.id === workspaceId
                ? workspaces[0] ?? null
                : state.activeWorkspace,
          };
        }),
    }),
    {
      name: 'sellercrew-store',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppState>;
        return {
          ...state,
          user: state.user?.name === 'Demo User'
            ? { ...state.user, name: 'SellerCrew User' }
            : state.user,
        } as AppState;
      },
      partialize: (state) => ({
        view: state.view,
        authPage: state.authPage,
        dashboardPage: state.dashboardPage,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activeWorkspace: state.activeWorkspace,
        workspaces: state.workspaces,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
