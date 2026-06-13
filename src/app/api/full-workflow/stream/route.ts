import { NextRequest } from "next/server";
import { z } from "zod";
import { generateAIText, parseAIJson, type AIImageInput } from "@/lib/ai/providers";
import { generateProductImage } from "@/lib/ai/image-generation";
import { guard } from "@/lib/api-guard";
import { findBlockedTerms } from "@/lib/compliance";
import {
  agentReportSchema,
  fullWorkflowResultSchema,
  productInputSchema,
  workflowSteps,
  type AgentReport,
  type FullWorkflowResult,
  type GeneratedImage,
  type ProductInput,
} from "@/lib/workflow";

export const runtime = "nodejs";
export const maxDuration = 300;

const agentWorkSchema = z.object({
  summary: z.string(),
  analysis: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  handoff: z.string(),
  output: z.record(z.string(), z.unknown()).default({}),
});

const finalResultSchema = fullWorkflowResultSchema.omit({
  agentReports: true,
  generatedImages: true,
  // Step statuses are derived deterministically from what actually executed,
  // never trusted from the model output (which can return invalid statuses).
  workflowSteps: true,
});

type ProgressEvent =
  | { type: "step"; stepId: string; status: "working" | "completed" | "blocked"; message?: string }
  | { type: "report"; report: AgentReport }
  | { type: "generated_image"; image: GeneratedImage }
  | { type: "result"; provider: string; model?: string; result: FullWorkflowResult }
  | { type: "error"; error: string };

function createEmitter(controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder();
  return (event: ProgressEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

function compactContext(input: ProductInput) {
  const { uploadedImages, ...product } = input;
  return {
    product,
    uploadedImages: uploadedImages.map(({ name, type, size }) => ({ name, type, size })),
  };
}

function reportContext(reports: AgentReport[]) {
  return reports.map(({ stepId, agentId, summary, analysis, decisions, evidence, warnings, output }) => ({
    stepId,
    agentId,
    summary,
    analysis,
    decisions,
    evidence,
    warnings,
    output,
  }));
}

function retryDelay(error: unknown, attempt: number) {
  const message = error instanceof Error ? error.message : "";
  const providerDelay = message.match(/retry in\s+([\d.]+)s/i);
  if (providerDelay) return Math.min(65_000, Math.ceil(Number(providerDelay[1]) * 1_000) + 1_000);
  return Math.min(30_000, 4_000 * (attempt + 1));
}

async function withProviderRetry<T>(
  operation: () => Promise<T>,
  onRetry: (delayMs: number) => void
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const retryable = /quota|rate limit|429|retry in|temporar|overloaded/i.test(message);
      if (!retryable || attempt === 2) throw error;
      const delayMs = retryDelay(error, attempt);
      onRetry(delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function agentInstructions(stepId: string) {
  const instructions: Record<string, string> = {
    "ali-intake": `Act as Ali, SellerCrew's chief coordinator. Read the seller input, create a verified master context, list factual evidence, identify missing information, and define the exact routing plan. output must include masterContext, evidenceLock, missingInformation, and assignments.`,
    "saleem-gate": `Act as Saleem, the compliance gate. Independently inspect the seller input and Ali's intake for unsupported claims and Amazon policy risk. output must include status (approved, needs_review, or blocked), riskLevel, notes, and blockedTerms. If blocked, explain exactly what the seller must change.`,
    noor: `Act as Noor, the vision specialist. Analyze the supplied product images independently. Separate directly visible facts from uncertain observations. output must include visibleFacts, uncertainObservations, imageQualityIssues, and recommendedAngles.`,
    raed: `Act as Raed, the keyword specialist for Amazon Egypt. Build keyword and search-intent direction using only supplied facts. Do not invent search volume or ranking data. output must include primaryKeywords, secondaryKeywords, searchIntents, and excludedTerms.`,
    fares: `Act as Fares, the market intelligence specialist for Amazon Egypt. Produce category and positioning guidance without pretending to have live market data. output must include marketPatterns, positioningOpportunities, competitorCautions, and buyerExpectations.`,
    hakim: `Act as Hakim, the listing strategist. Use the approved evidence plus Noor, Raed, and Fares reports to define positioning and listing structure. output must include positioning, valueProposition, titleFramework, bulletPlan, aPlusPlan, and claimsToAvoid.`,
    bayan: `Act as Bayan, the listing copywriter. Write evidence-grounded listing copy from Hakim's strategy. output must include title, bulletPoints (maximum 5), description, and aPlusContent.`,
    nadeem: `Act as Nadeem, the SEO specialist. Independently optimize Bayan's copy using Raed's keyword report without adding product facts. output must include optimizedTitle, optimizedBulletPoints, optimizedDescription, backendSearchTerms, and keywordPlacementNotes.`,
    rayan: `Act as Rayan, the creative director. Create 4-6 evidence-grounded Amazon image concepts. output must include imagePlan, an array whose items contain imageNumber, purpose, description, verifiedFeaturesUsed, textOverlayAllowed, aspectRatio, resolution, complianceNotes.`,
    adam: `Act as Adam, the image production specialist. Convert Rayan's approved concepts into precise image-generation prompts that preserve the exact uploaded product. output must include imagePrompts, an array whose items contain imageNumber, purpose, prompt, and negativePrompt.`,
    badr: `Act as Badr, the quality analyst. Review all listing and creative outputs for accuracy, consistency, completeness, SEO, conversion quality, and hallucination risk. output must include scores, strengths, issues, recommendations, hallucinationRisk, requiresRevision, and revisionTargetAgent.`,
    "saleem-final": `Act as Saleem for the final policy review. Inspect the finished listing, image plan, and generated-image prompts. output must include status, riskLevel, notes, and blockedTerms.`,
    "ali-final": `Act as Ali for final assembly. Review every independent specialist report and produce the final SellerCrew delivery. Resolve conflicts conservatively and use only verified evidence.`,
  };
  return instructions[stepId];
}

async function runAgent(options: {
  stepId: (typeof workflowSteps)[number]["id"];
  input: ProductInput;
  reports: AgentReport[];
  emit: (event: ProgressEvent) => void;
  images?: AIImageInput[];
  final?: boolean;
}) {
  const step = workflowSteps.find((item) => item.id === options.stepId);
  if (!step) throw new Error(`Unknown workflow step: ${options.stepId}`);
  options.emit({ type: "step", stepId: step.id, status: "working", message: step.task });
  const startedAt = new Date().toISOString();
  const schema = options.final ? finalResultSchema : agentWorkSchema;
  const previousReports = reportContext(options.reports);
  const response = await withProviderRetry(
    () => generateAIText({
      system: `${agentInstructions(step.id)}

You are one independent specialist in a multi-agent workflow. Do only your assigned role. Do not impersonate other agents. Do not expose hidden chain-of-thought. Return a concise professional work report containing conclusions, evidence, decisions, warnings, handoff, and structured output.`,
      prompt: `${JSON.stringify({
        sellerInput: compactContext(options.input),
        upstreamReports: previousReports,
      })}

Return only JSON matching this schema:
${JSON.stringify(z.toJSONSchema(schema))}`,
      images: options.images,
      json: true,
      maxTokens: options.final ? 8_000 : 2_500,
    }),
    (delayMs) => options.emit({
      type: "step",
      stepId: step.id,
      status: "working",
      message: `Provider rate limit reached. Retrying automatically in ${Math.ceil(delayMs / 1_000)} seconds.`,
    })
  );

  if (options.final) {
    options.emit({ type: "step", stepId: step.id, status: "completed" });
    return {
      result: finalResultSchema.parse(parseAIJson(response.text)),
      provider: response.provider,
      model: response.model,
    };
  }

  const work = agentWorkSchema.parse(parseAIJson(response.text));
  const report = agentReportSchema.parse({
    ...work,
    stepId: step.id,
    agentId: step.agentId,
    provider: response.provider,
    model: response.model,
    startedAt,
    completedAt: new Date().toISOString(),
  });
  options.reports.push(report);
  options.emit({ type: "report", report });
  options.emit({ type: "step", stepId: step.id, status: "completed" });
  return report;
}

function blockedResult(input: ProductInput, reports: AgentReport[]): FullWorkflowResult {
  const saleem = reports.find((report) => report.stepId === "saleem-gate");
  const blockedTerms = Array.isArray(saleem?.output.blockedTerms)
    ? saleem.output.blockedTerms.map(String)
    : saleem?.warnings ?? [];
  const notes = Array.isArray(saleem?.output.notes)
    ? saleem.output.notes.map(String)
    : [saleem?.summary ?? "Saleem blocked the workflow."];

  return {
    workflowSummary: "Saleem stopped the workflow at the initial compliance gate.",
    workflowSteps: workflowSteps.map((step, index) => ({
      id: step.id,
      status: index === 0 ? "completed" : index === 1 ? "blocked" : "skipped",
      summary: reports.find((report) => report.stepId === step.id)?.summary
        ?? "Skipped because the initial compliance gate blocked the workflow.",
      warnings: reports.find((report) => report.stepId === step.id)?.warnings ?? [],
    })),
    evidenceLock: [{
      claim: input.description,
      sourceType: "user_input",
      sourceReference: "Product description",
      createdByAgent: "ali",
      status: "needs_verification",
    }],
    listingContent: { title: "", bulletPoints: [], description: "", backendSearchTerms: [], aPlusContent: [] },
    imagePlan: [],
    scores: {
      qualityScore: 0, seoScore: 0, conversionScore: 0, complianceScore: 0,
      accuracyScore: 0, overallScore: 0,
    },
    initialPolicyStatus: { status: "blocked", riskLevel: "high", notes, blockedTerms },
    policyStatus: { status: "blocked", riskLevel: "high", notes, blockedTerms },
    qualityReport: {
      strengths: ["The compliance gate prevented risky claims from entering production."],
      issues: notes,
      recommendations: ["Correct the flagged seller input and run the workflow again."],
      hallucinationRisk: 0,
      requiresRevision: true,
      revisionTargetAgent: null,
    },
    exportOptions: ["txt", "json", "csv"],
    agentReports: reports,
    generatedImages: [],
  };
}

function deterministicBlockedResult(input: ProductInput, blockedTerms: string[]): FullWorkflowResult {
  const notes = ["Remove or substantiate the flagged claims before running the workflow again."];
  return {
    workflowSummary: "The workflow stopped at the deterministic compliance gate. No listing or image content was generated.",
    workflowSteps: workflowSteps.map((step, index) => ({
      id: step.id,
      status: index === 0 ? "completed" : index === 1 ? "blocked" : "skipped",
      summary:
        index === 0
          ? "Ali validated the intake and routed it to the compliance gate."
          : index === 1
            ? "The compliance gate detected high-risk claims that require seller correction."
            : "Skipped because the compliance gate blocked the workflow.",
      warnings: index === 1 ? blockedTerms : [],
    })),
    evidenceLock: [{
      claim: input.description,
      sourceType: "user_input",
      sourceReference: "Product description",
      createdByAgent: "ali",
      status: "needs_verification",
    }],
    listingContent: { title: "", bulletPoints: [], description: "", backendSearchTerms: [], aPlusContent: [] },
    imagePlan: [],
    scores: {
      qualityScore: 0, seoScore: 0, conversionScore: 0, complianceScore: 0,
      accuracyScore: 0, overallScore: 0,
    },
    initialPolicyStatus: { status: "blocked", riskLevel: "high", notes, blockedTerms },
    policyStatus: { status: "blocked", riskLevel: "high", notes, blockedTerms },
    qualityReport: {
      strengths: ["The deterministic gate prevented unsafe claims from reaching generated content."],
      issues: blockedTerms.map((term) => `High-risk claim detected: ${term}.`),
      recommendations: ["Correct the source product information and attach reliable substantiation where required."],
      hallucinationRisk: 0,
      requiresRevision: true,
      revisionTargetAgent: null,
    },
    exportOptions: ["txt", "json", "csv"],
    agentReports: [],
    generatedImages: [],
  };
}

// Build the per-step status list from what actually executed, rather than
// trusting the model to emit valid statuses.
function buildExecutedSteps(reports: AgentReport[]): FullWorkflowResult["workflowSteps"] {
  const completed = new Set<string>(reports.map((report) => report.stepId));
  completed.add("ali-final"); // the final assembly step does not push a report
  return workflowSteps.map((step) => {
    const report = reports.find((item) => item.stepId === step.id);
    return {
      id: step.id,
      status: (completed.has(step.id) ? "completed" : "skipped") as "completed" | "skipped",
      summary:
        report?.summary ??
        (step.id === "ali-final" ? "Ali assembled and approved the final delivery." : `${step.label} did not run.`),
      warnings: report?.warnings ?? [],
    };
  });
}

function outputStatus(report: AgentReport) {
  return String(report.output.status ?? "").toLowerCase();
}

function imagePrompts(report: AgentReport) {
  const prompts = Array.isArray(report.output.imagePrompts) ? report.output.imagePrompts : [];
  return prompts.slice(0, 2).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const imageNumber = Number(value.imageNumber);
    const prompt = String(value.prompt ?? "");
    if (!Number.isInteger(imageNumber) || !prompt) return [];
    return [{
      imageNumber,
      purpose: String(value.purpose ?? `Listing image ${imageNumber}`),
      prompt,
    }];
  });
}

export async function POST(request: NextRequest) {
  const access = guard(request, { scope: "full-workflow", limit: 8, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response(
      `${JSON.stringify({ type: "error", error: "Complete the required product information before starting the workflow." })}\n`,
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const input = parsed.data;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = createEmitter(controller);
      const reports: AgentReport[] = [];
      const generatedImages: GeneratedImage[] = [];
      const references = input.uploadedImages.map((image) => ({ dataUrl: image.dataUrl, type: image.type }));

      try {
        const blockedTerms = findBlockedTerms(input);
        if (blockedTerms.length) {
          emit({ type: "step", stepId: "ali-intake", status: "completed" });
          emit({ type: "step", stepId: "saleem-gate", status: "blocked" });
          emit({
            type: "result",
            provider: "sellercrew-gate",
            result: deterministicBlockedResult(input, blockedTerms),
          });
          return;
        }

        await runAgent({ stepId: "ali-intake", input, reports, emit });
        const gate = await runAgent({ stepId: "saleem-gate", input, reports, emit }) as AgentReport;
        if (outputStatus(gate) === "blocked") {
          emit({ type: "step", stepId: "saleem-gate", status: "blocked" });
          emit({ type: "result", provider: gate.provider, model: gate.model, result: blockedResult(input, reports) });
          return;
        }

        await runAgent({ stepId: "noor", input, reports, emit, images: references });
        await Promise.all([
          runAgent({ stepId: "raed", input, reports, emit }),
          runAgent({ stepId: "fares", input, reports, emit }),
        ]);
        await runAgent({ stepId: "hakim", input, reports, emit });
        await Promise.all([
          runAgent({ stepId: "bayan", input, reports, emit }),
          runAgent({ stepId: "rayan", input, reports, emit }),
        ]);
        const [, adam] = await Promise.all([
          runAgent({ stepId: "nadeem", input, reports, emit }),
          runAgent({ stepId: "adam", input, reports, emit }),
        ]);

        if (adam && "output" in adam) {
          const prompts = imagePrompts(adam);
          const images = await Promise.allSettled(
            prompts.map((item) => generateProductImage({ ...item, referenceImages: references }))
          );
          for (const image of images) {
            if (image.status !== "fulfilled") continue;
            generatedImages.push(image.value);
            emit({ type: "generated_image", image: image.value });
          }
        }

        await runAgent({ stepId: "badr", input, reports, emit });
        await runAgent({ stepId: "saleem-final", input, reports, emit });
        const final = await runAgent({ stepId: "ali-final", input, reports, emit, final: true });
        if (!final || !("result" in final)) throw new Error("Ali did not return a final delivery.");

        const result = fullWorkflowResultSchema.parse({
          ...final.result,
          workflowSteps: buildExecutedSteps(reports),
          agentReports: reports,
          generatedImages,
        });
        emit({ type: "result", provider: final.provider, model: final.model, result });
      } catch (error) {
        emit({
          type: "error",
          error: error instanceof Error ? error.message : "The multi-agent workflow failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
