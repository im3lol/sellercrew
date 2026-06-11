"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents } from "@/lib/agents";
import {
  ImagePlus,
  Sparkles,
  Loader2,
  Copy,
  Download,
  Camera,
  Palette,
  Layout,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface ImageBrief {
  type: string;
  title: string;
  description: string;
  keyElements: string[];
  colorPalette: string[];
  dos: string[];
  donts: string[];
  referenceStyle: string;
}

const sampleBriefs: ImageBrief[] = [
  {
    type: "Hero Image",
    title: "Main Product Hero Shot",
    description:
      "Clean white background product shot showing the earbuds in the charging case with the lid open. The earbuds should be at a slight angle to show depth and the LED indicator. Ensure the product fills 85% of the frame with proper breathing room.",
    keyElements: [
      "Product centered in frame",
      "White (#FFFFFF) background",
      "Charging case with lid open",
      "LED indicator visible",
      "No shadows or reflections",
      "Minimum 1500x1500px resolution",
    ],
    colorPalette: ["#000000", "#FFFFFF", "#035EF9", "#333333"],
    dos: [
      "Show all included accessories in frame corners",
      "Use consistent lighting across all hero images",
      "Ensure product is in focus from edge to edge",
    ],
    donts: [
      "No lifestyle context in hero image",
      "No text overlays or badges",
      "No props or hands in the frame",
    ],
    referenceStyle: "Apple product photography - clean, minimal, premium feel",
  },
  {
    type: "Lifestyle",
    title: "Active Lifestyle Usage",
    description:
      "Dynamic shot of a person jogging in an urban park at golden hour wearing the earbuds. The focus should be on the sense of freedom and movement, with the earbuds naturally integrated into the active lifestyle. Shallow depth of field to keep focus on the subject.",
    keyElements: [
      "Person in motion (jogging/running)",
      "Outdoor setting with natural light",
      "Earbuds visible but naturally worn",
      "Golden hour lighting",
      "Blurred background for depth",
      "Emotional connection with music",
    ],
    colorPalette: ["#FFA726", "#43A047", "#035EF9", "#F5F5F5"],
    dos: [
      "Show genuine emotion and enjoyment",
      "Use diverse models across lifestyle images",
      "Keep earbuds as the natural focal point",
    ],
    donts: [
      "Avoid staged or posed shots",
      "No headphones over earbuds",
      "Don't obscure the product",
    ],
    referenceStyle: "Nike running campaigns - energetic, aspirational, authentic",
  },
  {
    type: "Infographic",
    title: "Features & Benefits Infographic",
    description:
      "Split-layout infographic showing the 5 key features with icons and short descriptions. Left side shows the product image with numbered callouts, right side lists the features with corresponding icons. Use brand colors and clean typography.",
    keyElements: [
      "Product silhouette with numbered callouts",
      "5 feature sections with icons",
      "Consistent icon style (line icons)",
      "Brand color accents",
      "Short benefit-driven copy",
      "Clean grid layout",
    ],
    colorPalette: ["#0B0F1A", "#035EF9", "#FFFFFF", "#7E44E6", "#FC7403"],
    dos: [
      "Use benefit-driven copy, not feature lists",
      "Keep text minimal and scannable",
      "Maintain consistent icon style throughout",
    ],
    donts: [
      "Don't overcrowd with text",
      "No more than 5 features per infographic",
      "Avoid small fonts below 14pt",
    ],
    referenceStyle: "Amazon top seller infographics - clean, scannable, benefit-focused",
  },
  {
    type: "Packaging",
    title: "Product Packaging Showcase",
    description:
      "Professional shot of the product packaging showing the front face with branding. Include the unboxing experience with accessories laid out neatly beside the box. Convey a premium unboxing experience that justifies the price point.",
    keyElements: [
      "Box front with branding visible",
      "Unboxing sequence (2-3 shots)",
      "All accessories laid out",
      "Premium packaging materials",
      "Brand logo prominent",
      "Cohesive color scheme",
    ],
    colorPalette: ["#0B0F1A", "#035EF9", "#FFFFFF", "#F5F5F5"],
    dos: [
      "Show premium materials and finish",
      "Include all box contents neatly arranged",
      "Capture the unboxing excitement",
    ],
    donts: [
      "Don't show damaged or worn packaging",
      "No cluttered layouts",
      "Avoid cheap-looking props",
    ],
    referenceStyle: "Apple unboxing aesthetic - premium, tactile, satisfying",
  },
];

export function ImageBriefGenerator() {
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefs, setBriefs] = useState<ImageBrief[] | null>(null);

  const handleGenerate = () => {
    if (!productName.trim()) {
      toast.error("Enter a product name");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setBriefs(sampleBriefs);
      setIsGenerating(false);
      toast.success("Image briefs generated!");
    }, 3000);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">Image Brief Generator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate detailed image briefs for lifestyle, infographic, hero, and packaging shots
        </p>
      </div>

      {!briefs ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Product Details</CardTitle>
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
                    placeholder="Describe your product and the type of images you need..."
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>
                <Button
                  className="bg-[#7E44E6] hover:bg-[#7E44E6]/90 text-white"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Briefs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Image Briefs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Creative Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: "rayan", task: "Creative direction" },
                  { id: "noor", task: "Visual analysis" },
                  { id: "bayan", task: "Copy & messaging" },
                  { id: "saleem", task: "Image compliance" },
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

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-400 mb-2">Brief Types</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Camera, label: "Hero" },
                    { icon: Palette, label: "Lifestyle" },
                    { icon: Layout, label: "Infographic" },
                    { icon: Package, label: "Packaging" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-50">
                      <Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#7E44E6] text-white">{brief.type}</Badge>
                    <CardTitle className="text-base">{brief.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${brief.title}\n\n${brief.description}\n\nKey Elements:\n${brief.keyElements.map((e) => `- ${e}`).join("\n")}`
                      );
                      toast.success("Brief copied!");
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">{brief.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0B0F1A] mb-2">Key Elements</p>
                    <ul className="space-y-1">
                      {brief.keyElements.map((el, j) => (
                        <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-[#7E44E6] mt-0.5">•</span> {el}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0B0F1A] mb-2">Color Palette</p>
                    <div className="flex gap-2 mb-3">
                      {brief.colorPalette.map((color, j) => (
                        <div key={j} className="text-center">
                          <div
                            className="w-8 h-8 rounded-md border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">{color}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs font-medium text-green-600 mb-1">Do&apos;s</p>
                    <ul className="space-y-0.5 mb-2">
                      {brief.dos.map((d, j) => (
                        <li key={j} className="text-xs text-gray-600">✓ {d}</li>
                      ))}
                    </ul>

                    <p className="text-xs font-medium text-red-600 mb-1">Don&apos;ts</p>
                    <ul className="space-y-0.5">
                      {brief.donts.map((d, j) => (
                        <li key={j} className="text-xs text-gray-600">✗ {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-400">
                    Reference Style: <span className="text-gray-600">{brief.referenceStyle}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={() => setBriefs(null)}>
            Generate New Briefs
          </Button>
        </div>
      )}
    </div>
  );
}
