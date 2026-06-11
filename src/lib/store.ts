import { create } from 'zustand';

export type AppView = 'landing' | 'dashboard';
export type DashboardPage = 
  | 'home' 
  | 'projects' 
  | 'listing-builder' 
  | 'listing-analyzer' 
  | 'competitor-analyzer' 
  | 'keyword-center' 
  | 'image-brief' 
  | 'agents';

interface AppState {
  view: AppView;
  dashboardPage: DashboardPage;
  selectedAgent: string | null;
  sidebarOpen: boolean;
  setView: (view: AppView) => void;
  setDashboardPage: (page: DashboardPage) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  dashboardPage: 'home',
  selectedAgent: null,
  sidebarOpen: true,
  setView: (view) => set({ view }),
  setDashboardPage: (dashboardPage) => set({ dashboardPage }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
