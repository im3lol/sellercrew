import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppView = 'landing' | 'auth' | 'dashboard';
export type AuthPage = 'login' | 'register' | 'forgot-password' | 'verify-email';
export type DashboardPage =
  | 'home'
  | 'projects'
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
  | 'admin-users'
  | 'admin-orgs'
  | 'admin-subscriptions'
  | 'admin-analytics';

export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  logo: string | null;
  role: UserRole;
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
  logout: () => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'landing',
      authPage: 'login',
      dashboardPage: 'home',
      selectedAgent: null,
      sidebarOpen: true,
      isAuthenticated: false,
      user: null,
      workspaces: [],
      activeWorkspace: null,

      setView: (view) => set({ view }),
      setAuthPage: (authPage) => set({ authPage }),
      setDashboardPage: (dashboardPage) => set({ dashboardPage }),
      setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      login: (user) => set({ isAuthenticated: true, user, view: 'dashboard' }),
      logout: () => set({
        isAuthenticated: false,
        user: null,
        view: 'landing',
        dashboardPage: 'home',
        workspaces: [],
        activeWorkspace: null,
      }),

      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
    }),
    {
      name: 'sellercrew-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activeWorkspace: state.activeWorkspace,
        workspaces: state.workspaces,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
