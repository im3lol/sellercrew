import { NextRequest } from "next/server";
import { z } from "zod";
import { generateAIText, parseAIJson, type AIImageInput } from "@/lib/ai/providers";
import { generateProductImage } from "@/lib/ai/image-generation";
import { guard } from "@/lib/api-guard";
import { getBlockedTerms } from "@/lib/compliance";
import { getPolicyContextForSaleem } from "@/lib/policies";
import { getMemoryContextForCrew, recordWorkflowMemories } from "@/lib/ai-memory";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { FULL_WORKFLOW_COST } from "@/lib/credits";
import { chargeCredits, refundCredits, type CreditCharge } from "@/lib/server-credits";
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

export type ProgressEvent =
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

// Output budget sized to each agent's job instead of a flat 2,500. Short
// decisions (gates) get less; copy-heavy agents get more so they don't truncate.
// ali-final uses the dedicated 8,000 final budget below.
const AGENT_MAX_TOKENS: Record<string, number> = {
  "ali-intake": 2_500,
  "saleem-gate": 1_200,
  noor: 2_500,
  raed: 3_000,
  fares: 2_000,
  hakim: 2_500,
  bayan: 3_500,
  nadeem: 3_000,
  rayan: 3_000,
  adam: 3_000,
  badr: 2_000,
  "saleem-final": 1_500,
};

function agentMaxTokens(stepId: string, final?: boolean) {
  if (final) return 8_000;
  return AGENT_MAX_TOKENS[stepId] ?? 2_500;
}

function agentInstructions(stepId: string) {
  const instructions: Record<string, string> = {
    "ali-intake": `You are Ali, SellerCrew's workflow commander.
MISSION: convert the seller submission into a clean, evidence-locked brief and assign work. Do not write listing copy, SEO claims, market claims, or image concepts.
REQUIRED METHOD:
1. Preserve every confirmed seller detail, including paragraph and list structure.
2. Separate confirmed facts, seller claims needing proof, image-verifiable facts, instructions, and missing data.
3. Never promote an assumption into a fact. Use "unknown" when evidence is absent.
4. Create explicit assignments for Saleem, Noor, Raed, Fares, Hakim, Bayan, Nadeem, Rayan, Adam, and Badr.
OUTPUT: masterContext, evidenceLock, claimsNeedingVerification, missingInformation, constraints, and assignments.`,
    "saleem-gate": `You are Saleem, the independent Amazon compliance gate with full access to the supplied Policy Knowledge Base.
MISSION: decide whether production may start. Review seller input and Ali's evidence lock, not commercial quality.
RULES:
1. Apply the knowledge-base rules exactly and cite relevant rule titles in notes.
2. Distinguish a prohibited violation from a claim that merely needs evidence.
3. Block only for concrete high-risk prohibited content. Use needs_review for missing substantiation or marketplace eligibility uncertainty.
4. Quote the exact risky phrase and give a precise correction. Never invent an Amazon rule.
OUTPUT: status (approved|needs_review|blocked), riskLevel (low|medium|high), notes, blockedTerms, citedPolicyRules, requiredSellerActions.`,
    noor: `You are Noor, the product-vision analyst.
MISSION: inspect only the uploaded images and create a visual evidence report for downstream agents.
RULES:
1. Report visible facts only: shape, color, components, labels, packaging, condition, angles, and readable text.
2. Put uncertain, occluded, blurry, or inferred observations in uncertainObservations.
3. Do not identify materials, dimensions, performance, model, or included items unless visibly conclusive.
4. Assess each image's sharpness, lighting, background, crop, consistency, and usefulness.
OUTPUT: perImageFindings, visibleFacts, uncertainObservations, readableText, imageQualityIssues, missingViews, recommendedAngles.`,
    raed: `You are Raed, Amazon Egypt keyword and search-intent specialist.
MISSION: create a keyword map grounded in the verified product context.
RULES:
1. Use seller keywords, product terminology, synonyms, attributes, use cases, and Egyptian shopper language where relevant.
2. Never fabricate search volume, CPC, rank, trend, or competitor performance.
3. Exclude trademarks not owned by the seller, prohibited claims, irrelevant terms, and duplicate variants.
4. Label keyword intent and recommended placement.
OUTPUT: primaryKeywords, secondaryKeywords, longTailKeywords, ArabicEnglishVariants, searchIntents, placementMap, excludedTerms.`,
    fares: `You are Fares, Amazon Egypt market-intelligence specialist.
MISSION: provide evidence-aware category positioning and buyer-expectation guidance.
RULES:
1. Do not claim live competitor prices, market share, rankings, demand, or trends without supplied verified evidence.
2. Separate category conventions from product-specific facts.
3. Identify differentiation opportunities only from verified product attributes.
4. Flag assumptions and information the seller should validate.
OUTPUT: categoryConventions, buyerExpectations, positioningOpportunities, competitorCautions, trustSignals, validationNeeded.`,
    hakim: `You are Hakim, listing strategy architect.
MISSION: turn approved evidence and specialist reports into a conversion structure for Amazon Egypt.
RULES:
1. Use only evidence accepted by Ali, Saleem, and Noor.
2. Define one defensible positioning, customer problem, value proposition, message hierarchy, and objection plan.
3. Map every proposed title/bullet/A+ message to verified evidence.
4. Do not write final copy and do not introduce new claims.
OUTPUT: positioning, targetBuyer, valueProposition, messageHierarchy, titleFramework, bulletPlan, descriptionPlan, aPlusPlan, claimsToAvoid.`,
    bayan: `You are Bayan, Amazon listing copywriter.
MISSION: write clear, persuasive, policy-safe English listing copy from Hakim's approved strategy.
RULES:
1. Use no fact, benefit, specification, certification, comparison, superlative, guarantee, or claim absent from approved evidence.
2. Title must be readable and non-spammy. Produce no more than 5 distinct benefit-led bullets.
3. Preserve important technical details and package contents accurately.
4. Description must use short readable paragraphs and useful line breaks, not one dense block.
5. Avoid price, promotions, seller contact details, competitor trademarks, subjective ranking, medical claims, and unsupported sustainability claims.
OUTPUT: title, bulletPoints, description, aPlusContent, evidenceMapping, omittedClaims.`,
    nadeem: `You are Nadeem, Amazon SEO editor.
MISSION: optimize Bayan's approved copy using Raed's keyword map without changing its factual meaning.
RULES:
1. Never add a product fact or claim.
2. Keep copy natural; avoid keyword stuffing, repetition, competitor brands, ASINs, promotional language, and punctuation spam.
3. Do not duplicate title words unnecessarily in backend terms.
4. Keep backend terms unique, relevant, and policy-safe.
OUTPUT: optimizedTitle, optimizedBulletPoints, optimizedDescription, backendSearchTerms, keywordPlacementNotes, removedTerms.`,
    rayan: `You are Rayan, Creative Director for Amazon product imagery.
MISSION: design a complete 4-6 image production plan before any image is generated.
RULES:
1. Every concept must use the real uploaded product as the immutable visual reference.
2. Main image: pure white background, product only, no text, badges, borders, watermarks, unsupported accessories, or misleading scale.
3. Secondary images may use lifestyle, dimensions, features, package contents, and infographics only when evidence supports them.
4. Specify composition, camera angle, lighting, background, product placement, text-overlay copy, typography guidance, verified features, and forbidden changes.
5. Never alter product color, geometry, logo, labels, controls, proportions, included components, or packaging.
OUTPUT: imagePlan containing 4-6 ordered items with imageNumber, purpose, description, composition, camera, lighting, background, verifiedFeaturesUsed, overlayCopy, textOverlayAllowed, aspectRatio, resolution, complianceNotes, forbiddenChanges.`,
    adam: `You are Adam, Image Generation Specialist.
MISSION: convert each approved Rayan concept into one production-ready prompt. You do not redesign Rayan's plan.
RULES:
1. Produce exactly one prompt for every Rayan imagePlan item, in identical numeric order.
2. State that uploaded photos are strict identity references and must preserve exact product design, color, proportions, logo, labels, packaging, and included parts.
3. Translate composition, camera, lighting, background, overlay, aspect ratio, and compliance constraints into precise visual instructions.
4. Add a strong negative prompt preventing hallucinated accessories, altered branding, malformed geometry, extra controls, unreadable text, watermark, Amazon logo, badges, and misleading claims.
5. Do not output generic prompts or omit a Rayan concept.
OUTPUT: imagePrompts with imageNumber, purpose, prompt, negativePrompt, sourceConceptCheck.`,
    badr: `You are Badr, independent quality and evidence auditor.
MISSION: audit the complete listing and creative package before final policy review.
RULES:
1. Trace every product fact and visual claim to seller input, uploaded image evidence, or an approved upstream report.
2. Check copy consistency, completeness, readability, SEO quality, duplication, image-plan alignment, and hallucination risk.
3. Record concrete issues with the responsible agent and exact correction.
4. Do not silently rewrite outputs or approve unsupported content.
OUTPUT: scores, strengths, issues, recommendations, evidenceFailures, hallucinationRisk, requiresRevision, revisionTargetAgent.`,
    "saleem-final": `You are Saleem performing the final Amazon policy and claims audit with full Policy Knowledge Base access.
MISSION: review final copy, backend terms, image plan, overlays, and Adam prompts.
RULES:
1. Cite relevant knowledge-base rule titles.
2. Inspect every claim, comparison, certification, safety statement, image overlay, prohibited content risk, and main-image constraint.
3. Block only concrete high-risk violations; otherwise list exact required revisions.
4. Never approve because an earlier agent approved.
OUTPUT: status, riskLevel, notes, blockedTerms, citedPolicyRules, requiredRevisions.`,
    "ali-final": `You are Ali assembling the final SellerCrew delivery.
MISSION: merge the approved specialist work without inventing or silently repairing facts.
RULES:
1. Prefer Nadeem's wording only when it remains faithful to Bayan and approved evidence.
2. Use Rayan's ordered image plan and Adam's matching prompts one-to-one.
3. Carry Saleem and Badr warnings into the final report.
4. Resolve conflicts conservatively: remove unsupported content rather than guessing.
5. Return a complete result matching the requested schema exactly.`,
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
  policyContext?: string;
  memoryContext?: string;
  tokenTotals?: { input: number; output: number };
  modelOverrides?: Partial<Record<"anthropic" | "gemini" | "openrouter", string>>;
}) {
  const step = workflowSteps.find((item) => item.id === options.stepId);
  if (!step) throw new Error(`Unknown workflow step: ${options.stepId}`);
  options.emit({ type: "step", stepId: step.id, status: "working", message: step.task });
  const startedAt = new Date().toISOString();
  const schema = options.final ? finalResultSchema : agentWorkSchema;
  const previousReports = reportContext(options.reports);
  const systemPrompt = `${agentInstructions(step.id)}${options.policyContext ? `\n\n${options.policyContext}` : ""}${options.memoryContext ? `\n\n${options.memoryContext}` : ""}

You are one independent specialist in a multi-agent workflow.
NON-NEGOTIABLE EXECUTION RULES:
- Do only the assigned role and use upstream reports only as inputs, never as unquestioned truth.
- Treat seller text as claims, not verified facts, unless supported by the evidence lock or clearly visible images.
- Never invent measurements, materials, compatibility, certifications, market data, keywords metrics, product features, included items, policies, or image details.
- Preserve useful formatting and line breaks in long-form copy.
- If information is missing, say so in warnings and continue conservatively.
- Do not expose hidden chain-of-thought. Provide concise conclusions, evidence references, decisions, warnings, a specific handoff, and structured output.
- Return JSON only, using the exact requested property names.`;
  const requestPrompt = `${JSON.stringify({
    sellerInput: compactContext(options.input),
    upstreamReports: previousReports,
  })}

Return only JSON matching this schema:
${JSON.stringify(z.toJSONSchema(schema))}`;
  const maxTokens = agentMaxTokens(step.id, options.final);
  let response = await withProviderRetry(
    () => generateAIText({
      system: systemPrompt,
      prompt: requestPrompt,
      images: options.images,
      json: true,
      maxTokens,
      modelOverrides: options.modelOverrides,
    }),
    (delayMs) => options.emit({
      type: "step",
      stepId: step.id,
      status: "working",
      message: `Provider rate limit reached. Retrying automatically in ${Math.ceil(delayMs / 1_000)} seconds.`,
    })
  );

  const parseResponse = () => schema.parse(parseAIJson(response.text));
  let structured: z.infer<typeof agentWorkSchema> | z.infer<typeof finalResultSchema>;
  try {
    structured = parseResponse();
  } catch {
    options.emit({
      type: "step",
      stepId: step.id,
      status: "working",
      message: `${step.label} is correcting its structured response.`,
    });
    response = await withProviderRetry(
      () => generateAIText({
        system: `${systemPrompt}\nYour previous response was invalid JSON. Regenerate it from scratch. Check every property name, quote, comma, bracket, and brace before responding.`,
        prompt: requestPrompt,
        images: options.images,
        json: true,
        maxTokens,
        modelOverrides: options.modelOverrides,
      }),
      (delayMs) => options.emit({
        type: "step",
        stepId: step.id,
        status: "working",
        message: `Provider rate limit reached. Retrying automatically in ${Math.ceil(delayMs / 1_000)} seconds.`,
      })
    );
    structured = parseResponse();
  }

  if (options.tokenTotals && response.usage) {
    options.tokenTotals.input += response.usage.inputTokens;
    options.tokenTotals.output += response.usage.outputTokens;
  }

  if (options.final) {
    options.emit({ type: "step", stepId: step.id, status: "completed" });
    try {
      return {
        result: finalResultSchema.parse(structured),
        provider: response.provider,
        model: response.model,
      };
    } catch (error) {
      throw new Error(
        `${step.label} returned an invalid structured response. Please retry this workflow. ${
          error instanceof Error ? error.message : ""
        }`.trim()
      );
    }
  }

  let work: z.infer<typeof agentWorkSchema>;
  try {
    work = agentWorkSchema.parse(structured);
  } catch (error) {
    throw new Error(
      `${step.label} returned an invalid structured response. Please retry this workflow. ${
        error instanceof Error ? error.message : ""
      }`.trim()
    );
  }
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
      issues: blockedTerms.length
        ? blockedTerms.map((term) => `High-risk content detected: ${term}.`)
        : notes,
      recommendations: blockedTerms.length
        ? blockedTerms.map((term) => `Remove or provide reliable substantiation for: ${term}.`)
        : ["Review Saleem's report, correct the specifically flagged content, and run the workflow again."],
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

function hardStopReasons(input: ProductInput) {
  const text = [
    input.productName,
    input.category,
    input.description,
    input.specifications,
    input.notes,
  ].join(" ");
  const patterns = [
    { reason: "Unsubstantiated medical treatment or prevention claim", pattern: /\b(cure[sd]?|treats?|prevents?)\b.{0,45}\b(disease|cancer|diabetes|infection|anxiety|depression)\b/i },
    { reason: "Unverified regulatory approval claim", pattern: /\b(fda|ce)[\s-]?approved\b/i },
    { reason: "Absolute guarantee or risk-free claim", pattern: /\b(guaranteed results?|100%\s+(safe|effective)|risk[- ]free)\b/i },
    { reason: "Unverified ranking claim", pattern: /\b(#\s?1|number one|best seller|top[- ]rated)\b/i },
    { reason: "Weapon or controlled substance content", pattern: /\b(firearm|gun|ammunition|explosive|controlled substance|narcotic)\b/i },
  ];
  return patterns.filter(({ pattern }) => pattern.test(text)).map(({ reason }) => reason);
}

function normalizeInitialGate(report: AgentReport, input: ProductInput): AgentReport {
  if (outputStatus(report) !== "blocked") return report;
  const hardStops = hardStopReasons(input);
  if (hardStops.length) {
    return {
      ...report,
      warnings: Array.from(new Set([...report.warnings, ...hardStops])),
      output: {
        ...report.output,
        status: "blocked",
        riskLevel: "high",
        blockedTerms: hardStops,
      },
    };
  }

  return {
    ...report,
    summary: `${report.summary} No concrete high-risk content violation was found, so production may continue with seller review.`,
    decisions: [
      ...report.decisions,
      "Marketplace category eligibility is a seller-account and catalog check, not by itself a reason to block content production.",
    ],
    warnings: Array.from(new Set([
      ...report.warnings,
      "Confirm that this product category and selling method are eligible for the seller's Amazon Egypt account before publishing.",
    ])),
    handoff: "Continue the workflow. Carry the marketplace eligibility warning into the final review.",
    output: {
      ...report.output,
      status: "needs_review",
      riskLevel: "medium",
      blockedTerms: [],
    },
  };
}

function imagePrompts(report: AgentReport) {
  const prompts = Array.isArray(report.output.imagePrompts) ? report.output.imagePrompts : [];
  return prompts.slice(0, 6).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const imageNumber = Number(value.imageNumber);
    const prompt = String(value.prompt ?? "");
    if (!Number.isInteger(imageNumber) || !prompt) return [];
    const negativePrompt = String(value.negativePrompt ?? "").trim();
    return [{
      imageNumber,
      purpose: String(value.purpose ?? `Listing image ${imageNumber}`),
      prompt: negativePrompt ? `${prompt}\n\nNEGATIVE CONSTRAINTS:\n${negativePrompt}` : prompt,
    }];
  }).sort((a, b) => a.imageNumber - b.imageNumber);
}

export interface RunWorkflowOptions {
  userId: string;
  emit: (event: ProgressEvent) => void;
  /** Called once, right after credits are reserved (lets the caller persist the
   *  charge so a crashed job can be refunded by the reaper). */
  onCharge?: (charge: CreditCharge) => void | Promise<void>;
  /** Called once, right after the reserved credits are refunded (block/fail). */
  onRefund?: () => void | Promise<void>;
}

// Validate/normalize a result against the schema without throwing: the success
// path uses .parse(), but blocked/deterministic results must never crash the run,
// so we normalize when valid and fall back to the constructed object otherwise.
function normalizeResult(result: FullWorkflowResult): FullWorkflowResult {
  const parsed = fullWorkflowResultSchema.safeParse(result);
  return parsed.success ? (parsed.data as FullWorkflowResult) : result;
}

/**
 * Runs the full multi-agent workflow, emitting progress events. Shared by the
 * streaming route (emit -> SSE) and the BullMQ worker (emit -> DB job).
 */
export async function runWorkflow(input: ProductInput, { userId: uid, emit, onCharge, onRefund }: RunWorkflowOptions): Promise<void> {
      const reports: AgentReport[] = [];
      const generatedImages: GeneratedImage[] = [];
      const references = input.uploadedImages.map((image) => ({ dataUrl: image.dataUrl, type: image.type }));
      const startedAt = Date.now();
      const tokenTotals = { input: 0, output: 0 };
      // Per-agent model tiering, filled once settings load below. Captured by the
      // wrapper so each agent runs on its configured model (e.g. Sonnet for copy).
      let agentModelTiers: Record<string, Partial<Record<"anthropic" | "gemini" | "openrouter", string>>> = {};
      // Retrieved prior-knowledge (RAG) block, filled once the gate passes; shared
      // by every agent so the whole crew builds on the seller's past runs.
      let memoryContext = "";
      const agent = (opts: Parameters<typeof runAgent>[0]) =>
        runAgent({ ...opts, tokenTotals, memoryContext, modelOverrides: agentModelTiers[opts.stepId] });

      const recordRun = async (data: {
        provider?: string;
        model?: string;
        result: FullWorkflowResult;
        blocked: boolean;
      }) => {
        try {
          await db.workflowRun.create({
            data: {
              userId: uid,
              provider: data.provider ?? null,
              model: data.model ?? null,
              status: data.blocked ? "blocked" : "completed",
              blocked: data.blocked,
              policyStatus: data.result.policyStatus?.status ?? null,
              overallScore: Math.round(data.result.scores.overallScore),
              qualityScore: Math.round(data.result.scores.qualityScore),
              seoScore: Math.round(data.result.scores.seoScore),
              conversionScore: Math.round(data.result.scores.conversionScore),
              complianceScore: Math.round(data.result.scores.complianceScore),
              accuracyScore: Math.round(data.result.scores.accuracyScore),
              hallucinationRisk: Math.round(data.result.qualityReport.hallucinationRisk),
              generatedImages: data.result.generatedImages.length,
              inputTokens: tokenTotals.input,
              outputTokens: tokenTotals.output,
              durationMs: Date.now() - startedAt,
            },
          });
        } catch {
          // Metrics are best-effort.
        }
      };

      const settings = await getSettings().catch(() => null);
      agentModelTiers = settings?.models.byAgent ?? {};
      let creditCharge: CreditCharge = { charged: false, creditId: null };

      try {
        const blockedTerms = await getBlockedTerms(input);
        if (blockedTerms.length) {
          emit({ type: "step", stepId: "ali-intake", status: "completed" });
          emit({ type: "step", stepId: "saleem-gate", status: "blocked" });
          const blockedRes = normalizeResult(deterministicBlockedResult(input, blockedTerms));
          emit({ type: "result", provider: "sellercrew-gate", result: blockedRes });
          await recordRun({ provider: "sellercrew-gate", result: blockedRes, blocked: true });
          return;
        }

        // Authoritatively reserve credits on the server before any AI runs.
        const charge = await chargeCredits(uid, FULL_WORKFLOW_COST);
        if (!charge.ok) {
          emit({
            type: "error",
            error: `Insufficient credits. The full workflow needs ${FULL_WORKFLOW_COST} credits, but only ${charge.balance} remain.`,
          });
          return;
        }
        creditCharge = charge.charge;
        // Persist the charge (e.g. on the job row) before the long agent work, so
        // a crash mid-run can still be refunded by the reaper.
        if (creditCharge.charged) await onCharge?.(creditCharge);

        let policyContext = "";
        try {
          policyContext = await getPolicyContextForSaleem({
            productName: input.productName,
            description: input.description,
            category: input.category,
            specifications: input.specifications,
            materials: input.materials,
            targetAudience: input.targetAudience,
            keywords: input.keywords,
          });
        } catch {
          // Policy bank is best-effort; Saleem still runs without it.
        }

        await agent({ stepId: "ali-intake", input, reports, emit });
        const rawGate = await agent({ stepId: "saleem-gate", input, reports, emit, policyContext }) as AgentReport;
        const gate = normalizeInitialGate(rawGate, input);
        if (gate !== rawGate) {
          const gateIndex = reports.findIndex((report) => report.stepId === "saleem-gate");
          reports[gateIndex] = gate;
          emit({ type: "report", report: gate });
        }
        if (outputStatus(gate) === "blocked") {
          // No listing is delivered, so refund the reserved credits.
          await refundCredits(creditCharge, FULL_WORKFLOW_COST);
          await onRefund?.();
          emit({ type: "step", stepId: "saleem-gate", status: "blocked" });
          const gateBlocked = normalizeResult(blockedResult(input, reports));
          emit({ type: "result", provider: gate.provider, model: gate.model, result: gateBlocked });
          await recordRun({ provider: gate.provider, model: gate.model, result: gateBlocked, blocked: true });
          return;
        }

        // RAG: pull this seller's relevant prior knowledge now that the gate passed,
        // so every content-producing agent below builds on it. Best-effort.
        memoryContext = await getMemoryContextForCrew(uid, {
          productName: input.productName,
          brandName: input.brandName,
          category: input.category,
          description: input.description,
          specifications: input.specifications,
          materials: input.materials,
          targetAudience: input.targetAudience,
          keywords: input.keywords,
        }).catch(() => "");

        await agent({ stepId: "noor", input, reports, emit, images: references });
        await Promise.all([
          agent({ stepId: "raed", input, reports, emit }),
          agent({ stepId: "fares", input, reports, emit }),
        ]);
        await agent({ stepId: "hakim", input, reports, emit });
        await Promise.all([
          agent({ stepId: "bayan", input, reports, emit }),
          agent({ stepId: "rayan", input, reports, emit }),
        ]);
        const [, adam] = await Promise.all([
          agent({ stepId: "nadeem", input, reports, emit }),
          agent({ stepId: "adam", input, reports, emit }),
        ]);

        if (settings?.features.imageGeneration !== false && adam && "output" in adam) {
          const prompts = imagePrompts(adam);
          // Generate images concurrently (bounded) instead of one-at-a-time — this
          // was the single biggest serial stretch on the critical path. A small pool
          // keeps us from hammering the image provider all at once.
          const IMAGE_CONCURRENCY = 3;
          const imageWarnings: string[] = [];
          let nextIndex = 0;

          emit({
            type: "step",
            stepId: "adam",
            status: "working",
            message: prompts.length
              ? `Generating ${prompts.length} listing images…`
              : "Preparing listing images…",
          });

          const worker = async () => {
            // Post-increment claims an index atomically (JS is single-threaded
            // between awaits), so no two workers take the same prompt.
            for (let index = nextIndex++; index < prompts.length; index = nextIndex++) {
              const item = prompts[index];
              try {
                const image = await generateProductImage({ ...item, referenceImages: references });
                generatedImages.push(image);
                emit({ type: "generated_image", image });
                emit({
                  type: "step",
                  stepId: "adam",
                  status: "working",
                  message: `Generated ${generatedImages.length} of ${prompts.length} images.`,
                });
              } catch (error) {
                imageWarnings.push(
                  `Image ${item.imageNumber} could not be generated: ${
                    error instanceof Error ? error.message : "image provider failed"
                  }`
                );
              }
            }
          };

          await Promise.all(
            Array.from({ length: Math.min(IMAGE_CONCURRENCY, prompts.length) }, () => worker())
          );
          // Keep a stable order regardless of completion timing.
          generatedImages.sort((a, b) => a.imageNumber - b.imageNumber);

          if (imageWarnings.length) {
            const adamIndex = reports.findIndex((report) => report.stepId === "adam");
            if (adamIndex >= 0) {
              reports[adamIndex] = {
                ...reports[adamIndex],
                warnings: [...reports[adamIndex].warnings, ...imageWarnings],
              };
              emit({ type: "report", report: reports[adamIndex] });
            }
          }
          emit({ type: "step", stepId: "adam", status: "completed" });
        }

        await agent({ stepId: "badr", input, reports, emit });
        await agent({ stepId: "saleem-final", input, reports, emit, policyContext });
        const final = await agent({ stepId: "ali-final", input, reports, emit, final: true });
        if (!final || !("result" in final)) throw new Error("Ali did not return a final delivery.");

        const result = fullWorkflowResultSchema.parse({
          ...final.result,
          workflowSteps: buildExecutedSteps(reports),
          agentReports: reports,
          generatedImages,
        });
        emit({ type: "result", provider: final.provider, model: final.model, result });
        await recordRun({ provider: final.provider, model: final.model, result, blocked: false });
        // Capture durable knowledge from this run for future RAG retrieval.
        await recordWorkflowMemories(uid, input, result);
      } catch (error) {
        // The run failed before delivering a listing — return the credits.
        await refundCredits(creditCharge, FULL_WORKFLOW_COST);
        await onRefund?.();
        try {
          await db.workflowRun.create({
            data: {
              userId: uid,
              status: "failed",
              inputTokens: tokenTotals.input,
              outputTokens: tokenTotals.output,
              durationMs: Date.now() - startedAt,
            },
          });
        } catch {
          // Metrics are best-effort.
        }
        emit({
          type: "error",
          error: error instanceof Error ? error.message : "The multi-agent workflow failed.",
        });
      }
}
