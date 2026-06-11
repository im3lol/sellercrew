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
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  status: "active" | "completed" | "draft";
  listingCount: number;
  updatedAt: string;
  agent: string;
  agentColor: string;
}

const sampleProjects: Project[] = [
  { id: "1", name: "Wireless Earbuds Pro", status: "active", listingCount: 3, updatedAt: "2 hours ago", agent: "Bayan", agentColor: "#F84D8E" },
  { id: "2", name: "Coffee Maker X200", status: "active", listingCount: 1, updatedAt: "1 day ago", agent: "Hakim", agentColor: "#FC7403" },
  { id: "3", name: "Yoga Mat Premium", status: "completed", listingCount: 5, updatedAt: "3 days ago", agent: "Nadeem", agentColor: "#3EC9D1" },
  { id: "4", name: "Smart Watch Series 5", status: "active", listingCount: 2, updatedAt: "5 days ago", agent: "Fares", agentColor: "#36B46F" },
  { id: "5", name: "USB-C Hub Adapter", status: "draft", listingCount: 0, updatedAt: "1 week ago", agent: "Raed", agentColor: "#035EF9" },
  { id: "6", name: "LED Desk Lamp Pro", status: "completed", listingCount: 4, updatedAt: "2 weeks ago", agent: "Badr", agentColor: "#60697A" },
];

export function ProjectsView() {
  const [projects, setProjects] = useState(sampleProjects);
  const [search, setSearch] = useState("");
  const { setDashboardPage } = useAppStore();

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: "New Project",
      status: "draft",
      listingCount: 0,
      updatedAt: "Just now",
      agent: "Ali",
      agentColor: "#FDFDFD",
    };
    setProjects([newProject, ...projects]);
    toast.success("Project created!");
    setDashboardPage("listing-builder");
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
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
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0B0F1A]">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your Amazon listing projects</p>
        </div>
        <Button className="bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90" onClick={handleCreateProject}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setDashboardPage("listing-builder")}>
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDashboardPage("listing-builder"); }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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
                  {project.updatedAt}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  {project.listingCount} listing{project.listingCount !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-md overflow-hidden border"
                    style={{ borderColor: project.agentColor + "60" }}
                  >
                    <img
                      src={`/agents/${project.agent.toLowerCase()}.png`}
                      alt={project.agent}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-400">{project.agent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
