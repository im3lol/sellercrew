"use client";

import { agents } from "@/lib/agents";
import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { workflowSteps } from "@/lib/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileText,
  Images,
  Play,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ProjectDetail() {
  const setDashboardPage = useAppStore((state) => state.setDashboardPage);
  const { projects, listings, assets, workflowRuns, selectedProjectId } = useDashboardStore();
  const project = projects.find((item) => item.id === selectedProjectId);

  if (!project) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="p-8 text-center">
          <p className="font-medium">Select a project to view its workspace.</p>
          <Button className="mt-4" onClick={() => setDashboardPage("projects")}>Back to projects</Button>
        </CardContent>
      </Card>
    );
  }

  const projectListings = listings.filter((listing) => listing.projectId === project.id);
  const projectAssets = assets.filter((asset) => asset.projectId === project.id);
  const projectRuns = workflowRuns.filter((run) => run.projectId === project.id);
  const latestRun = projectRuns[0];
  const completedSteps = latestRun?.result?.workflowSteps.filter((step) => step.status === "completed").length ?? 0;
  const progress = latestRun?.status === "completed"
    ? 100
    : Math.round((completedSteps / workflowSteps.length) * 100);
  const stats: Array<{ label: string; value: string | number; icon: LucideIcon; color: string }> = [
    { label: "Listings", value: projectListings.length, icon: FileText, color: "#035EF9" },
    { label: "Assets", value: projectAssets.length, icon: Images, color: "#7E44E6" },
    { label: "Workflow runs", value: projectRuns.length, icon: CircleDashed, color: "#FC7403" },
    { label: "Policy", value: latestRun?.result?.policyStatus.status ?? "Not checked", icon: ShieldCheck, color: "#36B46F" },
  ];

  return (
    <div className="w-full max-w-7xl space-y-6">
      <button
        className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#0B0F1A]"
        onClick={() => setDashboardPage("projects")}
      >
        <ArrowLeft className="size-4" /> All projects
      </button>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-[#0B0F1A]">{project.name}</h2>
            <Badge variant="outline" className="capitalize">{project.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {project.marketplace} · One product workspace for inputs, workflow, reviews, assets, and final exports.
          </p>
        </div>
        <Button onClick={() => setDashboardPage("listing-builder")}>
          <Play className="mr-2 size-4" /> {latestRun ? "Run workflow again" : "Start full workflow"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}14` }}>
                <Icon className="size-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold capitalize">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Full workflow</CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  Ali coordinates the complete evidence-locked production and review process.
                </p>
              </div>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {workflowSteps.map((step, index) => {
              const agent = agents.find((item) => item.id === step.agentId) ?? agents[0];
              const stepResult = latestRun?.result?.workflowSteps.find((item) => item.id === step.id);
              return (
                <div key={step.id} className="flex items-center gap-3 rounded-xl border border-gray-200/80 p-3">
                  <span className="w-5 text-xs font-semibold text-gray-400">{String(index + 1).padStart(2, "0")}</span>
                  <div className="size-9 overflow-hidden rounded-lg" style={{ backgroundColor: agent.color }}>
                    <img src={agent.avatar} alt={agent.name} className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="truncate text-xs text-gray-500">{step.task}</p>
                  </div>
                  {stepResult?.status === "completed" && <CheckCircle2 className="size-4 text-green-500" />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Latest delivery</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {latestRun?.result ? (
                <>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-3xl font-bold">{latestRun.result.scores.overallScore}</p>
                    <p className="text-xs text-gray-500">Overall listing score</p>
                  </div>
                  <p className="text-sm text-gray-600">{latestRun.result.workflowSummary}</p>
                  <Button className="w-full" variant="outline" onClick={() => setDashboardPage("listing-builder")}>
                    Open workflow output <ArrowRight className="ml-2 size-4" />
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center">
                  <CircleDashed className="mx-auto size-8 text-gray-300" />
                  <p className="mt-3 text-sm font-medium">No completed delivery yet</p>
                  <p className="mt-1 text-xs text-gray-500">Start the full workflow to generate and review every output.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Project contents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-between" variant="ghost" onClick={() => setDashboardPage("listings")}>
                Listing content <span>{projectListings.length}</span>
              </Button>
              <Button className="w-full justify-between" variant="ghost" onClick={() => setDashboardPage("assets")}>
                Product assets <span>{projectAssets.length}</span>
              </Button>
              <Button className="w-full justify-between" variant="ghost" onClick={() => setDashboardPage("listing-score")}>
                Reviews and scores <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
