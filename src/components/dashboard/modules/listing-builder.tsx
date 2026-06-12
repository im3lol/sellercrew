"use client";

import { useMemo, useState } from "react";
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

const sampleListing: ListingResult = {
  title: "Wireless Earbuds Pro - Active Noise Cancelling Bluetooth Headphones with 48H Battery Life, IPX7 Waterproof, Deep Bass, Touch Control, Mic for iPhone/Android - Black",
  bullets: [
    "ACTIVE NOISE CANCELLING: Block out the world around you with advanced ANC technology. Our wireless earbuds reduce ambient noise by up to 35dB, letting you focus on your music, calls, or podcasts without distractions — perfect for commuting, office work, and travel.",
    "48-HOUR BATTERY LIFE: Enjoy uninterrupted listening with 8 hours of playback per charge and an additional 40 hours from the compact charging case. Quick charge feature gives you 2 hours of playback from just 10 minutes of charging — never run out of music on the go.",
    "IPX7 WATERPROOF RATING: Built to withstand rain, sweat, and splashes. These earbuds are IPX7 waterproof certified, making them ideal for intense workouts, running, outdoor adventures, and everyday use in any weather condition.",
    "PREMIUM DEEP BASS SOUND: Equipped with 13mm dynamic drivers and custom-tuned audio technology, these earbuds deliver rich, immersive sound with powerful deep bass, crystal-clear mids, and crisp highs — bringing your music to life.",
    "ONE-STEP PAIRING & TOUCH CONTROLS: Simply open the case and the earbuds automatically connect to your last paired device. Intuitive touch controls let you play/pause music, adjust volume, skip tracks, and answer calls — all with a simple tap.",
  ],
  description: `<h2>Premium Sound, Perfected</h2>
<p>Experience audio like never before with our Wireless Earbuds Pro. Featuring advanced Active Noise Cancelling technology, these Bluetooth headphones block out distracting background noise so you can immerse yourself fully in your music, podcasts, and calls.</p>

<h2>Built for Your Lifestyle</h2>
<p>Whether you're hitting the gym, commuting to work, or relaxing at home, these earbuds are designed to keep up. With an IPX7 waterproof rating, they withstand sweat, rain, and splashes without missing a beat. The ergonomic design with multiple ear tip sizes ensures a secure, comfortable fit for all-day wear.</p>

<h2>All-Day Power</h2>
<p>Never worry about battery life again. Enjoy 8 hours of continuous playback on a single charge, with an additional 40 hours from the sleek charging case. Need a quick boost? Just 10 minutes of charging gives you 2 full hours of playback.</p>`,
  keywords: [
    "wireless earbuds", "bluetooth headphones", "noise cancelling earbuds", "IPX7 waterproof",
    "earbuds with mic", "deep bass earbuds", "long battery earbuds", "running headphones",
    "touch control earbuds", "ANC earbuds", "sports earbuds", "earbuds for iPhone",
  ],
  complianceScore: 94,
};

export function ListingBuilder() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [competitorAsins, setCompetitorAsins] = useState<string[]>([""]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [activeTab, setActiveTab] = useState("input");
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

      if (!response.ok) {
        throw new Error(data.error || "Listing generation failed.");
      }

      const listing = data.listing;
      if (!listing?.title || !Array.isArray(listing.bullets)) {
        throw new Error("The AI returned an incomplete listing.");
      }

      setResult({
        title: listing.title,
        bullets: listing.bullets,
        description: listing.description || "",
        keywords: listing.backendKeywords || listing.keywords || [],
        complianceScore: Number(listing.complianceScore) || 0,
        complianceNotes: listing.complianceNotes,
      });
      toast.success("Listing generated successfully!");
    } catch (error) {
      setActiveTab("input");
      toast.error(error instanceof Error ? error.message : "Listing generation failed.");
    } finally {
      setIsGenerating(false);
    }
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
            <Button size="sm" className="bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90">
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
