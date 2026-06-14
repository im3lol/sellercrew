import { NextResponse } from "next/server";

export const revalidate = 3600;

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  supported_parameters?: string[];
}

const fallbackModels = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", contextLength: 1_048_576, promptPerMillion: 0.3, completionPerMillion: 2.5 },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", contextLength: 1_048_576, promptPerMillion: 0.1, completionPerMillion: 0.4 },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", contextLength: 1_000_000, promptPerMillion: 3, completionPerMillion: 15 },
  { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", contextLength: 163_840, promptPerMillion: 0.252, completionPerMillion: 0.378 },
];

export async function GET() {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/models?supported_parameters=structured_outputs&sort=most-popular",
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error("OpenRouter model catalog is unavailable.");
    const payload = (await response.json()) as { data?: OpenRouterModel[] };
    const models = (payload.data ?? []).slice(0, 60).map((model) => ({
      id: model.id,
      name: model.name,
      contextLength: model.context_length,
      promptPerMillion: Number(model.pricing.prompt) * 1_000_000,
      completionPerMillion: Number(model.pricing.completion) * 1_000_000,
    }));
    return NextResponse.json({ provider: "openrouter", models: models.length ? models : fallbackModels });
  } catch {
    return NextResponse.json({ provider: "fallback", models: fallbackModels });
  }
}
