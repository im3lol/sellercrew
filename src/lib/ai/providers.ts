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

export interface AITextResult {
  provider: "anthropic" | "gemini" | "openrouter";
  model: string;
  text: string;
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

async function generateWithAnthropic(options: GenerateAITextOptions): Promise<AITextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic is not configured.");

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
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

  return { provider: "anthropic", model, text };
}

async function generateWithGemini(options: GenerateAITextOptions): Promise<AITextResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured.");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

  return { provider: "gemini", model, text };
}

async function generateWithOpenRouter(options: GenerateAITextOptions): Promise<AITextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter is not configured.");

  const model = process.env.OPENROUTER_WORKFLOW_MODEL || "google/gemini-2.5-flash";
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
      max_tokens: options.maxTokens ?? 2_000,
    }),
    signal: AbortSignal.timeout(110_000),
  });

  const payload = await response.json() as {
    model?: string;
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter request failed (${response.status}).`);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty response.");

  options.onTextDelta?.(text, text);
  return { provider: "openrouter", model: payload.model || model, text };
}

export async function generateAIText(options: GenerateAITextOptions): Promise<AITextResult> {
  const errors: string[] = [];

  for (const generate of [generateWithAnthropic, generateWithGemini, generateWithOpenRouter]) {
    try {
      return await generate(options);
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

export function parseAIJson(text: string): unknown {
  const normalized = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(normalized);
  } catch (error) {
    try {
      return JSON.parse(repairTruncatedJson(normalized));
    } catch {
      throw error;
    }
  }
}
