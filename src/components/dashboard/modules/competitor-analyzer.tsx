"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/lib/agents";
import {
  Target,
  Sparkles,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CompetitorData {
  name: string;
  asin: string;
  price: number;
  rating: number;
  reviews: number;
  titleKeywords: string[];
  strengths: string[];
  weaknesses: string[];
}

const sampleCompetitors: CompetitorData[] = [
  {
    name: "SoundCore Liberty Air 2 Pro",
    asin: "B08XXXXX01",
    price: 49.99,
    rating: 4.3,
    reviews: 12847,
    titleKeywords: ["wireless earbuds", "noise cancelling", "bluetooth"],
    strengths: ["Strong brand recognition", "High review count (12K+)", "Competitive pricing", "Multiple color options"],
    weaknesses: ["Generic bullet points", "No A+ content", "Low compliance score", "Missing backend keywords"],
  },
  {
    name: "JBL Tune 230NC",
    asin: "B08XXXXX02",
    price: 59.99,
    rating: 4.1,
    reviews: 8932,
    titleKeywords: ["JBL", "noise cancelling", "wireless", "earbuds"],
    strengths: ["Premium brand trust", "A+ content with video", "Structured bullets", "Active social proof"],
    weaknesses: ["Higher price point", "Fewer reviews than competitors", "Title too long", "Missing lifestyle imagery"],
  },
  {
    name: "TOZO A2 Mini",
    asin: "B08XXXXX03",
    price: 19.99,
    rating: 4.4,
    reviews: 23456,
    titleKeywords: ["ultra-lightweight", "mini earbuds", "bluetooth 5.3"],
    strengths: ["Best seller badge", "Very high review count", "Low price leader", "Strong keyword optimization"],
    weaknesses: ["Budget positioning limits margins", "No premium features", "Minimal A+ content", "Generic imagery"],
  },
];

const marketInsights = {
  avgPrice: 43.99,
  priceRange: "$19.99 - $79.99",
  avgRating: 4.2,
  topKeywords: ["wireless earbuds", "noise cancelling", "bluetooth headphones", "ANC", "IPX7"],
  opportunity: "Premium ANC earbuds in the $40-60 range with strong keyword optimization show the best opportunity for market entry.",
};

export function CompetitorAnalyzer() {
  const [urls, setUrls] = useState<string[]>([""]);
  const [asins, setAsins] = useState<string[]>([""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CompetitorData[] | null>(null);

  const handleAnalyze = () => {
    const identifiers = [
      ...asins.map((value) => value.trim()).filter(Boolean),
      ...urls.map((value) => value.match(/(?:dp|product)\/([A-Z0-9]{10})/i)?.[1] ?? "").filter(Boolean),
    ];
    if (!identifiers.length) {
      toast.error("Add at least one competitor ASIN or Amazon URL.");
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setResults(identifiers.slice(0, 5).map((asin, index) => {
        const template = sampleCompetitors[index % sampleCompetitors.length];
        return {
          ...template,
          name: `Competitor ${index + 1}`,
          asin: asin.toUpperCase(),
          price: Number((24.99 + index * 11.5).toFixed(2)),
          rating: Number((4 + (index % 4) * 0.1).toFixed(1)),
          reviews: 1200 + asin.charCodeAt(asin.length - 1) * 37,
        };
      }));
      setIsAnalyzing(false);
      toast.success("Competitor analysis complete!");
    }, 3000);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">Competitor Analyzer</h2>
        <p className="text-sm text-gray-500 mt-1">
          Analyze competitor listings and discover market opportunities
        </p>
      </div>

      {!results ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Competitor URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {urls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="https://www.amazon.com/dp/B0XXXXXXXXX"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...urls];
                        newUrls[i] = e.target.value;
                        setUrls(newUrls);
                      }}
                    />
                    {urls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setUrls([...urls, ""])}>
                  <Plus className="mr-1 h-3 w-3" /> Add URL
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Competitor ASINs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {asins.map((asin, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="B0XXXXXXXXX"
                      value={asin}
                      onChange={(e) => {
                        const newAsins = [...asins];
                        newAsins[i] = e.target.value;
                        setAsins(newAsins);
                      }}
                    />
                    {asins.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setAsins(asins.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setAsins([...asins, ""])}>
                  <Plus className="mr-1 h-3 w-3" /> Add ASIN
                </Button>
              </CardContent>
            </Card>

            <Button
              className="bg-[#36B46F] hover:bg-[#36B46F]/90 text-white"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze Competitors
                </>
              )}
            </Button>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analysis Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: "fares", task: "Competitor research" },
                  { id: "raed", task: "Product comparison" },
                  { id: "hakim", task: "Strategy insights" },
                  { id: "nadeem", task: "Keyword gaps" },
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Market Insights */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 text-sm">Market Opportunity</p>
                  <p className="text-sm text-green-700 mt-1">{marketInsights.opportunity}</p>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <p className="text-xs text-green-600">Avg Price</p>
                      <p className="font-semibold text-green-800">${marketInsights.avgPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Price Range</p>
                      <p className="font-semibold text-green-800">{marketInsights.priceRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Avg Rating</p>
                      <p className="font-semibold text-green-800">{marketInsights.avgRating}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-[#0B0F1A] mb-2">Top Market Keywords</p>
              <div className="flex flex-wrap gap-2">
                {marketInsights.topKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary">{kw}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitor Cards */}
          {results.map((comp, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{comp.name}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">ASIN: {comp.asin}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0B0F1A]">${comp.price}</p>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span>★</span> {comp.rating} ({comp.reviews.toLocaleString()})
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {comp.strengths.map((s, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                      <ArrowDownRight className="h-3 w-3" /> Weaknesses
                    </p>
                    <ul className="space-y-1">
                      {comp.weaknesses.map((w, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400 mb-1">Title Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {comp.titleKeywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={() => setResults(null)}>
            Analyze New Competitors
          </Button>
        </div>
      )}
    </div>
  );
}
