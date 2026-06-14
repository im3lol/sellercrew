import {
  DEFAULT_OPENROUTER_IMAGE_MODELS,
  DEFAULT_OPENROUTER_TEXT_MODELS,
  getSettings,
} from "@/lib/settings";
import { getSecret } from "@/lib/secrets";

export interface AIImageInput {
  dataUrl: string;
  type: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface GenerateAITextOptions {
  system: string;
  prompt: string;
  history?: AIMessage[];
  images?: AIImageInput[];
  json?: boolean;
  maxTokens?: number;
  onTextDelta?: (delta: string, fullText: string) => void;
}

export interface AITokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AITextResult {
  provider: "anthropic" | "gemini" | "openrouter";
  model: string;
  text: string;
  usage?: AITokenUsage;
}

function dataUrlToBase64(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid image data URL.");
  return dataUrl.slice(commaIndex + 1);
}

async function readSSE(
  response: Response,
  onData: (payload: unknown) => void
) {
  if (!response.body) throw new Error("The AI provider returned no response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        onData(JSON.parse(data));
      }
    }

    if (done) break;
  }
}

async function generateWithAnthropic(options: GenerateAITextOptions, modelOverride?: string): Promise<AITextResult> {
  const apiKey = await getSecret("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Anthropic is not configured.");

  const model = modelOverride || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const messages = [
    ...(options.history ?? []).map((message) => ({
      role: message.role,
      content: [{ type: "text", text: message.content }],
    })),
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: options.prompt },
        ...(options.images ?? []).map((image) => ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: image.type,
            data: dataUrlToBase64(image.dataUrl),
          },
        })),
      ],
    },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      system: options.json
        ? `${options.system}\nReturn only valid JSON with no markdown fences.`
        : options.system,
      messages,
      max_tokens: options.maxTokens ?? 2_000,
      stream: Boolean(options.onTextDelta),
    }),
    signal: AbortSignal.timeout(110_000),
  });

  if (options.onTextDelta) {
    if (!response.ok) {
      const payload = await response.json() as { error?: { message?: string } };
      throw new Error(payload.error?.message || `Anthropic request failed (${response.status}).`);
    }
    let text = "";
    await readSSE(response, (event) => {
      const payload = event as {
        type?: string;
        delta?: { type?: string; text?: string };
        error?: { message?: string };
      };
      if (payload.type === "error") throw new Error(payload.error?.message || "Anthropic streaming failed.");
      const delta = payload.delta?.type === "text_delta" ? payload.delta.text ?? "" : "";
      if (!delta) return;
      text += delta;
      options.onTextDelta?.(delta, text);
    });
    if (!text.trim()) throw new Error("Anthropic returned an empty response.");
    return { provider: "anthropic", model, text: text.trim() };
  }

  const payload = await response.json() as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Anthropic request failed (${response.status}).`);
  }

  const text = payload.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Anthropic returned an empty response.");

  return {
    provider: "anthropic",
    model,
    text,
    usage: { inputTokens: payload.usage?.input_tokens ?? 0, outputTokens: payload.usage?.output_tokens ?? 0 },
  };
}

async function generateWithGemini(options: GenerateAITextOptions, modelOverride?: string): Promise<AITextResult> {
  const apiKey = await getSecret("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Gemini is not configured.");

  const model = modelOverride || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const contents = [
    ...(options.history ?? []).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    {
      role: "user",
      parts: [
        { text: options.prompt },
        ...(options.images ?? []).map((image) => ({
          inline_data: {
            mime_type: image.type,
            data: dataUrlToBase64(image.dataUrl),
          },
        })),
      ],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${
      options.onTextDelta ? "streamGenerateContent?alt=sse" : "generateContent"
    }`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: options.system }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 2_000,
          thinkingConfig: {
            thinkingBudget: 0,
          },
          ...(options.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: AbortSignal.timeout(110_000),
    }
  );

  if (options.onTextDelta) {
    if (!response.ok) {
      const payload = await response.json() as { error?: { message?: string } };
      throw new Error(payload.error?.message || `Gemini request failed (${response.status}).`);
    }
    let text = "";
    await readSSE(response, (event) => {
      const payload = event as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const delta = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";
      if (!delta) return;
      text += delta;
      options.onTextDelta?.(delta, text);
    });
    if (!text.trim()) throw new Error("Gemini returned an empty response.");
    return { provider: "gemini", model, text: text.trim() };
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini request failed (${response.status}).`);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned an empty response.");

  return {
    provider: "gemini",
    model,
    text,
    usage: {
      inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

async function generateWithOpenRouter(options: GenerateAITextOptions, modelOverride?: string): Promise<AITextResult> {
  const apiKey = await getSecret("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OpenRouter is not configured.");

  const model = modelOverride || process.env.OPENROUTER_WORKFLOW_MODEL || "qwen/qwen3.7-plus";
  const messages = [
    {
      role: "system",
      content: options.json
        ? `${options.system}\nReturn only valid JSON with no markdown fences.`
        : options.system,
    },
    ...(options.history ?? []).map((message) => ({ role: message.role, content: message.content })),
    {
      role: "user",
      content: [
        { type: "text", text: options.prompt },
        ...(options.images ?? []).map((image) => ({
          type: "image_url",
          image_url: { url: image.dataUrl },
        })),
      ],
    },
  ];

  type OpenRouterPayload = {
    model?: string;
    choices?: Array<{ message?: { content?: string | null; images?: Array<{ image_url?: { url?: string } }> } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };
  const request = async (maxTokens: number) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SellerCrew",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
        reasoning: { effort: "none" },
      }),
      signal: AbortSignal.timeout(110_000),
    });
    return {
      response,
      payload: await response.json() as OpenRouterPayload,
    };
  };

  let maxTokens = Math.min(options.maxTokens ?? 2_000, 2_000);
  let { response, payload } = await request(maxTokens);
  if (!response.ok) {
    const message = payload.error?.message || "";
    const affordable = message.match(/can only afford\s+(\d+)/i);
    if (affordable) {
      maxTokens = Math.max(256, Math.min(maxTokens - 1, Number(affordable[1]) - 64));
      ({ response, payload } = await request(maxTokens));
    }
  }
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter request failed (${response.status}).`);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty response.");

  options.onTextDelta?.(text, text);
  return {
    provider: "openrouter",
    model: payload.model || model,
    text,
    usage: { inputTokens: payload.usage?.prompt_tokens ?? 0, outputTokens: payload.usage?.completion_tokens ?? 0 },
  };
}

function uniqueModels(models: Array<string | undefined>): string[] {
  return [...new Set(models.map((model) => model?.trim()).filter((model): model is string => Boolean(model)))];
}

async function generateWithOpenRouterTextModels(
  options: GenerateAITextOptions,
  models: Array<string | undefined>
): Promise<AITextResult> {
  const imageOnlyModels = new Set<string>(DEFAULT_OPENROUTER_IMAGE_MODELS);
  const chain = uniqueModels(models).filter((model) => !imageOnlyModels.has(model));
  const errors: string[] = [];

  for (const model of chain) {
    try {
      return await generateWithOpenRouter(options, model);
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  throw new Error(errors.length
    ? `OpenRouter text models failed. ${errors.join(" ")}`
    : "No OpenRouter text model is configured.");
}

/**
 * Resolve the ordered list of providers to try for a text request, given the
 * admin-configured order, whether OpenRouter fallback is enabled, and which
 * providers have a runner available. Pure + exported so it can be unit-tested.
 */
export function resolveProviderChain(
  order: string[],
  fallback: boolean,
  available: string[] = ["anthropic", "gemini", "openrouter"]
): string[] {
  let chain = order.filter((key) => available.includes(key));
  if (fallback && available.includes("openrouter") && !chain.includes("openrouter")) chain.push("openrouter");
  if (!fallback) chain = chain.filter((key) => key !== "openrouter");
  chain = [...new Set(chain)];
  if (!chain.length) chain = available.filter((k) => k !== "openrouter");
  return chain;
}

export async function generateAIText(options: GenerateAITextOptions): Promise<AITextResult> {
  const settings = await getSettings().catch(() => null);
  const models = settings?.models;
  const order = settings?.providerOrder ?? ["anthropic", "gemini", "openrouter"];
  const fallback = settings?.features.openRouterFallback ?? true;

  const runners: Record<string, () => Promise<AITextResult>> = {
    anthropic: () => generateWithAnthropic(options, models?.anthropic),
    gemini: () => generateWithGemini(options, models?.gemini),
    openrouter: () => generateWithOpenRouterTextModels(options, [
      models?.openrouter,
      ...(models?.openrouterTextFallbacks ?? DEFAULT_OPENROUTER_TEXT_MODELS.slice(1)),
    ]),
  };

  const chain = resolveProviderChain(order, fallback, Object.keys(runners));

  const errors: string[] = [];
  for (const key of chain) {
    try {
      return await runners[key]();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "AI provider failed.");
    }
  }

  throw new Error(`No configured AI provider completed the request. ${errors.join(" ")}`);
}

/**
 * Best-effort repair for JSON that was cut off mid-stream (the common cause of
 * "Unterminated string in JSON" when a model hits its max-token limit).
 * Closes any open string and balances open brackets/braces.
 */
function repairTruncatedJson(input: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if (char === "}" || char === "]") stack.pop();
  }

  let repaired = input;
  if (escaped) repaired += "n"; // complete a dangling escape sequence
  if (inString) repaired += '"';
  // Drop a trailing comma that would otherwise sit before a closing bracket.
  repaired = repaired.replace(/,\s*$/, "");
  while (stack.length) repaired += stack.pop();
  return repaired;
}

function extractJsonCandidate(input: string): string {
  const objectStart = input.indexOf("{");
  const arrayStart = input.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (!starts.length) return input;
  return input.slice(Math.min(...starts));
}

function removeTrailingCommas(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ",") {
      let next = index + 1;
      while (next < input.length && /\s/.test(input[next])) next += 1;
      if (input[next] === "}" || input[next] === "]") continue;
    }
    output += char;
  }

  return output;
}

export function parseAIJson(text: string): unknown {
  const normalized = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const candidates = [
    normalized,
    extractJsonCandidate(normalized),
    removeTrailingCommas(extractJsonCandidate(normalized)),
    removeTrailingCommas(repairTruncatedJson(extractJsonCandidate(normalized))),
  ];
  let firstError: unknown;

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      firstError ??= error;
    }
  }

  throw firstError;
}
