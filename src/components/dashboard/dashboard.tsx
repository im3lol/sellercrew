"use client";

import { useAppStore, type DashboardPage } from "@/lib/store";
import { agents } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  FolderKanban,
  FileText,
  BarChart3,
  Search,
  Target,
  ImagePlus,
  Bot,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CreditCard,
  Bell,
  Settings,
} from "lucide-react";
import { DashboardHome } from "./modules/dashboard-home";
import { ListingBuilder } from "./modules/listing-builder";
import { ListingAnalyzer } from "./modules/listing-analyzer";
import { CompetitorAnalyzer } from "./modules/competitor-analyzer";
import { KeywordCenter } from "./modules/keyword-center";
import { ImageBriefGenerator } from "./modules/image-brief-generator";
import { AgentsView } from "./modules/agents-view";
import { ProjectsView } from "./modules/projects-view";
import { Badge } from "@/components/ui/badge";

const navItems: { page: DashboardPage; label: string; icon: React.ElementType }[] = [
  { page: "home", label: "Home", icon: Home },
  { page: "projects", label: "Projects", icon: FolderKanban },
  { page: "listing-builder", label: "Listing Builder", icon: FileText },
  { page: "listing-analyzer", label: "Listing Analyzer", icon: BarChart3 },
  { page: "competitor-analyzer", label: "Competitor Analyzer", icon: Target },
  { page: "keyword-center", label: "Keyword Center", icon: Search },
  { page: "image-brief", label: "Image Briefs", icon: ImagePlus },
  { page: "agents", label: "AI Agents", icon: Bot },
];

function renderPage(page: DashboardPage) {
  switch (page) {
    case "home":
      return <DashboardHome />;
    case "projects":
      return <ProjectsView />;
    case "listing-builder":
      return <ListingBuilder />;
    case "listing-analyzer":
      return <ListingAnalyzer />;
    case "competitor-analyzer":
      return <CompetitorAnalyzer />;
    case "keyword-center":
      return <KeywordCenter />;
    case "image-brief":
      return <ImageBriefGenerator />;
    case "agents":
      return <AgentsView />;
    default:
      return <DashboardHome />;
  }
}

export function Dashboard() {
  const { dashboardPage, setDashboardPage, sidebarOpen, setSidebarOpen, setView } = useAppStore();

  return (
    <div className="h-screen flex bg-gray-50/50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/logo2.png" alt="SC" className="w-full h-full object-cover" />
            </div>
            {sidebarOpen && (
              <img src="/logo-text.png" alt="SellerCrew" className="h-6 object-contain" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = dashboardPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => setDashboardPage(item.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#0B0F1A] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <>
              <Separator className="my-4" />
              <div className="px-3">
                <p className="text-xs text-gray-400 px-3 mb-2">Quick Agents</p>
                <div className="space-y-1">
                  {agents.slice(0, 5).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setDashboardPage("agents");
                        useAppStore.getState().setSelectedAgent(agent.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded-md overflow-hidden shrink-0"
                        style={{ border: `1.5px solid ${agent.color}` }}
                      >
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="truncate text-xs">{agent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          {sidebarOpen && (
            <>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                <CreditCard className="h-4 w-4" />
                <span>Credits: 42</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </>
          )}
          <button
            onClick={() => setView("landing")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Back to Site</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="font-semibold text-[#0B0F1A]">
              {navItems.find((i) => i.page === dashboardPage)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-4 w-4 text-gray-500" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#0B0F1A] text-white text-xs">SC</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#0B0F1A]">Demo User</p>
                <p className="text-xs text-gray-500">Professional Plan</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{renderPage(dashboardPage)}</main>
      </div>
    </div>
  );
}
