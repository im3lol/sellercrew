"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents } from "@/lib/agents";
import {
  Search,
  Sparkles,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Copy,
  Filter,
  BarChart3,
  Layers,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: "Low" | "Medium" | "High";
  relevance: number;
  cluster: string;
}

const sampleKeywords: KeywordData[] = [
  { keyword: "wireless earbuds", searchVolume: 201000, competition: "High", relevance: 98, cluster: "Core Product" },
  { keyword: "bluetooth earbuds", searchVolume: 165000, competition: "High", relevance: 95, cluster: "Core Product" },
  { keyword: "noise cancelling earbuds", searchVolume: 110000, competition: "High", relevance: 92, cluster: "Feature" },
  { keyword: "wireless earbuds for iPhone", searchVolume: 74000, competition: "Medium", relevance: 88, cluster: "Compatibility" },
  { keyword: "earbuds with microphone", searchVolume: 49500, competition: "Medium", relevance: 85, cluster: "Feature" },
  { keyword: "running earbuds", searchVolume: 40500, competition: "Medium", relevance: 82, cluster: "Use Case" },
  { keyword: "waterproof earbuds", searchVolume: 33100, competition: "Medium", relevance: 80, cluster: "Feature" },
  { keyword: "IPX7 earbuds", searchVolume: 22200, competition: "Low", relevance: 78, cluster: "Feature" },
  { keyword: "deep bass earbuds", searchVolume: 18100, competition: "Low", relevance: 75, cluster: "Sound Quality" },
  { keyword: "earbuds with long battery life", searchVolume: 14800, competition: "Low", relevance: 73, cluster: "Feature" },
  { keyword: "gym earbuds wireless", searchVolume: 12100, competition: "Low", relevance: 70, cluster: "Use Case" },
  { keyword: "bluetooth headphones noise cancelling", searchVolume: 9900, competition: "Medium", relevance: 68, cluster: "Core Product" },
  { keyword: "earbuds for android", searchVolume: 8100, competition: "Low", relevance: 65, cluster: "Compatibility" },
  { keyword: "touch control earbuds", searchVolume: 6600, competition: "Low", relevance: 62, cluster: "Feature" },
  { keyword: "ANC earbuds affordable", searchVolume: 5400, competition: "Low", relevance: 60, cluster: "Price" },
];

export function KeywordCenter() {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [keywords, setKeywords] = useState<KeywordData[] | null>(null);
  const [activeTab, setActiveTab] = useState("discovery");

  const handleDiscover = () => {
    if (!seedKeyword.trim()) {
      toast.error("Enter a seed keyword");
      return;
    }
    setIsDiscovering(true);
    setTimeout(() => {
      setKeywords(sampleKeywords);
      setIsDiscovering(false);
      toast.success("Keywords discovered!");
    }, 2500);
  };

  const clusters = keywords
    ? [...new Set(keywords.map((k) => k.cluster))]
    : [];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">Keyword Center</h2>
        <p className="text-sm text-gray-500 mt-1">
          Discover, cluster, and prioritize keywords for your Amazon listings
        </p>
      </div>

      {!keywords ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Keyword Discovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a seed keyword (e.g., wireless earbuds)"
                      value={seedKeyword}
                      onChange={(e) => setSeedKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                    />
                    <Button
                      className="bg-[#3EC9D1] hover:bg-[#3EC9D1]/90 text-white"
                      onClick={handleDiscover}
                      disabled={isDiscovering}
                    >
                      {isDiscovering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {isDiscovering && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-[#3EC9D1]" />
                    <div>
                      <p className="text-sm font-medium text-[#0B0F1A]">Discovering keywords...</p>
                      <p className="text-xs text-gray-500">Nadeem is analyzing search volumes and competition</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nadeem&apos;s Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: Search, label: "Keyword Discovery", desc: "Find high-converting keywords" },
                  { icon: Layers, label: "Keyword Clustering", desc: "Group keywords by intent" },
                  { icon: Target, label: "Prioritization", desc: "Rank by opportunity score" },
                  { icon: BarChart3, label: "Volume Analysis", desc: "Search volume trends" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-[#3EC9D1]/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#3EC9D1]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0B0F1A]">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="discovery">All Keywords</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="prioritize">Prioritize</TabsTrigger>
          </TabsList>

          <TabsContent value="discovery" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 p-3">Keyword</th>
                        <th className="text-left text-xs font-medium text-gray-500 p-3">Search Volume</th>
                        <th className="text-left text-xs font-medium text-gray-500 p-3">Competition</th>
                        <th className="text-left text-xs font-medium text-gray-500 p-3">Relevance</th>
                        <th className="text-left text-xs font-medium text-gray-500 p-3">Cluster</th>
                        <th className="text-right text-xs font-medium text-gray-500 p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((kw, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3 text-sm font-medium text-[#0B0F1A]">{kw.keyword}</td>
                          <td className="p-3 text-sm text-gray-600">{kw.searchVolume.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                kw.competition === "Low"
                                  ? "text-green-600 border-green-200"
                                  : kw.competition === "Medium"
                                  ? "text-yellow-600 border-yellow-200"
                                  : "text-red-600 border-red-200"
                              }
                            >
                              {kw.competition}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{kw.relevance}%</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="text-xs">
                              {kw.cluster}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(kw.keyword);
                                toast.success("Copied!");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clusters" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((cluster) => (
                <Card key={cluster}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{cluster}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {keywords
                        .filter((k) => k.cluster === cluster)
                        .map((kw) => (
                          <Badge key={kw.keyword} variant="outline" className="text-xs">
                            {kw.keyword}
                          </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Total volume:{" "}
                      {keywords
                        .filter((k) => k.cluster === cluster)
                        .reduce((sum, k) => sum + k.searchVolume, 0)
                        .toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prioritize" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-3">
                  Keywords ranked by opportunity score (high volume + low competition + high relevance)
                </p>
                <div className="space-y-2">
                  {[...keywords]
                    .sort((a, b) => {
                      const scoreA = a.searchVolume * (a.competition === "Low" ? 3 : a.competition === "Medium" ? 2 : 1) * (a.relevance / 100);
                      const scoreB = b.searchVolume * (b.competition === "Low" ? 3 : b.competition === "Medium" ? 2 : 1) * (b.relevance / 100);
                      return scoreB - scoreA;
                    })
                    .map((kw, i) => (
                      <div key={kw.keyword} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <span className="text-xs font-mono text-gray-400 w-6">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0B0F1A]">{kw.keyword}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{kw.searchVolume.toLocaleString()} vol</Badge>
                          <Badge
                            variant="outline"
                            className={
                              kw.competition === "Low"
                                ? "text-green-600 border-green-200 text-xs"
                                : kw.competition === "Medium"
                                ? "text-yellow-600 border-yellow-200 text-xs"
                                : "text-red-600 border-red-200 text-xs"
                            }
                          >
                            {kw.competition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <Button variant="outline" className="mt-4" onClick={() => setKeywords(null)}>
            New Search
          </Button>
        </Tabs>
      )}
    </div>
  );
}
