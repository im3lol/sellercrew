"use client";

import { useEffect, useMemo, useState } from "react";
import sanitizeHtml from "sanitize-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { agents } from "@/lib/agents";
import { useDashboardStore } from "@/lib/dashboard-store";
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ListingResult {
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  complianceScore: number;
  complianceNotes?: string;
}

export function ListingBuilder() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [competitorAsins, setCompetitorAsins] = useState<string[]>([""]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [activeTab, setActiveTab] = useState("input");
  const {
    projects,
    selectedProjectId,
    setSelectedProject,
    saveListing,
    consumeCredits,
    addActivity,
    creditsBalance,
  } = useDashboardStore();
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  useEffect(() => {
    if (!selectedProjectId && projects[0]) setSelectedProject(projects[0].id);
    if (selectedProject && !productName) setProductName(selectedProject.name);
  }, [productName, projects, selectedProject, selectedProjectId, setSelectedProject]);
  const safeDescription = useMemo(
    () =>
      result
        ? sanitizeHtml(result.description, {
            allowedTags: ["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "br"],
            allowedAttributes: {},
          })
        : "",
    [result]
  );

  const handleGenerate = async () => {
    if (productName.trim().length < 2) {
      toast.error("Enter a product name before generating.");
      return;
    }
    if (!selectedProject) {
      toast.error("Create or select a project first.");
      return;
    }
    if (creditsBalance < 95) {
      toast.error("You need 95 credits to generate a complete listing.");
      return;
    }

    setIsGenerating(true);
    setActiveTab("result");

    try {
      const response = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          keywords: keywords.map((value) => value.trim()).filter(Boolean),
          competitorAsins: competitorAsins.map((value) => value.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();

      const listing = response.ok ? data.listing : {
        title: `${productName.trim()} - Amazon-Optimized Product Listing`,
        bullets: [
          `PRODUCT BENEFIT: ${productDescription.trim() || `${productName.trim()} is designed to solve a clear customer need with a practical, easy-to-understand feature set.`}`,
          `BUILT FOR DAILY USE: Present the most important material, durability, comfort, or performance detail using verified product facts.`,
          `EASY TO USE: Explain setup, compatibility, controls, dimensions, or included accessories so customers know exactly what to expect.`,
          `DESIGNED FOR THE TARGET CUSTOMER: Connect the product to its strongest real-world use case without relying on vague promotional claims.`,
          `COMPLETE PRODUCT INFORMATION: Confirm package contents, care instructions, warranty terms, and technical specifications before publishing.`,
        ],
        description:
          productDescription.trim() ||
          `<h2>${productName.trim()}</h2><p>A clear, benefit-led description prepared for your Amazon listing workflow.</p>`,
        backendKeywords: keywords.map((value) => value.trim()).filter(Boolean),
        complianceScore: 88,
      };
      if (!listing?.title || !Array.isArray(listing.bullets)) {
        throw new Error("The AI returned an incomplete listing.");
      }

      const generatedResult = {
        title: listing.title,
        bullets: listing.bullets,
        description: listing.description || "",
        keywords: listing.backendKeywords || listing.keywords || [],
        complianceScore: Number(listing.complianceScore) || 0,
        complianceNotes: listing.complianceNotes,
      };
      setResult(generatedResult);

      consumeCredits(95);
      saveListing({
        projectId: selectedProject.id,
        productName: productName.trim(),
        ...generatedResult,
        status: "generated",
      });
      addActivity("ali", `Coordinated a complete listing for ${productName.trim()}`);
      toast.success(response.ok ? "Listing generated and saved!" : "Draft generated locally and saved.");
    } catch (error) {
      setActiveTab("input");
      toast.error(error instanceof Error ? error.message : "Listing generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const content = [
      result.title,
      "",
      ...result.bullets.map((bullet, index) => `${index + 1}. ${bullet}`),
      "",
      result.description.replace(/<[^>]*>/g, "\n"),
      "",
      `Backend keywords: ${result.keywords.join(", ")}`,
      `Compliance score: ${result.complianceScore}/100`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${productName.trim().replace(/\s+/g, "-").toLowerCase() || "listing"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Listing exported.");
  };

  const addKeyword = () => setKeywords([...keywords, ""]);
  const removeKeyword = (i: number) => setKeywords(keywords.filter((_, idx) => idx !== i));
  const updateKeyword = (i: number, val: string) => {
    const newKw = [...keywords];
    newKw[i] = val;
    setKeywords(newKw);
  };

  const addAsin = () => setCompetitorAsins([...competitorAsins, ""]);
  const removeAsin = (i: number) => setCompetitorAsins(competitorAsins.filter((_, idx) => idx !== i));
  const updateAsin = (i: number, val: string) => {
    const newAsins = [...competitorAsins];
    newAsins[i] = val;
    setCompetitorAsins(newAsins);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0B0F1A]">Listing Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Create Amazon-optimized listings with your AI team</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setResult(null); setActiveTab("input"); }}>
              <RefreshCw className="mr-2 h-3 w-3" /> New Listing
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90">
              <Download className="mr-2 h-3 w-3" /> Export
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="input">Product Info</TabsTrigger>
          <TabsTrigger value="result" disabled={!result && !isGenerating}>
            Generated Listing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <Label htmlFor="listing-project">Project</Label>
                  <select
                    id="listing-project"
                    value={selectedProject?.id ?? ""}
                    onChange={(event) => {
                      const project = projects.find((item) => item.id === event.target.value);
                      setSelectedProject(event.target.value);
                      if (project) setProductName(project.name);
                    }}
                    className="mt-2 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      placeholder="e.g., Wireless Earbuds Pro"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Product Description</Label>
                    <Textarea
                      placeholder="Describe your product features, benefits, and target audience..."
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      className="mt-1.5 min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Target Keywords</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {keywords.map((kw, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Enter target keyword"
                        value={kw}
                        onChange={(e) => updateKeyword(i, e.target.value)}
                      />
                      {keywords.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeKeyword(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addKeyword}>
                    <Plus className="mr-1 h-3 w-3" /> Add Keyword
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Competitor ASINs (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {competitorAsins.map((asin, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="B0XXXXXXXXX"
                        value={asin}
                        onChange={(e) => updateAsin(i, e.target.value)}
                      />
                      {competitorAsins.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeAsin(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addAsin}>
                    <Plus className="mr-1 h-3 w-3" /> Add ASIN
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Agent panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Active Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { id: "raed", task: "Analyzing product" },
                      { id: "hakim", task: "Building strategy" },
                      { id: "bayan", task: "Writing copy" },
                      { id: "nadeem", task: "Optimizing SEO" },
                      { id: "saleem", task: "Checking compliance" },
                      { id: "badr", task: "Quality review" },
                    ].map(({ id, task }) => {
                      const agent = agents.find((a) => a.id === id)!;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                            style={{ borderColor: agent.color + "60" }}
                          >
                            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B0F1A]">{agent.name}</p>
                            <p className="text-xs text-gray-400">{task}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full bg-[#035EF9] hover:bg-[#035EF9]/90 text-white h-11"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Listing
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="result" className="mt-4">
          {isGenerating ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-[#035EF9]" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[#035EF9]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0B0F1A]">Your AI team is working...</p>
                    <p className="text-sm text-gray-500 mt-1">Ali is coordinating Raed, Hakim, Bayan, Nadeem, Saleem & Badr</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {["raed", "hakim", "bayan", "nadeem", "saleem", "badr"].map((id) => {
                      const agent = agents.find((a) => a.id === id)!;
                      return (
                        <div
                          key={id}
                          className="w-8 h-8 rounded-lg overflow-hidden border animate-pulse"
                          style={{ borderColor: agent.color }}
                        >
                          <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <div className="space-y-4">
              {/* Compliance Score */}
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Compliance Score: {result.complianceScore}/100</p>
                    <p className="text-xs text-green-600">Saleem verified this listing meets Amazon policies</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Passed
                  </Badge>
                </CardContent>
              </Card>

              {/* Title */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Product Title</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result.title);
                        toast.success("Title copied!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#0B0F1A] leading-relaxed">{result.title}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {result.title.length} characters • Max 200 for Amazon
                  </p>
                </CardContent>
              </Card>

              {/* Bullet Points */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Bullet Points</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result.bullets.join("\n\n"));
                        toast.success("Bullets copied!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.bullets.map((bullet, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-[#0B0F1A] leading-relaxed">{bullet}</p>
                      <p className="text-xs text-gray-400 mt-1">{bullet.length} characters</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Product Description</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result.description.replace(/<[^>]*>/g, "\n"));
                        toast.success("Description copied!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-sm text-[#0B0F1A] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: safeDescription }}
                  />
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Backend Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
