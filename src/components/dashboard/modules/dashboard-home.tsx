"use client";

import { useAppStore } from "@/lib/store";
import { agents } from "@/lib/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Search,
  Target,
  BarChart3,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const recentActivity = [
  { agent: "Bayan", action: "Generated listing for Wireless Earbuds Pro", time: "2 min ago", color: "#F84D8E" },
  { agent: "Nadeem", action: "Completed keyword research for Coffee Maker X200", time: "15 min ago", color: "#3EC9D1" },
  { agent: "Saleem", action: "Compliance check passed for Yoga Mat Premium", time: "1 hour ago", color: "#E82E33" },
  { agent: "Fares", action: "Competitor analysis for Smart Watch Series 5", time: "2 hours ago", color: "#36B46F" },
  { agent: "Hakim", action: "Listing strategy for USB-C Hub Adapter", time: "3 hours ago", color: "#FC7403" },
];

const statsCards = [
  { title: "Active Projects", value: "12", icon: FileText, change: "+3 this week", color: "#035EF9" },
  { title: "Keywords Found", value: "1,847", icon: Search, change: "+234 today", color: "#36B46F" },
  { title: "Listings Created", value: "48", icon: Zap, change: "+8 this week", color: "#7E44E6" },
  { title: "Compliance Score", value: "96%", icon: Target, change: "+2% vs last month", color: "#FC7403" },
];

export function DashboardHome() {
  const { setDashboardPage } = useAppStore();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner */}
      <Card className="bg-[#0B0F1A] text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
              <p className="text-white/60 max-w-lg">
                Your AI team is ready. You have 4,505 credits remaining. Start a new listing or
                continue where you left off.
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  className="bg-white text-[#0B0F1A] hover:bg-white/90"
                  onClick={() => setDashboardPage("listing-builder")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  New Listing
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setDashboardPage("keyword-center")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Keyword Research
                </Button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {agents.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  className="w-10 h-10 rounded-xl overflow-hidden border-2"
                  style={{ borderColor: agent.color + "60" }}
                >
                  <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs text-white/60">
                +5
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Credits Used</span>
              <span className="text-white">495 / 5,000</span>
            </div>
            <Progress value={9.9} className="h-2 bg-white/10" />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#0B0F1A] mt-1">{stat.value}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
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
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                    style={{ borderColor: activity.color + "60" }}
                  >
                    <img
                      src={`/agents/${activity.agent.toLowerCase()}.png`}
                      alt={activity.agent}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0B0F1A]">
                      <span className="font-medium">{activity.agent}</span>{" "}
                      <span className="text-gray-500">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                </div>
              ))}
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
