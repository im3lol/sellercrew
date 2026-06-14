"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { agents } from "@/lib/agents";
import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  ImagePlus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#0B0F1A]">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export function ListingsPage() {
  const { listings, projects, updateListingStatus, deleteListing } = useDashboardStore();
  const setDashboardPage = useAppStore((state) => state.setDashboardPage);
  const [search, setSearch] = useState("");
  const filtered = listings.filter((listing) =>
    `${listing.productName} ${listing.title}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader title="Listings" description="Review, publish, and manage generated Amazon listings." />
        <Button onClick={() => setDashboardPage("listing-builder")}>Create listing</Button>
      </div>
      <Input
        className="max-w-sm"
        placeholder="Search listings..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((listing) => (
          <Card key={listing.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{listing.productName}</CardTitle>
                  <p className="mt-1 text-xs text-gray-400">
                    {projects.find((project) => project.id === listing.projectId)?.name ?? "Unknown project"}
                  </p>
                </div>
                <Badge variant="outline">{listing.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-2 text-sm text-gray-600">{listing.title}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{listing.bullets.length} bullets</span>
                <span>{listing.keywords.length} keywords</span>
                <span>{listing.complianceScore}/100 compliance</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={listing.status}
                  onChange={(event) => updateListingStatus(listing.id, event.target.value as typeof listing.status)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="generated">Generated</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="published">Published</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText([listing.title, ...listing.bullets].join("\n\n"));
                    toast.success("Listing copied.");
                  }}
                >
                  Copy
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteListing(listing.id)}>
                  <Trash2 className="mr-1 size-3.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-gray-500">No listings found.</CardContent></Card>
      )}
    </div>
  );
}

export function AssetsPage() {
  const { assets, projects, selectedProjectId, addAssets, deleteAsset } = useDashboardStore();

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader title="Assets" description="Upload and organize product images, documents, and creative briefs." />
      <Card className="border-dashed">
        <CardContent className="p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 text-center hover:bg-gray-50">
            <Upload className="size-8 text-[#7E44E6]" />
            <span className="text-sm font-medium">Choose files to add to your workspace</span>
            <span className="text-xs text-gray-400">Images and documents are stored as local workspace metadata.</span>
            <input
              multiple
              type="file"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (!files.length) return;
                addAssets(files.map((file) => ({
                  projectId: selectedProjectId,
                  name: file.name,
                  type: file.type.startsWith("image/") ? "image" : "document",
                  source: "customer",
                  size: file.size,
                })));
                toast.success(`${files.length} asset${files.length === 1 ? "" : "s"} added.`);
                event.target.value = "";
              }}
            />
          </label>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#7E44E6]/10">
                {asset.type === "image" ? <ImagePlus className="size-5 text-[#7E44E6]" /> : <FileText className="size-5 text-[#7E44E6]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{asset.name}</p>
                <p className="text-xs text-gray-400">
                  {projects.find((project) => project.id === asset.projectId)?.name ?? "General"} · {(asset.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteAsset(asset.id)}>
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {!assets.length && <p className="text-sm text-gray-400">No assets uploaded yet.</p>}
    </div>
  );
}

export function ResearchReportPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [report, setReport] = useState<string[] | null>(null);
  const addActivity = useDashboardStore((state) => state.addActivity);

  const generate = () => {
    if (!product.trim()) return toast.error("Enter a product or category.");
    const target = audience.trim() || "value-conscious Amazon shoppers";
    setReport([
      `Position ${product} around the strongest measurable customer benefit rather than a broad feature list.`,
      `Primary audience: ${target}. Address their purchase objections in the first two bullets.`,
      `Research competitor titles for recurring category terms, then separate table-stakes keywords from differentiators.`,
      `Build visual proof for quality, dimensions, included accessories, and real-world use cases.`,
      `Validate every performance, material, and certification claim before publishing.`,
    ]);
    addActivity("raed", `Created a research report for ${product.trim()}`);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Research Report" description="Turn product context into an actionable listing research brief." />
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <Input placeholder="Product or category" value={product} onChange={(event) => setProduct(event.target.value)} />
        <Input placeholder="Target audience (optional)" value={audience} onChange={(event) => setAudience(event.target.value)} />
        <Button className="sm:col-span-2" onClick={generate}><Search className="mr-2 size-4" /> Build report</Button>
      </CardContent></Card>
      {report && <Card><CardHeader><CardTitle>Research direction</CardTitle></CardHeader><CardContent className="space-y-3">
        {report.map((item, index) => <div key={item} className="flex gap-3 rounded-lg bg-gray-50 p-3 text-sm"><span className="font-bold text-[#035EF9]">0{index + 1}</span><p>{item}</p></div>)}
      </CardContent></Card>}
    </div>
  );
}

function analyzeText(text: string) {
  const normalized = text.toLowerCase();
  const issues = [
    normalized.includes("best seller") && "Remove unverified 'best seller' language.",
    normalized.includes("#1") && "Remove unverifiable ranking claims.",
    normalized.includes("guaranteed") && "Replace absolute guarantees with factual product language.",
    normalized.includes("free shipping") && "Shipping promotions do not belong in listing copy.",
    text.length > 3000 && "Description is unusually long and should be tightened.",
  ].filter(Boolean) as string[];
  return { issues, score: Math.max(45, 100 - issues.length * 12) };
}

export function ComplianceCheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeText> | null>(null);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Compliance Check" description="Scan listing copy for common Amazon policy risks." />
      <Card><CardContent className="space-y-4 p-5">
        <Textarea className="min-h-64" placeholder="Paste listing title, bullets, and description..." value={text} onChange={(event) => setText(event.target.value)} />
        <Button onClick={() => text.trim() ? setResult(analyzeText(text)) : toast.error("Paste listing copy first.")}><ShieldCheck className="mr-2 size-4" /> Run compliance check</Button>
      </CardContent></Card>
      {result && <Card><CardContent className="p-6">
        <div className="flex items-center gap-4"><span className="text-4xl font-bold">{result.score}</span><div><p className="font-semibold">Compliance score</p><Progress className="mt-2 w-52" value={result.score} /></div></div>
        <div className="mt-5 space-y-2">
          {result.issues.length ? result.issues.map((issue) => <p key={issue} className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{issue}</p>) : <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">No common policy risks detected. Final seller review is still required.</p>}
        </div>
      </CardContent></Card>}
    </div>
  );
}

export function ListingScorePage() {
  const listings = useDashboardStore((state) => state.listings);
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Listing Score" description="Benchmark listing completeness and compliance readiness." />
      <div className="space-y-3">
        {listings.map((listing) => {
          const completeness = Math.min(100, 35 + listing.bullets.length * 7 + Math.min(listing.keywords.length, 10) * 2 + (listing.description ? 10 : 0));
          const score = Math.round((completeness + listing.complianceScore) / 2);
          return <Card key={listing.id}><CardContent className="flex items-center gap-4 p-4">
            <div className="text-2xl font-bold text-[#035EF9]">{score}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{listing.productName}</p><Progress className="mt-2" value={score} /></div>
            <Badge variant="outline">{score >= 85 ? "Ready" : score >= 70 ? "Improve" : "Needs work"}</Badge>
          </CardContent></Card>;
        })}
        {!listings.length && <p className="text-sm text-gray-400">Generate a listing to see its score.</p>}
      </div>
    </div>
  );
}

export function AgentPerformancePage() {
  const activities = useDashboardStore((state) => state.activities);
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Agent Performance" description="Live activity counts based on work completed in this workspace." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const runs = activities.filter((activity) => activity.agentId === agent.id).length;
          return <Card key={agent.id}><CardContent className="flex items-center gap-3 p-4">
            <img src={agent.avatar} alt={agent.name} className="size-11 rounded-xl" style={{ backgroundColor: agent.color }} />
            <div className="flex-1"><p className="font-medium">{agent.name}</p><p className="text-xs text-gray-400">{agent.role}</p></div>
            <div className="text-right"><p className="text-lg font-bold">{runs}</p><p className="text-[10px] text-gray-400">runs</p></div>
          </CardContent></Card>;
        })}
      </div>
    </div>
  );
}

export function AgentHistoryPage() {
  const { activities } = useDashboardStore();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Agent History" description="Review real actions completed in this local workspace." />
      <Card><CardContent className="divide-y p-0">
        {activities.map((activity) => {
          const agent = agents.find((item) => item.id === activity.agentId) ?? agents[0];
          return <div key={activity.id} className="flex items-center gap-3 p-4">
            <img src={agent.avatar} alt={agent.name} className="size-9 rounded-lg" style={{ backgroundColor: agent.color }} />
            <div className="flex-1"><p className="text-sm"><strong>{agent.name}</strong> {activity.action}</p><p className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleString()}</p></div>
            <CheckCircle2 className="size-4 text-green-500" />
          </div>;
        })}
      </CardContent></Card>
    </div>
  );
}

const planOptions = [
  { id: "starter" as const, name: "Starter", credits: 500, price: "$29" },
  { id: "pro" as const, name: "Pro", credits: 5000, price: "$79" },
  { id: "agency" as const, name: "Agency", credits: 25000, price: "$199" },
];

export function PlansPage() {
  const { plan, setPlan, creditsBalance } = useDashboardStore();
  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Plans & Credits" description={`Current balance: ${creditsBalance.toLocaleString()} credits.`} />
      <div className="grid gap-4 md:grid-cols-3">
        {planOptions.map((option) => <Card key={option.id} className={plan === option.id ? "border-[#035EF9]" : ""}><CardContent className="p-5">
          <p className="font-semibold">{option.name}</p><p className="mt-3 text-3xl font-bold">{option.price}<span className="text-sm font-normal text-gray-400">/mo</span></p><p className="mt-2 text-sm text-gray-500">{option.credits.toLocaleString()} credits</p>
          <Button className="mt-5 w-full" variant={plan === option.id ? "outline" : "default"} disabled={plan === option.id} onClick={() => { setPlan(option.id); toast.success(`Plan changed to ${option.name}.`); }}>{plan === option.id ? "Current plan" : "Choose plan"}</Button>
        </CardContent></Card>)}
      </div>
    </div>
  );
}

export function UsagePage() {
  const { creditsBalance, creditsUsed, activities } = useDashboardStore();
  const total = creditsBalance + creditsUsed;
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Usage" description="Track workspace credit consumption and completed actions." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Remaining", creditsBalance], ["Used", creditsUsed], ["Agent actions", activities.length]].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{Number(value).toLocaleString()}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-5"><div className="flex justify-between text-sm"><span>Monthly credits used</span><span>{creditsUsed} / {total}</span></div><Progress className="mt-3" value={(creditsUsed / Math.max(total, 1)) * 100} /></CardContent></Card>
    </div>
  );
}

export function BillingPage() {
  const setDashboardPage = useAppStore((state) => state.setDashboardPage);
  const { plan, creditsBalance } = useDashboardStore();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Billing" description="Manage the active plan and workspace credit balance." />
      <Card><CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div><p className="text-sm text-gray-500">Current plan</p><p className="mt-1 text-2xl font-bold capitalize">{plan}</p><p className="mt-1 text-sm text-gray-500">{creditsBalance.toLocaleString()} credits available</p></div>
        <Button onClick={() => setDashboardPage("plans")}>Manage plan</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Payment status</CardTitle></CardHeader><CardContent><p className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="size-4" /> No payment action is required in this demo workspace.</p></CardContent></Card>
    </div>
  );
}

export function AdminUsersPage() {
  const [members, setMembers] = useState([{ id: "owner", email: "owner@sellercrew.ai", role: "Owner" }]);
  const [email, setEmail] = useState("");
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Users" description="Manage members in the current workspace." />
      <Card><CardContent className="flex gap-2 p-4"><Input placeholder="member@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /><Button onClick={() => { if (!email.includes("@")) return toast.error("Enter a valid email."); setMembers((items) => [...items, { id: crypto.randomUUID(), email, role: "Member" }]); setEmail(""); }}>Invite</Button></CardContent></Card>
      <Card><CardContent className="divide-y p-0">{members.map((member) => <div key={member.id} className="flex items-center gap-3 p-4"><Users className="size-4 text-gray-400" /><span className="flex-1 text-sm">{member.email}</span><Badge variant="outline">{member.role}</Badge>{member.id !== "owner" && <Button size="icon" variant="ghost" onClick={() => setMembers((items) => items.filter((item) => item.id !== member.id))}><Trash2 className="size-4 text-red-500" /></Button>}</div>)}</CardContent></Card>
    </div>
  );
}

export function AdminOrgsPage() {
  const { workspaces, activeWorkspace, createWorkspace, removeWorkspace, setActiveWorkspace } = useAppStore();
  const { switchWorkspace, removeWorkspaceData } = useDashboardStore();
  const [name, setName] = useState("");
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Organizations" description="Create and switch SellerCrew workspaces." />
      <Card><CardContent className="flex gap-2 p-4"><Input placeholder="Workspace name" value={name} onChange={(event) => setName(event.target.value)} /><Button onClick={() => { if (!name.trim()) return; const workspace = createWorkspace({ name, purpose: "account" }); switchWorkspace(workspace.id); setName(""); toast.success("Workspace created."); }}>Create</Button></CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2">{workspaces.map((workspace) => <Card key={workspace.id}><CardContent className="flex items-center gap-3 p-4"><Building2 className="size-5 text-[#7E44E6]" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{workspace.name}</p><p className="truncate text-xs text-gray-400">{workspace.label || workspace.purpose || workspace.role}</p></div><Button size="sm" variant="outline" onClick={() => { setActiveWorkspace(workspace); switchWorkspace(workspace.id); }}>Open</Button>{workspaces.length > 1 && workspace.id !== activeWorkspace?.id && <Button size="icon" variant="ghost" aria-label={`Delete ${workspace.name}`} onClick={() => { removeWorkspace(workspace.id); removeWorkspaceData(workspace.id); toast.success("Workspace deleted."); }}><Trash2 className="size-4 text-red-500" /></Button>}</CardContent></Card>)}</div>
    </div>
  );
}

export function AdminSubscriptionsPage() {
  return <PlansPage />;
}

export function AdminAnalyticsPage() {
  const { projects, listings, assets, activities } = useDashboardStore();
  const metrics = [
    ["Projects", projects.length, FileText],
    ["Listings", listings.length, TrendingUp],
    ["Assets", assets.length, ImagePlus],
    ["Agent actions", activities.length, Activity],
  ] as const;
  return <div className="max-w-5xl space-y-6"><PageHeader title="Analytics" description="Live metrics from the current SellerCrew workspace." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, Icon]) => <Card key={label}><CardContent className="p-5"><Icon className="size-5 text-[#035EF9]" /><p className="mt-4 text-2xl font-bold">{value}</p><p className="text-sm text-gray-500">{label}</p></CardContent></Card>)}</div></div>;
}

export function InvoicesPage() {
  const { plan } = useDashboardStore();
  return <div className="max-w-4xl space-y-6"><PageHeader title="Invoices" description="Downloadable billing records for this workspace." /><Card><CardContent className="flex items-center gap-3 p-4"><FileText className="size-5 text-gray-400" /><div className="flex-1"><p className="text-sm font-medium">Current {plan} plan statement</p><p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p></div><Button variant="outline" onClick={() => toast.info("No external invoice provider is connected yet.")}><Download className="mr-2 size-4" /> Download</Button></CardContent></Card></div>;
}

export function CreditsPage() {
  return <UsagePage />;
}
