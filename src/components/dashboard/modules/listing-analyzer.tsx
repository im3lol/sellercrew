"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { agents } from "@/lib/agents";
import {
  BarChart3,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  overallScore: number;
  titleScore: number;
  bulletsScore: number;
  descriptionScore: number;
  keywordScore: number;
  complianceScore: number;
  recommendations: { category: string; issue: string; fix: string; severity: "high" | "medium" | "low" }[];
}

const sampleAnalysis: AnalysisResult = {
  overallScore: 72,
  titleScore: 65,
  bulletsScore: 78,
  descriptionScore: 70,
  keywordScore: 60,
  complianceScore: 85,
  recommendations: [
    {
      category: "Title",
      issue: "Missing primary keyword at the beginning",
      fix: "Start your title with your most important keyword for better A9 ranking",
      severity: "high",
    },
    {
      category: "Title",
      issue: "Title exceeds 200 character limit",
      fix: "Reduce title to under 200 characters. Current: 215 characters",
      severity: "high",
    },
    {
      category: "Bullets",
      issue: "Feature benefits not clearly stated",
      fix: "Lead each bullet with a clear benefit in ALL CAPS, followed by supporting details",
      severity: "medium",
    },
    {
      category: "Keywords",
      issue: "Missing high-volume keywords in backend",
      fix: "Add 'wireless headphones', 'bluetooth earbuds', 'noise cancelling' to backend keywords",
      severity: "high",
    },
    {
      category: "Description",
      issue: "No HTML formatting used",
      fix: "Use HTML tags (h2, p, ul, li) to improve readability and structure",
      severity: "low",
    },
    {
      category: "Compliance",
      issue: "Promotional language detected",
      fix: 'Remove phrases like "best seller", "#1 rated" which violate Amazon policies',
      severity: "medium",
    },
  ],
};

export function ListingAnalyzer() {
  const [listingText, setListingText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    if (!listingText.trim()) {
      toast.error("Please paste a listing to analyze");
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult(sampleAnalysis);
      setIsAnalyzing(false);
      toast.success("Analysis complete!");
    }, 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSeverityIcon = (severity: "high" | "medium" | "low") => {
    if (severity === "high") return <XCircle className="h-4 w-4 text-red-500" />;
    if (severity === "medium") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">Listing Analyzer</h2>
        <p className="text-sm text-gray-500 mt-1">
          Paste an existing listing and let your AI team analyze it for improvements
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!result ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paste Your Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your Amazon listing here (title, bullets, description)..."
                  className="min-h-[300px]"
                  value={listingText}
                  onChange={(e) => setListingText(e.target.value)}
                />
                <Button
                  className="bg-[#035EF9] hover:bg-[#035EF9]/90 text-white"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Analyze Listing
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Overall Score */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                        {result.overallScore}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Overall Score</p>
                    </div>
                    <div className="flex-1 space-y-3">
                      {[
                        { label: "Title", score: result.titleScore },
                        { label: "Bullets", score: result.bulletsScore },
                        { label: "Description", score: result.descriptionScore },
                        { label: "Keywords", score: result.keywordScore },
                        { label: "Compliance", score: result.complianceScore },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20">{item.label}</span>
                          <Progress value={item.score} className="flex-1 h-2" />
                          <span className={`text-xs font-medium ${getScoreColor(item.score)}`}>
                            {item.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recommendations</CardTitle>
                    <Badge variant="outline">{result.recommendations.length} items</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">{getSeverityIcon(rec.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {rec.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              rec.severity === "high"
                                ? "text-red-600 border-red-200"
                                : rec.severity === "medium"
                                ? "text-yellow-600 border-yellow-200"
                                : "text-blue-600 border-blue-200"
                            }
                          >
                            {rec.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#0B0F1A]">{rec.issue}</p>
                        <p className="text-xs text-gray-500 mt-1">Fix: {rec.fix}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setListingText("");
                }}
              >
                Analyze Another Listing
              </Button>
            </div>
          )}
        </div>

        {/* Agent Panel */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analysis Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "hakim", task: "Listing structure analysis" },
                { id: "saleem", task: "Compliance verification" },
                { id: "nadeem", task: "Keyword optimization check" },
                { id: "bayan", task: "Copy quality review" },
                { id: "badr", task: "Final quality assessment" },
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
      </div>
    </div>
  );
}
