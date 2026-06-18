"use client";

import { useEffect, useMemo, useState, type ClipboardEvent } from "react";
import { agents } from "@/lib/agents";
import { FULL_WORKFLOW_COST } from "@/lib/credits";
import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import {
  fullWorkflowResultSchema,
  workflowSteps,
  type AgentReport,
  type FullWorkflowResult,
  type GeneratedImage,
  type ProductInput,
} from "@/lib/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Eye,
  Download,
  FileJson,
  FileText,
  Image as ImageIcon,
  Loader2,
  Play,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

const emptyInput: ProductInput = {
  productName: "",
  brandName: "",
  marketplace: "Amazon Egypt",
  category: "",
  description: "",
  specifications: "",
  materials: "",
  dimensions: "",
  colors: "",
  targetAudience: "",
  keywords: [],
  competitorAsins: [],
  notes: "",
  uploadedImages: [],
};

function formattedClipboardText(event: ClipboardEvent<HTMLTextAreaElement>): string {
  const plainText = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
  const html = event.clipboardData.getData("text/html");
  if (!html) return plainText;

  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("br").forEach((element) => element.replaceWith("\n"));
  document.querySelectorAll("li").forEach((element) => {
    element.prepend("• ");
    element.append("\n");
  });
  document.querySelectorAll("p, div, section, article, h1, h2, h3, h4, h5, h6, tr").forEach((element) => {
    element.append("\n");
  });

  const structured = (document.body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return structured.includes("\n") || !plainText.includes("\n") ? structured : plainText;
}

const workflowActivityCopy: Record<(typeof workflowSteps)[number]["id"], { title: string; detail: string }> = {
  "ali-intake": {
    title: "Reviewing your product data",
    detail: "Reading the description, organizing the uploaded images, and locking verified product evidence.",
  },
  "saleem-gate": {
    title: "Checking claims before production",
    detail: "Reviewing product claims and evidence for policy risks before the crew starts creating content.",
  },
  noor: {
    title: "Analyzing your product images",
    detail: "Inspecting visible features, packaging, labels, angles, and details that can support the listing.",
  },
  raed: {
    title: "Building the keyword direction",
    detail: "Mapping product language and buyer search intent without inventing unsupported ranking data.",
  },
  fares: {
    title: "Analyzing the Egyptian market context",
    detail: "Reviewing positioning, category expectations, and competitor context for Amazon Egypt.",
  },
  hakim: {
    title: "Designing the listing strategy",
    detail: "Turning verified evidence and research into a clear positioning and conversion structure.",
  },
  bayan: {
    title: "Writing the listing content",
    detail: "Creating the title, bullet points, description, and A+ copy from the approved strategy.",
  },
  nadeem: {
    title: "Optimizing search visibility",
    detail: "Placing relevant keywords naturally across the listing and preparing backend search terms.",
  },
  rayan: {
    title: "Creating the visual direction",
    detail: "Planning the image sequence, messages, and creative concepts that support the product story.",
  },
  adam: {
    title: "Producing the approved listing images",
    detail: "Converting Rayan's plan into strict prompts and generating each image in order while preserving the exact uploaded product.",
  },
  badr: {
    title: "Running the quality review",
    detail: "Checking accuracy, consistency, completeness, clarity, and readiness across every deliverable.",
  },
  "saleem-final": {
    title: "Running the final policy review",
    detail: "Validating the completed listing and creative plan for claims, policy, and compliance risks.",
  },
  "ali-final": {
    title: "Assembling your final delivery",
    detail: "Reviewing every specialist output, resolving handoffs, and packaging the completed listing.",
  },
};

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function createAssetPreview(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not prepare the asset preview."));
  });
  const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", 0.78);
  return {
    dataUrl: preview,
    size: Math.ceil((preview.length * 3) / 4),
  };
}

export function FullWorkflow() {
  const setDashboardPage = useAppStore((state) => state.setDashboardPage);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const {
    projects,
    selectedProjectId,
    setSelectedProject,
    workflowRuns,
    creditsBalance,
    startWorkflowRun,
    completeWorkflowRun,
    failWorkflowRun,
    consumeCredits,
    createProject,
    saveListing,
    addAssets,
    attachAssetDriveLinks,
    addActivity,
    updateProject,
  } = useDashboardStore();
  const project = projects.find((item) => item.id === selectedProjectId);
  const latestRun = workflowRuns.find((run) => run.projectId === project?.id);
  const latestResult = fullWorkflowResultSchema.safeParse(latestRun?.result);
  const [input, setInput] = useState<ProductInput>(() => ({
    ...emptyInput,
    productName: project?.name ?? "",
  }));
  const [keywordText, setKeywordText] = useState("");
  const [asinText, setAsinText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<FullWorkflowResult | null>(
    latestResult.success ? latestResult.data : null
  );
  const [activeTab, setActiveTab] = useState(result ? "delivery" : "input");
  const [resultProvider, setResultProvider] = useState<string | null>(null);
  const [extraDetailsOpen, setExtraDetailsOpen] = useState(false);
  const [agentReports, setAgentReports] = useState<AgentReport[]>(result?.agentReports ?? []);
  const [selectedReport, setSelectedReport] = useState<AgentReport | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<string, "queued" | "working" | "completed" | "blocked">>({});
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(result?.generatedImages ?? []);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  // Persistent in-UI copy of the last failure, so the message stays readable even
  // if the toast auto-hides or is missed. Cleared when a new run starts.
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      setInput(emptyInput);
      setKeywordText("");
      setAsinText("");
      setResult(null);
      setAgentReports([]);
      setGeneratedImages([]);
      setStepStatuses({});
      setActiveStep(0);
      setActiveTab("input");
      return;
    }
    setInput((current) => ({
      ...current,
      productName: current.productName || project.name,
      marketplace: "Amazon Egypt",
    }));
  }, [project]);

  const progress = result
    ? 100
    : isRunning
      ? Math.min(94, Math.max(4, Math.round(((activeStep + 0.35) / workflowSteps.length) * 100)))
      : 0;
  const activeWorkflowStep = workflowSteps[activeStep];
  const activeAgent = agents.find((agent) => agent.id === activeWorkflowStep.agentId) ?? agents[0];
  const previousWorkflowStep = activeStep > 0 ? workflowSteps[activeStep - 1] : null;
  const previousAgent = previousWorkflowStep
    ? agents.find((agent) => agent.id === previousWorkflowStep.agentId) ?? agents[0]
    : null;
  const nextWorkflowStep = activeStep < workflowSteps.length - 1 ? workflowSteps[activeStep + 1] : null;
  const nextAgent = nextWorkflowStep
    ? agents.find((agent) => agent.id === nextWorkflowStep.agentId) ?? agents[0]
    : null;
  const updateInput = (
    key: Exclude<keyof ProductInput, "keywords" | "competitorAsins" | "uploadedImages">,
    value: string
  ) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const addProductImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files).slice(0, 6 - input.uploadedImages.length);
    const invalidFile = selectedFiles.find(
      (file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2_500_000
    );
    if (invalidFile) {
      toast.error("Use JPG, PNG, or WebP images up to 2.5 MB each.");
      return;
    }

    const uploadedImages = await Promise.all(
      selectedFiles.map((file) => new Promise<ProductInput["uploadedImages"][number]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          name: file.name,
          type: file.type as ProductInput["uploadedImages"][number]["type"],
          size: file.size,
          dataUrl: String(reader.result),
        });
        reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
        reader.readAsDataURL(file);
      }))
    );
    setInput((current) => ({
      ...current,
      uploadedImages: [...current.uploadedImages, ...uploadedImages].slice(0, 6),
    }));
  };

  const runWorkflow = async () => {
    if (
      input.productName.trim().length < 2
      || input.brandName.trim().length < 2
      || input.description.trim().length < 30
    ) {
      return toast.error("Add the product name, brand, and a detailed description of at least 30 characters.");
    }
    if (!input.uploadedImages.length) return toast.error("Upload at least one clear product image.");
    if (creditsBalance < FULL_WORKFLOW_COST) {
      return toast.error(`You need ${FULL_WORKFLOW_COST} credits to run the full workflow.`);
    }

    const payload: ProductInput = {
      ...input,
      marketplace: "Amazon Egypt",
      category: input.category.trim() || "General",
      keywords: keywordText.split(",").map((item) => item.trim()).filter(Boolean),
      competitorAsins: asinText.split(",").map((item) => item.trim()).filter(Boolean),
    };
    const activeProject = project ?? createProject(payload.productName);
    const runId = startWorkflowRun(activeProject.id);
    setIsRunning(true);
    setRunError(null);
    setActiveStep(0);
    setResult(null);
    setAgentReports([]);
    setGeneratedImages([]);
    setStepStatuses({});
    setActiveMessage(null);
    setActiveTab("workflow");

    try {
      let data: { provider: string; model?: string; result: unknown } | null = null;

      type WorkflowEvent = {
        type: "step" | "report" | "generated_image" | "provider" | "result" | "error";
        stepId?: string;
        status?: "working" | "completed" | "blocked";
        report?: AgentReport;
        image?: GeneratedImage;
        message?: string;
        provider?: string;
        model?: string;
        result?: unknown;
        error?: string;
      };

      const applyEvent = (event: WorkflowEvent): { provider: string; model?: string; result: unknown } | null => {
        if (event.type === "step" && event.status && event.stepId) {
          setStepStatuses((current) => ({ ...current, [event.stepId!]: event.status! }));
          if (event.status === "working") {
            const stepIndex = workflowSteps.findIndex((step) => step.id === event.stepId);
            if (stepIndex >= 0) setActiveStep(stepIndex);
            setActiveMessage(event.message ?? null);
          }
        }
        if (event.type === "report" && event.report) {
          setAgentReports((current) => [
            ...current.filter((report) => report.stepId !== event.report!.stepId),
            event.report!,
          ]);
        }
        if (event.type === "generated_image" && event.image) {
          setGeneratedImages((current) => [...current, event.image!]);
        }
        if (event.type === "provider" && event.provider) setResultProvider(event.provider);
        if (event.type === "error") throw new Error(event.error || "The full workflow failed.");
        if (event.type === "result" && event.provider && event.result) {
          return { provider: event.provider, model: event.model, result: event.result };
        }
        return null;
      };

      // Prefer the background queue (resumable, survives navigation); if it is
      // not configured the endpoint returns 503 and we stream inline instead.
      const jobRes = await fetch("/api/full-workflow/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (jobRes.status === 202) {
        const { jobId } = (await jobRes.json()) as { jobId: string };
        let processed = 0;
        let polls = 0;
        const maxPolls = 450; // ~15 minutes (image generation can take a while)
        while (true) {
          if (polls++ >= maxPolls) {
            throw new Error("The workflow is still running in the background. Image generation can take several minutes — please keep this page open and try again shortly.");
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const poll = await fetch(`/api/full-workflow/jobs?id=${encodeURIComponent(jobId)}`, { credentials: "include" });
          if (!poll.ok) throw new Error("Lost track of the workflow job.");
          const job = (await poll.json()) as { status: string; events?: unknown[]; result?: unknown; error?: string };
          const events = Array.isArray(job.events) ? job.events : [];
          for (; processed < events.length; processed += 1) {
            const captured = applyEvent(events[processed] as WorkflowEvent);
            if (captured) data = captured;
          }
          if (job.status === "completed" || job.status === "blocked") {
            // The polled events have image data stripped to stay small; the full
            // result (with images) lives in the job's result column.
            if (job.result) data = { provider: data?.provider ?? "queue", model: data?.model, result: job.result };
            break;
          }
          if (job.status === "failed") throw new Error(job.error || "The full workflow failed.");
        }
      } else {
        const response = await fetch("/api/full-workflow/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.body) throw new Error("The workflow progress stream was unavailable.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.trim()) {
              const captured = applyEvent(JSON.parse(line) as WorkflowEvent);
              if (captured) data = captured;
            }
          }
          if (done) break;
        }
      }

      if (!data) throw new Error("The workflow ended without a complete result.");
      const parsed = fullWorkflowResultSchema.parse(data.result);

      completeWorkflowRun(runId, parsed);
      setResult(parsed);
      // Live events carry no image bytes (kept small for polling); use the final ones.
      if (parsed.generatedImages?.length) setGeneratedImages(parsed.generatedImages);
      setResultProvider(data.provider ?? null);
      setActiveStep(workflowSteps.length - 1);
      setActiveTab("delivery");
      // Credits are deducted authoritatively on the server; resync the real balance.
      void useAppStore.getState().bootstrap();
      if (parsed.policyStatus.status !== "blocked") {
        saveListing({
          projectId: activeProject.id,
          productName: payload.productName,
          title: parsed.listingContent.title,
          bullets: parsed.listingContent.bulletPoints,
          description: parsed.listingContent.description,
          keywords: parsed.listingContent.backendSearchTerms,
          complianceScore: parsed.scores.complianceScore,
          status: parsed.policyStatus.status === "approved" ? "reviewed" : "generated",
        });
      }
      updateProject(activeProject.id, {
        name: payload.productName,
        marketplace: payload.marketplace,
        country: payload.marketplace.replace("Amazon ", ""),
        status: parsed.policyStatus.status === "approved" ? "completed" : "active",
        agentId: "ali",
      });
      addActivity(
        parsed.policyStatus.status === "blocked" ? "saleem" : "ali",
        parsed.policyStatus.status === "blocked"
          ? `Blocked high-risk claims for ${payload.productName}`
          : `Completed the full workflow for ${payload.productName}`
      );
      const existingCustomerAssetNames = new Set(
        useDashboardStore.getState().assets
          .filter((asset) => asset.projectId === activeProject.id && asset.source === "customer")
          .map((asset) => asset.name)
      );
      const customerAssetPreviews = await Promise.all(
        payload.uploadedImages
          .filter((image) => !existingCustomerAssetNames.has(image.name))
          .map(async (image) => {
            const preview = await createAssetPreview(image.dataUrl);
            return {
            projectId: activeProject.id,
            name: image.name,
            type: "image" as const,
            source: "customer" as const,
            ...preview,
            };
          })
      );
      const generatedAssetPreviews = await Promise.all(
        parsed.generatedImages.map(async (image) => {
          const preview = await createAssetPreview(image.dataUrl);
          return {
          projectId: activeProject.id,
          name: `${payload.productName} - ${image.purpose}.png`,
          type: "image" as const,
          source: "generated" as const,
          ...preview,
          };
        })
      );
      addAssets([...customerAssetPreviews, ...generatedAssetPreviews]);

      if (activeWorkspace?.id) {
        fetch("/api/google-drive/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workspaceId: activeWorkspace.id,
            projectId: activeProject.id,
            workspaceName: activeWorkspace.name,
            productName: payload.productName,
            brandName: payload.brandName,
            marketplace: payload.marketplace,
            category: payload.category,
            status: parsed.policyStatus.status,
            title: parsed.listingContent.title,
            bullets: parsed.listingContent.bulletPoints,
            description: parsed.listingContent.description,
            keywords: parsed.listingContent.backendSearchTerms,
            complianceScore: parsed.scores.complianceScore,
            customerImages: payload.uploadedImages.map((image) => ({
              name: image.name,
              dataUrl: image.dataUrl,
            })),
            generatedImages: parsed.generatedImages.map((image) => ({
              name: `${payload.productName} - ${image.purpose}.png`,
              dataUrl: image.dataUrl,
            })),
          }),
        })
          .then(async (syncResponse) => {
            const syncData = await syncResponse.json().catch(() => null);
            if (!syncResponse.ok) {
              throw new Error(syncData?.error || "Google Drive sync failed.");
            }
            if (syncResponse.ok && !syncData?.skipped) {
              toast.success("Product backed up to Google Drive.");
              if (Array.isArray(syncData?.generatedImages)) {
                attachAssetDriveLinks(
                  syncData.generatedImages
                    .filter((g: { name?: string; webViewLink?: string }) => g?.name && g?.webViewLink)
                    .map((g: { name: string; webViewLink: string }) => ({ name: g.name, driveUrl: g.webViewLink }))
                );
              }
            }
          })
          .catch((syncError) => {
            toast.warning(syncError instanceof Error ? syncError.message : "Google Drive sync failed.");
          });
      }

      toast.success(
        ["anthropic", "gemini", "openai", "openrouter"].includes(data.provider)
          ? "Full SellerCrew workflow completed."
          : data.provider === "sellercrew-gate"
            ? "Saleem stopped the workflow. Review the flagged claims."
            : "Local review draft created. Check the AI provider configuration."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "The full workflow failed.";
      failWorkflowRun(runId, message);
      setRunError(message);
      setActiveTab("input");
      // Keep the failure visible until the user dismisses it — a 4s auto-hide
      // flashed by before they could read what actually went wrong.
      toast.error("The workflow could not finish", {
        description: message,
        duration: Infinity,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportBaseName = useMemo(
    () => (input.productName || project?.name || "sellercrew-delivery").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    [input.productName, project?.name]
  );

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <button className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900" onClick={() => setDashboardPage(project ? "project-detail" : "home")}>
            <ArrowLeft className="size-4" /> {project ? `Back to ${project.name}` : "Back to dashboard"}
          </button>
          <h2 className="text-3xl font-bold tracking-tight text-[#0B0F1A]">Full Listing Workflow</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            One evidence-locked workflow creates the listing, A+ copy, image plan, prompts, scores, policy review, quality report, and exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {project ? (
            <Button variant="outline" onClick={() => setSelectedProject(null)}>
              <Plus className="mr-2 size-4" /> New product
            </Button>
          ) : null}
          <div className="rounded-xl border bg-white px-4 py-3 text-right">
            <p className="text-xs text-gray-400">Product project</p>
            <p className="font-semibold">{project?.name ?? "New product listing"}</p>
          </div>
        </div>
      </div>

      {runError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">The workflow could not finish</p>
            <p className="mt-1 whitespace-pre-wrap break-words leading-6 text-red-700">{runError}</p>
          </div>
          <button
            type="button"
            onClick={() => setRunError(null)}
            className="shrink-0 rounded-md p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="input">1. Product evidence</TabsTrigger>
          <TabsTrigger value="workflow">2. Crew workflow</TabsTrigger>
          <TabsTrigger value="delivery" disabled={!result}>3. Final delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <Card className="border-[#035EF9]/25 bg-[#035EF9]/[0.035]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="mt-0.5 size-5 shrink-0 text-[#035EF9]" />
                    <div>
                      <p className="font-semibold text-[#0B0F1A]">For the strongest listing result</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Upload clear product photos from multiple angles and write everything you know in the description:
                        features, materials, measurements, package contents, use cases, compatibility, care instructions,
                        and any claims that can be verified. Better evidence gives the crew a stronger and more accurate listing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Essential product information</CardTitle>
                  <p className="text-sm text-gray-500">Add the core product details. SellerCrew creates the project automatically when you run the workflow.</p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["productName", "Product name", "Required"],
                    ["brandName", "Brand name", "Required"],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        placeholder={placeholder}
                        value={String(input[key as keyof ProductInput])}
                        onChange={(event) => updateInput(
                          key as Exclude<keyof ProductInput, "keywords" | "competitorAsins" | "uploadedImages">,
                          event.target.value
                        )}
                      />
                    </div>
                  ))}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Detailed product description</Label>
                    <Textarea
                      id="description"
                      className="min-h-52 whitespace-pre-wrap leading-6"
                      placeholder="Write all confirmed product details: what it is, features, benefits, materials, measurements, package contents, compatibility, use cases, target customer, care instructions, and anything important a buyer should know."
                      value={input.description}
                      onChange={(event) => updateInput("description", event.target.value)}
                      onPaste={(event) => {
                        const text = formattedClipboardText(event);
                        if (!text) return;
                        event.preventDefault();
                        const field = event.currentTarget;
                        const start = field.selectionStart;
                        const end = field.selectionEnd;
                        updateInput(
                          "description",
                          `${input.description.slice(0, start)}${text}${input.description.slice(end)}`
                        );
                        requestAnimationFrame(() => {
                          const cursor = start + text.length;
                          field.setSelectionRange(cursor, cursor);
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500">Pasted paragraphs, headings, and bullet lists keep their structure. Be detailed and factual, and avoid unsupported claims.</p>
                  </div>
                  <div className="space-y-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="product-images">Product images</Label>
                      <p className="mt-1 text-xs text-gray-500">Required. Upload 3-6 clear photos when possible: front, back, sides, packaging, labels, and important details.</p>
                    </div>
                    <label
                      htmlFor="product-images"
                      className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 text-center transition-colors hover:border-[#035EF9]/50 hover:bg-[#035EF9]/[0.025]"
                    >
                      <Upload className="mb-2 size-5 text-[#035EF9]" />
                      <span className="text-sm font-semibold">Upload clear product photos</span>
                      <span className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP, up to 2.5 MB each.</span>
                    </label>
                    <input
                      id="product-images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        void addProductImages(event.currentTarget.files);
                        event.currentTarget.value = "";
                      }}
                    />
                    {input.uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {input.uploadedImages.map((image, index) => (
                          <div key={`${image.name}-${index}`} className="relative overflow-hidden rounded-xl border bg-white">
                            <img src={image.dataUrl} alt={image.name} className="aspect-square w-full object-contain" />
                            <button
                              type="button"
                              aria-label={`Remove ${image.name}`}
                              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-[#0B0F1A]/80 text-white"
                              onClick={() => setInput((current) => ({
                                ...current,
                                uploadedImages: current.uploadedImages.filter((_, imageIndex) => imageIndex !== index),
                              }))}
                            >
                              <X className="size-4" />
                            </button>
                            <p className="truncate px-2 py-2 text-xs text-gray-600">{image.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              <Collapsible open={extraDetailsOpen} onOpenChange={setExtraDetailsOpen}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50/80"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>Extra details</CardTitle>
                          <Badge variant="outline" className="font-normal text-gray-500">Optional</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Add structured specifications, keywords, or special instructions when available.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#035EF9]">
                        {extraDetailsOpen ? "Hide details" : "Add more details"}
                        <ChevronDown className={`size-4 transition-transform duration-200 ${extraDetailsOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="grid gap-4 border-t bg-gray-50/30 pt-6 sm:grid-cols-2">
                  {[
                    ["category", "Category", "Example: Home & Kitchen"],
                    ["materials", "Materials", "Verified materials only"],
                    ["dimensions", "Size / dimensions", "Verified measurements"],
                    ["colors", "Colors / variants", "Available options"],
                    ["targetAudience", "Target audience", "Who is this for?"],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        placeholder={placeholder}
                        value={String(input[key as keyof ProductInput])}
                        onChange={(event) => updateInput(
                          key as Exclude<keyof ProductInput, "keywords" | "competitorAsins" | "uploadedImages">,
                          event.target.value
                        )}
                      />
                    </div>
                  ))}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="specifications">Specifications and package contents</Label>
                    <Textarea id="specifications" placeholder="Technical details, compatibility, included items, care instructions..." value={input.specifications} onChange={(event) => updateInput("specifications", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Known keywords</Label>
                    <Input id="keywords" placeholder="keyword one, keyword two" value={keywordText} onChange={(event) => setKeywordText(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asins">Competitor ASINs</Label>
                    <Input id="asins" placeholder="B0..., B0..." value={asinText} onChange={(event) => setAsinText(event.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes">Instructions for the crew</Label>
                    <Textarea id="notes" placeholder="Brand voice, words to use or avoid, claims that need special care..." value={input.notes} onChange={(event) => updateInput("notes", event.target.value)} />
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            <div className="space-y-4">
              <Card className="border-[#035EF9]/20 bg-[#035EF9]/[0.025]">
                <CardHeader><CardTitle>Evidence Lock</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <p>Every factual statement must point back to seller input or a verified source.</p>
                  <div className="rounded-lg bg-white p-3 text-xs">
                    Unsupported features, materials, benefits, medical claims, guarantees, and rankings are rejected.
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Workflow cost</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs leading-5 text-gray-500">SellerCrew uses the configured OpenRouter text chain and a separate image-only fallback chain for Adam.</p>
                  <div className="flex items-end justify-between">
                    <div><p className="text-3xl font-bold">{FULL_WORKFLOW_COST}</p><p className="text-xs text-gray-500">credits per full run</p></div>
                    <Badge variant="outline">{creditsBalance.toLocaleString()} available</Badge>
                  </div>
                  <Button className="w-full" onClick={runWorkflow} disabled={isRunning}>
                    <Play className="mr-2 size-4" /> Run full workflow
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card className="overflow-hidden border-[#035EF9]/20 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-[#035EF9] via-[#7E44E6] to-[#F84D8E]" />
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      <div
                        className="size-20 overflow-hidden rounded-2xl border bg-white shadow-sm"
                        style={{ borderColor: `${activeAgent.color}55` }}
                      >
                        <img src={activeAgent.avatar} alt={activeAgent.name} className="size-full object-cover" />
                      </div>
                      {isRunning ? (
                        <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-4 border-white bg-[#035EF9] text-white">
                          <Loader2 className="size-3.5 animate-spin" />
                        </span>
                      ) : result ? (
                        <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-4 border-white bg-green-500 text-white">
                          <CheckCircle2 className="size-3.5" />
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-[#0B0F1A]">{activeAgent.name}</h3>
                        <Badge className={isRunning ? "bg-[#035EF9] text-white" : result ? "bg-green-600 text-white" : ""}>
                          {isRunning ? "Working now" : result ? "Completed" : "Ready"}
                        </Badge>
                        {(activeWorkflowStep.id === "saleem-gate" || activeWorkflowStep.id === "saleem-final") && (
                          <Badge variant="outline">Compliance gate</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-500">{activeAgent.role}</p>
                      <p className="mt-5 text-lg font-semibold text-[#0B0F1A]">
                        {result ? "Your full listing workflow is complete" : workflowActivityCopy[activeWorkflowStep.id].title}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        {result
                          ? "Every specialist has completed their assigned work. Your reviewed listing and supporting deliverables are ready."
                          : activeMessage || workflowActivityCopy[activeWorkflowStep.id].detail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        {result ? "Workflow completed" : `Step ${activeStep + 1} of ${workflowSteps.length}`}
                      </span>
                      <span className="font-bold text-[#0B0F1A]">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5 bg-gray-100" />
                  </div>

                  {isRunning && previousWorkflowStep && previousAgent ? (
                    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-green-100 bg-green-50/70 p-4">
                      <div className="flex items-center gap-2">
                        <img src={previousAgent.avatar} alt={previousAgent.name} className="size-7 rounded-lg object-cover" />
                        <span className="text-sm font-semibold text-green-800">{previousAgent.name} completed the handoff</span>
                      </div>
                      <ArrowRight className="size-4 text-green-600" />
                      <div className="flex items-center gap-2">
                        <img src={activeAgent.avatar} alt={activeAgent.name} className="size-7 rounded-lg object-cover" />
                        <span className="text-sm text-green-800">Assigned to {activeAgent.name}</span>
                      </div>
                    </div>
                  ) : null}

                  {isRunning && nextWorkflowStep && nextAgent ? (
                    <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                      <Clock3 className="size-4" />
                      <span>Next: <strong className="font-semibold text-gray-700">{nextAgent.name}</strong> will handle {nextWorkflowStep.task.toLowerCase()}.</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Crew activity</CardTitle>
                <p className="text-xs leading-5 text-gray-500">Live assignment status across the full workflow.</p>
              </CardHeader>
              <CardContent>
                <div>
                  {workflowSteps.map((step, index) => {
                    const agent = agents.find((item) => item.id === step.agentId) ?? agents[0];
                    const outputStep = result?.workflowSteps.find((item) => item.id === step.id);
                    const liveStatus = stepStatuses[step.id] ?? "queued";
                    const running = isRunning && liveStatus === "working";
                    const completed = Boolean(result) || liveStatus === "completed";
                    const blocked = outputStep?.status === "blocked";
                    const skipped = outputStep?.status === "skipped";
                    const report = agentReports.find((item) => item.stepId === step.id);

                    return (
                      <div key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < workflowSteps.length - 1 ? (
                          <span className={`absolute left-[17px] top-9 h-[calc(100%-20px)] w-px ${completed ? "bg-green-200" : "bg-gray-200"}`} />
                        ) : null}
                        <div className={`relative z-10 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white ${
                          running ? "border-[#035EF9] shadow-[0_0_0_4px_rgba(3,94,249,0.10)]" : completed ? "border-green-300" : "border-gray-200"
                        }`}>
                          <img src={agent.avatar} alt={agent.name} className={`size-full object-cover ${!running && !completed ? "grayscale opacity-55" : ""}`} />
                        </div>
                        <button
                          type="button"
                          disabled={!report}
                          onClick={() => report && setSelectedReport(report)}
                          className="min-w-0 flex-1 rounded-lg pt-0.5 text-left outline-none transition-colors enabled:hover:bg-gray-50 enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#035EF9]/25"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-sm font-semibold ${running ? "text-[#035EF9]" : completed ? "text-[#0B0F1A]" : "text-gray-500"}`}>
                              {agent.name}
                            </p>
                            {running ? (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#035EF9]">
                                <Loader2 className="size-3 animate-spin" /> Working
                              </span>
                            ) : blocked ? (
                              <span className="text-[11px] font-semibold text-red-600">Blocked</span>
                            ) : skipped ? (
                              <span className="text-[11px] font-semibold text-gray-400">Skipped</span>
                            ) : completed ? (
                              <span className="flex items-center gap-1.5">
                                {report ? <Eye className="size-3.5 text-gray-400" /> : null}
                                <CheckCircle2 className="size-4 text-green-500" />
                              </span>
                            ) : (
                              <Circle className="size-3.5 text-gray-300" />
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{step.task}</p>
                          {report ? <p className="mt-1 text-[11px] font-medium text-[#035EF9]">Open independent report</p> : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-5">
          {result && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {Object.entries(result.scores).map(([key, value]) => (
                  <Card key={key}><CardContent className="p-4"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs capitalize text-gray-500">{key.replace(/Score$/, "")}</p></CardContent></Card>
                ))}
              </div>

              <div className={`flex items-start gap-3 rounded-xl border p-4 ${result.policyStatus.status === "approved" ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                {result.policyStatus.status === "approved" ? <ShieldCheck className="size-5 text-green-600" /> : <AlertTriangle className="size-5 text-amber-600" />}
                <div><p className="font-semibold capitalize">Policy: {result.policyStatus.status.replace("_", " ")}</p><p className="text-sm text-gray-600">{result.policyStatus.notes.join(" ")}</p></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Initial gate</p>
                  <p className="mt-1 font-semibold capitalize">{result.initialPolicyStatus.status.replace("_", " ")}</p>
                  <p className="mt-1 text-sm text-gray-500">{result.initialPolicyStatus.notes.join(" ")}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Final policy review</p>
                  <p className="mt-1 font-semibold capitalize">{result.policyStatus.status.replace("_", " ")}</p>
                  <p className="mt-1 text-sm text-gray-500">{result.policyStatus.notes.join(" ")}</p>
                </div>
              </div>
              {resultProvider && (
                <div className="flex justify-end">
                  <Badge variant="outline" className="capitalize">
                    Generated with {resultProvider.replace("-", " ")}
                  </Badge>
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Listing content</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                      <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Title</p><p className="mt-2 font-medium">{result.listingContent.title}</p></div>
                      <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bullet points</p><div className="mt-2 space-y-2">{result.listingContent.bulletPoints.map((bullet) => <p key={bullet} className="rounded-lg bg-gray-50 p-3 text-sm">{bullet}</p>)}</div></div>
                      <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Description</p><p className="mt-2 whitespace-pre-line text-sm text-gray-700">{result.listingContent.description}</p></div>
                      <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">A+ content</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{result.listingContent.aPlusContent.map((module) => <div key={module.heading} className="rounded-lg border p-3"><p className="font-semibold">{module.heading}</p><p className="mt-1 text-sm text-gray-500">{module.body}</p></div>)}</div></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Image plan, prompts, and generated assets</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {result.imagePlan.map((image) => (
                        <div key={image.imageNumber} className="rounded-xl border p-4">
                          <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-[#7E44E6]/10"><ImageIcon className="size-4 text-[#7E44E6]" /></div><div><p className="font-semibold">Image {image.imageNumber}: {image.purpose}</p><p className="text-xs text-gray-500">{image.description}</p></div></div>
                          <p className="mt-3 text-xs text-gray-500">{image.aspectRatio} · {image.resolution} · Text overlay {image.textOverlayAllowed ? "allowed" : "not allowed"}</p>
                          <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{image.prompt}</p>
                        </div>
                      ))}
                      {(result.generatedImages.length ? result.generatedImages : generatedImages).length > 0 ? (
                        <div className="grid gap-4 pt-3 sm:grid-cols-2">
                          {(result.generatedImages.length ? result.generatedImages : generatedImages).map((image) => (
                            <div key={`${image.imageNumber}-${image.purpose}`} className="overflow-hidden rounded-xl border bg-white">
                              <img src={image.dataUrl} alt={image.purpose} className="aspect-square w-full object-cover" />
                              <div className="p-3">
                                <p className="font-semibold">Image {image.imageNumber}: {image.purpose}</p>
                                <p className="mt-1 text-xs text-gray-500">Generated with {image.model}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Quality report</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div><p className="font-semibold text-green-700">Strengths</p>{result.qualityReport.strengths.map((item) => <p key={item} className="mt-1 text-gray-600">• {item}</p>)}</div>
                      <div><p className="font-semibold text-amber-700">Issues</p>{result.qualityReport.issues.map((item) => <p key={item} className="mt-1 text-gray-600">• {item}</p>)}</div>
                      <div><p className="font-semibold">Recommendations</p>{result.qualityReport.recommendations.map((item) => <p key={item} className="mt-1 text-gray-600">• {item}</p>)}</div>
                      {result.qualityReport.requiresRevision ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                          Revision required{result.qualityReport.revisionTargetAgent ? ` from ${result.qualityReport.revisionTargetAgent}` : ""}.
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Evidence lock</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {result.evidenceLock.map((evidence) => (
                        <div key={`${evidence.claim}-${evidence.sourceReference}`} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-start justify-between gap-2"><p className="font-medium">{evidence.claim}</p><Badge variant="outline" className="shrink-0">{evidence.status === "needs_verification" ? "Verify before publishing" : evidence.status.replace("_", " ")}</Badge></div>
                          <p className="mt-1 text-xs text-gray-500">{evidence.sourceReference} · {evidence.sourceType.replace("_", " ")} · {evidence.createdByAgent}</p>
                          {evidence.status === "needs_verification" ? (
                            <p className="mt-2 text-xs leading-5 text-amber-700">
                              This fact came from seller input but was not independently proven by an uploaded label, manual, certificate, or reliable source.
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Export delivery</CardTitle></CardHeader>
                    <CardContent className="grid gap-2">
                      <Button variant="outline" onClick={() => downloadFile(`${exportBaseName}.json`, JSON.stringify(result, null, 2), "application/json")}><FileJson className="mr-2 size-4" /> Export JSON</Button>
                      <Button variant="outline" onClick={() => downloadFile(`${exportBaseName}.txt`, [result.listingContent.title, "", ...result.listingContent.bulletPoints, "", result.listingContent.description].join("\n\n"), "text/plain")}><FileText className="mr-2 size-4" /> Export TXT</Button>
                      <Button onClick={() => downloadFile(`${exportBaseName}-scores.csv`, `metric,score\n${Object.entries(result.scores).map(([key, value]) => `${key},${value}`).join("\n")}`, "text/csv")}><Download className="mr-2 size-4" /> Export scores CSV</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          {selectedReport ? (() => {
            const reportAgent = agents.find((agent) => agent.id === selectedReport.agentId) ?? agents[0];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 pr-8">
                    <img src={reportAgent.avatar} alt={reportAgent.name} className="size-12 rounded-xl border object-cover" />
                    <div>
                      <DialogTitle>{reportAgent.name}&apos;s independent report</DialogTitle>
                      <DialogDescription>{reportAgent.role} · {selectedReport.provider} / {selectedReport.model}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="rounded-xl border border-[#035EF9]/15 bg-[#035EF9]/[0.035] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#035EF9]">Work summary</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{selectedReport.summary}</p>
                  </div>

                  {[
                    ["Analysis and checks", selectedReport.analysis],
                    ["Decisions", selectedReport.decisions],
                    ["Evidence used", selectedReport.evidence],
                    ["Warnings", selectedReport.warnings],
                  ].map(([title, items]) => (
                    Array.isArray(items) && items.length ? (
                      <div key={String(title)}>
                        <p className="font-semibold text-[#0B0F1A]">{String(title)}</p>
                        <div className="mt-2 space-y-2">
                          {items.map((item) => (
                            <div key={item} className="rounded-lg border bg-gray-50/60 px-3 py-2 text-sm text-gray-600">{item}</div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))}

                  <div>
                    <p className="font-semibold text-[#0B0F1A]">Structured output</p>
                    <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-[#0B0F1A] p-4 text-xs leading-5 text-gray-200">
                      {JSON.stringify(selectedReport.output, null, 2)}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Handoff</p>
                    <p className="mt-2 text-sm text-green-900">{selectedReport.handoff}</p>
                  </div>
                </div>
              </>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
