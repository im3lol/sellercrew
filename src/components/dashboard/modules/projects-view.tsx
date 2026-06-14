"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  FileText,
  Trash2,
  Archive,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { agents } from "@/lib/agents";
import { toast } from "sonner";

export function ProjectsView() {
  const [search, setSearch] = useState("");
  const { setDashboardPage } = useAppStore();
  const {
    projects,
    listings,
    updateProject,
    deleteProject,
    setSelectedProject,
  } = useDashboardStore();

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteProject(id);
    toast.success("Project deleted");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-gray-500">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-[#0B0F1A]">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">Each product has its own project, workflow, listing, and image folders.</p>
        </div>
        <Button className="shrink-0 bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90" onClick={() => {
          setSelectedProject(null);
          setDashboardPage("listing-builder");
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Product
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => {
          const agent = agents.find((item) => item.id === project.agentId) ?? agents[0];
          const listingCount = listings.filter((listing) => listing.projectId === project.id).length;
          return (
          <Card key={project.id} className="group min-h-44 cursor-pointer border-gray-200/80 transition-all hover:-translate-y-0.5 hover:border-[#035EF9]/20 hover:shadow-lg hover:shadow-[#0B0F1A]/5" onClick={() => {
            setSelectedProject(project.id);
            setDashboardPage("project-detail");
          }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{project.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project.id);
                      setDashboardPage("project-detail");
                    }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      updateProject(project.id, { status: "archived" });
                      toast.success("Project archived");
                    }}>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                {getStatusBadge(project.status)}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  {listingCount} listing{listingCount !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-md overflow-hidden border"
                    style={{ borderColor: agent.color + "60" }}
                  >
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-400">{agent.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            {projects.length === 0
              ? "No projects yet. Start the Full Listing Workflow and SellerCrew will create one automatically."
              : "No projects match your search."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
