"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FullWorkflowResult, StoredWorkflowRun } from "@/lib/workflow";

export type ProjectStatus = "active" | "completed" | "draft" | "archived";
export type ListingStatus = "draft" | "generated" | "reviewed" | "published";

export interface DashboardProject {
  id: string;
  name: string;
  marketplace: string;
  country: string;
  status: ProjectStatus;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardListing {
  id: string;
  projectId: string;
  productName: string;
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  complianceScore: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAsset {
  id: string;
  projectId: string | null;
  name: string;
  type: "image" | "document" | "brief";
  source: "customer" | "generated";
  dataUrl?: string;
  driveUrl?: string; // Google Drive link to the full-resolution file
  size: number;
  createdAt: string;
}

export interface DashboardActivity {
  id: string;
  agentId: string;
  action: string;
  createdAt: string;
}

interface DashboardDataState {
  workspaceId: string;
  workspaceData: Record<string, WorkspaceDashboardSnapshot>;
  projects: DashboardProject[];
  listings: DashboardListing[];
  assets: DashboardAsset[];
  activities: DashboardActivity[];
  workflowRuns: StoredWorkflowRun[];
  selectedProjectId: string | null;
  creditsBalance: number;
  creditsUsed: number;
  plan: "starter" | "pro" | "agency";
  onboardingDismissed: boolean;
  dismissOnboarding: () => void;
  loadProjects: () => Promise<void>;
  loadListings: () => Promise<void>;
  createProject: (name: string) => DashboardProject;
  updateProject: (id: string, patch: Partial<DashboardProject>) => void;
  deleteProject: (id: string) => void;
  setSelectedProject: (id: string | null) => void;
  saveListing: (listing: Omit<DashboardListing, "id" | "createdAt" | "updatedAt">) => void;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  deleteListing: (id: string) => void;
  addAssets: (assets: Omit<DashboardAsset, "id" | "createdAt">[]) => void;
  attachAssetDriveLinks: (links: { name: string; driveUrl: string }[]) => void;
  deleteAsset: (id: string) => void;
  addActivity: (agentId: string, action: string) => void;
  startWorkflowRun: (projectId: string) => string;
  completeWorkflowRun: (runId: string, result: FullWorkflowResult) => void;
  failWorkflowRun: (runId: string, error: string) => void;
  consumeCredits: (amount: number) => boolean;
  setPlan: (plan: DashboardDataState["plan"]) => void;
  hydrateAccount: (args: { workspaceId: string; balance: number; used: number; plan: string }) => void;
  switchWorkspace: (workspaceId: string) => void;
  removeWorkspaceData: (workspaceId: string) => void;
}

interface WorkspaceDashboardSnapshot {
  projects: DashboardProject[];
  listings: DashboardListing[];
  assets: DashboardAsset[];
  activities: DashboardActivity[];
  workflowRuns: StoredWorkflowRun[];
  selectedProjectId: string | null;
  creditsBalance: number;
  creditsUsed: number;
  plan: "starter" | "pro" | "agency";
}

// Keep heavy full-resolution base64 images out of localStorage (quota / data
// loss). Generated images live in the live result and in Google Drive; only
// lightweight metadata is persisted, capped to recent runs.
function stripRunImages(runs: StoredWorkflowRun[] | undefined): StoredWorkflowRun[] {
  return (runs ?? []).slice(0, 20).map((run) =>
    run.result?.generatedImages?.length
      ? {
          ...run,
          result: {
            ...run.result,
            generatedImages: run.result.generatedImages.map((image) => ({ ...image, dataUrl: "" })),
          },
        }
      : run
  );
}

export const useDashboardStore = create<DashboardDataState>()(
  persist(
    (set, get) => ({
      workspaceId: "sellercrew-main",
      workspaceData: {},
      projects: [],
      listings: [],
      assets: [],
      activities: [],
      workflowRuns: [],
      selectedProjectId: null,
      creditsBalance: 5000,
      creditsUsed: 0,
      plan: "pro",
      onboardingDismissed: false,

      dismissOnboarding: () => set({ onboardingDismissed: true }),

      loadProjects: async () => {
        try {
          const res = await fetch("/api/projects", { credentials: "include" });
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data.projects)) return;
          set((state) => ({
            projects: data.projects as DashboardProject[],
            selectedProjectId: data.projects.some((p: DashboardProject) => p.id === state.selectedProjectId)
              ? state.selectedProjectId
              : data.projects[0]?.id ?? null,
          }));
        } catch {
          // Offline / not signed in — keep the cached projects.
        }
      },

      createProject: (name) => {
        const timestamp = new Date().toISOString();
        const project: DashboardProject = {
          id: crypto.randomUUID(),
          name: name.trim() || "Untitled Project",
          marketplace: "Amazon Egypt",
          country: "Egypt",
          status: "draft",
          agentId: "ali",
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({
          projects: [project, ...state.projects],
          selectedProjectId: project.id,
        }));
        void fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: project.id,
            name: project.name,
            marketplace: project.marketplace,
            country: project.country,
            status: project.status,
            agentId: project.agentId,
          }),
        }).catch(() => {});
        return project;
      },

      updateProject: (id, patch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...patch, updatedAt: new Date().toISOString() }
              : project
          ),
        }));
        void fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        }).catch(() => {});
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          listings: state.listings.filter((listing) => listing.projectId !== id),
          assets: state.assets.filter((asset) => asset.projectId !== id),
          workflowRuns: state.workflowRuns.filter((run) => run.projectId !== id),
          selectedProjectId:
            state.selectedProjectId === id ? state.projects.find((project) => project.id !== id)?.id ?? null : state.selectedProjectId,
        }));
        void fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
      },

      setSelectedProject: (selectedProjectId) => set({ selectedProjectId }),

      loadListings: async () => {
        try {
          const res = await fetch("/api/listings", { credentials: "include" });
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data.listings)) set({ listings: data.listings as DashboardListing[] });
        } catch {
          // Offline / not signed in — keep cached listings.
        }
      },

      saveListing: (listing) => {
        const timestamp = new Date().toISOString();
        const existing = get().listings.find(
          (item) => item.projectId === listing.projectId && item.productName === listing.productName
        );
        const id = existing?.id ?? crypto.randomUUID();
        set((state) => ({
          listings: existing
            ? state.listings.map((item) =>
                item.id === existing.id ? { ...item, ...listing, updatedAt: timestamp } : item
              )
            : [
                { ...listing, id, createdAt: timestamp, updatedAt: timestamp },
                ...state.listings,
              ],
          projects: state.projects.map((project) =>
            project.id === listing.projectId
              ? { ...project, status: "active", updatedAt: timestamp }
              : project
          ),
        }));
        void fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            projectId: listing.projectId,
            productName: listing.productName,
            title: listing.title,
            bullets: listing.bullets,
            description: listing.description,
            keywords: listing.keywords,
            complianceScore: listing.complianceScore,
            status: listing.status,
          }),
        }).catch(() => {});
        void fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: listing.projectId, status: "active" }),
        }).catch(() => {});
      },

      updateListingStatus: (id, status) => {
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === id
              ? { ...listing, status, updatedAt: new Date().toISOString() }
              : listing
          ),
        }));
        void fetch("/api/listings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        }).catch(() => {});
      },

      deleteListing: (id) => {
        set((state) => ({
          listings: state.listings.filter((listing) => listing.id !== id),
        }));
        void fetch(`/api/listings?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
      },

      addAssets: (assets) =>
        set((state) => ({
          assets: [
            ...assets.map((asset) => ({
              ...asset,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            })),
            ...state.assets,
          ],
        })),

      attachAssetDriveLinks: (links) =>
        set((state) => {
          if (!links.length) return state;
          const byName = new Map(links.map((link) => [link.name, link.driveUrl]));
          return {
            assets: state.assets.map((asset) =>
              byName.has(asset.name) ? { ...asset, driveUrl: byName.get(asset.name) } : asset
            ),
          };
        }),

      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        })),

      addActivity: (agentId, action) =>
        set((state) => ({
          activities: [
            {
              id: crypto.randomUUID(),
              agentId,
              action,
              createdAt: new Date().toISOString(),
            },
            ...state.activities,
          ].slice(0, 50),
        })),

      startWorkflowRun: (projectId) => {
        const run: StoredWorkflowRun = {
          id: crypto.randomUUID(),
          projectId,
          status: "running",
          startedAt: new Date().toISOString(),
        };
        set((state) => ({ workflowRuns: [run, ...state.workflowRuns] }));
        return run.id;
      },

      completeWorkflowRun: (runId, result) =>
        set((state) => ({
          workflowRuns: state.workflowRuns.map((run) =>
            run.id === runId
              ? { ...run, status: "completed", completedAt: new Date().toISOString(), result }
              : run
          ),
        })),

      failWorkflowRun: (runId, error) =>
        set((state) => ({
          workflowRuns: state.workflowRuns.map((run) =>
            run.id === runId
              ? { ...run, status: "failed", completedAt: new Date().toISOString(), error }
              : run
          ),
        })),

      consumeCredits: (amount) => {
        if (get().creditsBalance < amount) return false;
        set((state) => ({
          creditsBalance: state.creditsBalance - amount,
          creditsUsed: state.creditsUsed + amount,
        }));
        return true;
      },

      setPlan: (plan) => set({ plan }),

      hydrateAccount: ({ workspaceId, balance, used, plan }) => {
        get().switchWorkspace(workspaceId);
        const normalizedPlan: DashboardDataState["plan"] =
          plan === "pro" || plan === "agency" ? plan : plan === "enterprise" ? "agency" : "starter";
        set({ creditsBalance: balance, creditsUsed: used, plan: normalizedPlan });
        // Projects and listings are server-backed; load the authoritative lists.
        void get().loadProjects();
        void get().loadListings();
      },

      switchWorkspace: (workspaceId) =>
        set((state) => {
          if (workspaceId === state.workspaceId) return state;

          const currentSnapshot: WorkspaceDashboardSnapshot = {
            projects: state.projects,
            listings: state.listings,
            assets: state.assets,
            activities: state.activities,
            workflowRuns: state.workflowRuns,
            selectedProjectId: state.selectedProjectId,
            creditsBalance: state.creditsBalance,
            creditsUsed: state.creditsUsed,
            plan: state.plan,
          };
          const nextSnapshot = state.workspaceData[workspaceId] ?? {
            projects: [],
            listings: [],
            assets: [],
            activities: [],
            workflowRuns: [],
            selectedProjectId: null,
            creditsBalance: state.creditsBalance,
            creditsUsed: 0,
            plan: state.plan,
          };

          return {
            workspaceId,
            workspaceData: {
              ...state.workspaceData,
              [state.workspaceId]: currentSnapshot,
            },
            ...nextSnapshot,
          };
        }),

      removeWorkspaceData: (workspaceId) =>
        set((state) => {
          const workspaceData = { ...state.workspaceData };
          delete workspaceData[workspaceId];
          return { workspaceData };
        }),
    }),
    {
      name: "sellercrew-dashboard-data",
      version: 5,
      partialize: (state) => ({
        workspaceId: state.workspaceId,
        projects: state.projects,
        listings: state.listings,
        assets: state.assets,
        activities: state.activities,
        workflowRuns: stripRunImages(state.workflowRuns),
        selectedProjectId: state.selectedProjectId,
        creditsBalance: state.creditsBalance,
        creditsUsed: state.creditsUsed,
        plan: state.plan,
        onboardingDismissed: state.onboardingDismissed,
        workspaceData: Object.fromEntries(
          Object.entries(state.workspaceData ?? {}).map(([key, snap]) => [
            key,
            { ...snap, workflowRuns: stripRunImages(snap.workflowRuns) },
          ])
        ),
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<DashboardDataState>;
        const demoProjectIds = new Set(["project-earbuds", "project-coffee"]);
        const removeDemoData = (snapshot: Partial<WorkspaceDashboardSnapshot>) => {
          const projects = (snapshot.projects ?? []).filter((project) => !demoProjectIds.has(project.id));
          const selectedProjectId = projects.some((project) => project.id === snapshot.selectedProjectId)
            ? snapshot.selectedProjectId ?? null
            : projects[0]?.id ?? null;
          const hasDemoCredits = snapshot.creditsBalance === 4505 && snapshot.creditsUsed === 495;

          return {
            projects,
            listings: (snapshot.listings ?? []).filter(
              (listing) => listing.id !== "listing-earbuds" && !demoProjectIds.has(listing.projectId)
            ),
            assets: (snapshot.assets ?? [])
              .filter((asset) => !asset.projectId || !demoProjectIds.has(asset.projectId))
              .map((asset) => ({
                ...asset,
                source: asset.source ?? "customer",
              })),
            activities: (snapshot.activities ?? []).filter((activity) => activity.id !== "activity-1"),
            workflowRuns: (snapshot.workflowRuns ?? []).filter((run) => !demoProjectIds.has(run.projectId)),
            selectedProjectId,
            creditsBalance: hasDemoCredits ? 5000 : snapshot.creditsBalance ?? 5000,
            creditsUsed: hasDemoCredits ? 0 : snapshot.creditsUsed ?? 0,
            plan: snapshot.plan ?? "pro",
          } satisfies WorkspaceDashboardSnapshot;
        };
        const cleanedCurrentWorkspace = removeDemoData(state);
        const workspaceData = Object.fromEntries(
          Object.entries(state.workspaceData ?? {}).map(([workspaceId, snapshot]) => [
            workspaceId,
            removeDemoData(snapshot),
          ])
        );
        return {
          ...state,
          workspaceId: state.workspaceId ?? "sellercrew-main",
          workspaceData,
          ...cleanedCurrentWorkspace,
        } as DashboardDataState;
      },
    }
  )
);
