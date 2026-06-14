import * as z from "zod";

export const workflowAgentIds = [
  "ali-intake",
  "saleem-gate",
  "noor",
  "raed",
  "fares",
  "hakim",
  "bayan",
  "nadeem",
  "rayan",
  "adam",
  "badr",
  "saleem-final",
  "ali-final",
] as const;

export const workflowSteps = [
  { id: "ali-intake", agentId: "ali", label: "Ali", task: "Intake, evidence lock, and routing" },
  { id: "saleem-gate", agentId: "saleem", label: "Saleem", task: "Initial compliance gate" },
  { id: "noor", agentId: "noor", label: "Noor", task: "Product image analysis" },
  { id: "raed", agentId: "raed", label: "Raed", task: "Keyword and product research" },
  { id: "fares", agentId: "fares", label: "Fares", task: "Market intelligence" },
  { id: "hakim", agentId: "hakim", label: "Hakim", task: "Listing strategy" },
  { id: "bayan", agentId: "bayan", label: "Bayan", task: "Listing and A+ copywriting" },
  { id: "nadeem", agentId: "nadeem", label: "Nadeem", task: "SEO optimization" },
  { id: "rayan", agentId: "rayan", label: "Rayan", task: "Creative direction and image concepts" },
  { id: "adam", agentId: "adam", label: "Adam", task: "Sequential image production" },
  { id: "badr", agentId: "badr", label: "Badr", task: "Accuracy and quality review" },
  { id: "saleem-final", agentId: "saleem", label: "Saleem", task: "Final policy and claims review" },
  { id: "ali-final", agentId: "ali", label: "Ali", task: "Final approval and delivery" },
] as const;

export const marketplaceOptions = ["Amazon Egypt"] as const;

const workflowStepStatuses = ["completed", "needs_review", "blocked", "skipped"] as const;
type WorkflowStepStatus = (typeof workflowStepStatuses)[number];

const workflowStepStatusAliases: Record<string, WorkflowStepStatus> = {
  working: "completed",
  running: "completed",
  in_progress: "completed",
  inprogress: "completed",
  done: "completed",
  complete: "completed",
  success: "completed",
  successful: "completed",
  approved: "completed",
  pending: "skipped",
  queued: "skipped",
  waiting: "skipped",
  not_started: "skipped",
  notstarted: "skipped",
  failed: "needs_review",
  error: "needs_review",
  review: "needs_review",
  warning: "needs_review",
  rejected: "blocked",
};

// AI providers occasionally return step statuses outside the allowed set
// (e.g. "working", "pending"). Coerce them instead of failing the whole run.
export function coerceWorkflowStepStatus(value: unknown): WorkflowStepStatus {
  if (typeof value !== "string") return "completed";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((workflowStepStatuses as readonly string[]).includes(normalized)) {
    return normalized as WorkflowStepStatus;
  }
  return workflowStepStatusAliases[normalized] ?? "completed";
}

const workflowStepStatusSchema = z.preprocess(
  (value) => coerceWorkflowStepStatus(value),
  z.enum(workflowStepStatuses)
);

const uploadedImageSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(2_500_000),
  dataUrl: z.string().startsWith("data:image/").max(3_500_000),
});

export const productInputSchema = z.object({
  productName: z.string().trim().min(2).max(200),
  brandName: z.string().trim().min(2).max(120),
  marketplace: z.enum(marketplaceOptions),
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(8000),
  specifications: z.string().trim().max(5000).default(""),
  materials: z.string().trim().max(1000).default(""),
  dimensions: z.string().trim().max(1000).default(""),
  colors: z.string().trim().max(1000).default(""),
  targetAudience: z.string().trim().max(1500).default(""),
  keywords: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  competitorAsins: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  notes: z.string().trim().max(3000).default(""),
  uploadedImages: z.array(uploadedImageSchema).min(1).max(6),
});

const evidenceSchema = z.object({
  claim: z.string(),
  sourceType: z.enum(["user_input", "uploaded_image", "external_source", "policy_reference"]),
  sourceReference: z.string(),
  createdByAgent: z.enum(["ali", "saleem", "noor", "raed", "fares", "hakim", "bayan", "nadeem", "rayan", "adam", "badr"]),
  status: z.enum(["verified", "needs_verification", "rejected"]),
});

const imagePlanItemSchema = z.object({
  imageNumber: z.number().int().min(1).max(6),
  purpose: z.string(),
  description: z.string(),
  verifiedFeaturesUsed: z.array(z.string()),
  textOverlayAllowed: z.boolean(),
  aspectRatio: z.string(),
  resolution: z.string(),
  prompt: z.string(),
  negativePrompt: z.string(),
  complianceNotes: z.string(),
});

const policyReviewSchema = z.object({
  status: z.enum(["approved", "needs_review", "blocked"]),
  riskLevel: z.enum(["low", "medium", "high"]),
  notes: z.array(z.string()),
  blockedTerms: z.array(z.string()),
});

export const agentReportSchema = z.object({
  stepId: z.enum(workflowAgentIds),
  agentId: z.enum(["ali", "saleem", "noor", "raed", "fares", "hakim", "bayan", "nadeem", "rayan", "adam", "badr"]),
  summary: z.string(),
  analysis: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  handoff: z.string(),
  output: z.record(z.string(), z.unknown()).default({}),
  provider: z.string().default("unknown"),
  model: z.string().default("unknown"),
  startedAt: z.string(),
  completedAt: z.string(),
});

export const generatedImageSchema = z.object({
  imageNumber: z.number().int().min(1).max(6),
  purpose: z.string(),
  prompt: z.string(),
  mimeType: z.string(),
  dataUrl: z.string().startsWith("data:image/"),
  model: z.string(),
});

export const fullWorkflowResultSchema = z.object({
  workflowSummary: z.string(),
  workflowSteps: z.array(
    z.object({
      id: z.enum(workflowAgentIds),
      status: workflowStepStatusSchema,
      summary: z.string(),
      warnings: z.array(z.string()).default([]),
    })
  ).length(workflowAgentIds.length),
  evidenceLock: z.array(evidenceSchema),
  listingContent: z.object({
    title: z.string(),
    bulletPoints: z.array(z.string()).max(5),
    description: z.string(),
    backendSearchTerms: z.array(z.string()),
    aPlusContent: z.array(
      z.object({
        heading: z.string(),
        body: z.string(),
      })
    ),
  }),
  imagePlan: z.array(imagePlanItemSchema).max(6),
  scores: z.object({
    qualityScore: z.number().min(0).max(100),
    seoScore: z.number().min(0).max(100),
    conversionScore: z.number().min(0).max(100),
    complianceScore: z.number().min(0).max(100),
    accuracyScore: z.number().min(0).max(100),
    overallScore: z.number().min(0).max(100),
  }),
  initialPolicyStatus: policyReviewSchema,
  policyStatus: policyReviewSchema,
  qualityReport: z.object({
    strengths: z.array(z.string()),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
    hallucinationRisk: z.number().min(0).max(100),
    requiresRevision: z.boolean(),
    revisionTargetAgent: z.enum(["hakim", "bayan", "nadeem", "rayan", "adam"]).nullable(),
  }),
  exportOptions: z.array(z.enum(["txt", "json", "csv"])),
  agentReports: z.array(agentReportSchema).default([]),
  generatedImages: z.array(generatedImageSchema).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type FullWorkflowResult = z.infer<typeof fullWorkflowResultSchema>;
export type AgentReport = z.infer<typeof agentReportSchema>;
export type GeneratedImage = z.infer<typeof generatedImageSchema>;

export interface StoredWorkflowRun {
  id: string;
  projectId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  result?: FullWorkflowResult;
  error?: string;
}
