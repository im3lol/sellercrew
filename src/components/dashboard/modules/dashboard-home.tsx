"use client";

import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { agents } from "@/lib/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Search,
  Target,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function DashboardHome() {
  const { setDashboardPage } = useAppStore();
  const { projects, listings, activities, creditsBalance, creditsUsed, setSelectedProject } = useDashboardStore();
  const averageCompliance = listings.length
    ? Math.round(listings.reduce((sum, listing) => sum + listing.complianceScore, 0) / listings.length)
    : 0;
  const statsCards = [
    { title: "Active Projects", value: String(projects.filter((project) => project.status === "active").length), icon: FileText, change: `${projects.length} projects total`, color: "#035EF9" },
    { title: "Keywords Saved", value: listings.reduce((sum, listing) => sum + listing.keywords.length, 0).toLocaleString(), icon: Search, change: "Across all listings", color: "#36B46F" },
    { title: "Listings Created", value: String(listings.length), icon: Zap, change: `${listings.filter((listing) => listing.status === "reviewed").length} reviewed`, color: "#7E44E6" },
    { title: "Compliance Score", value: `${averageCompliance}%`, icon: Target, change: "Average score", color: "#FC7403" },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      {/* Welcome banner */}
      <Card className="relative overflow-hidden border-0 bg-[#0B0F1A] text-white">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="mb-2 text-2xl font-bold">Welcome back</h2>
              <p className="max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Your AI team is ready. You have {creditsBalance.toLocaleString()} credits remaining. Start a new listing or
                continue where you left off.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="bg-white text-[#0B0F1A] shadow-sm hover:bg-white/90"
                  onClick={() => {
                    setSelectedProject(null);
                    setDashboardPage("listing-builder");
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  New Product Listing
                </Button>
                <Button
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => setDashboardPage("projects")}
                >
                  View Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-1 lg:flex">
              {agents.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  className="h-10 w-10 overflow-hidden rounded-xl border-2"
                  style={{ borderColor: agent.color + "60" }}
                >
                  <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                </div>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xs text-white/60">
                +5
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Credits Used</span>
              <span className="text-white">{creditsUsed.toLocaleString()} / {(creditsUsed + creditsBalance).toLocaleString()}</span>
            </div>
            <Progress value={(creditsUsed / Math.max(creditsUsed + creditsBalance, 1)) * 100} className="h-2 bg-white/10" />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 sm:text-sm">{stat.title}</p>
                  <p className="mt-1 text-xl font-bold text-[#0B0F1A] sm:text-2xl">{stat.value}</p>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Agent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDashboardPage("agent-history")}>
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => {
                const agent = agents.find((item) => item.id === activity.agentId) ?? agents[0];
                return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                    style={{ borderColor: agent.color + "60" }}
                  >
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0B0F1A]">
                      <span className="font-medium">{agent.name}</span>{" "}
                      <span className="text-gray-500">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                </div>
              )})}
              {activities.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">Your activity will appear here.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agent Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-md overflow-hidden shrink-0 border"
                    style={{ borderColor: agent.color + "60" }}
                  >
                    <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B0F1A] truncate">{agent.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
