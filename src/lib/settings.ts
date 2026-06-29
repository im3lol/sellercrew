import { db } from "@/lib/db";

// Free OpenRouter models (no per-token cost). gpt-oss-120b leads for strong
// reasoning/JSON; gemma-4-31b is multimodal so image-analysis steps (Noor) fall
// back to it cleanly. Admins can override in Settings & API. Free models are
// rate-limited by OpenRouter and vary in quality — use a paid model for production.
export const DEFAULT_OPENROUTER_TEXT_MODELS = [
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
] as const;

export const DEFAULT_OPENROUTER_IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview",
  "bytedance-seed/seedream-4.5",
  "openai/gpt-5.4-image-2",
] as const;

// Per-agent model tiering. Light agents (intake, gates, keywords, SEO, review)
// run on the provider's cheap/fast default model; the agents whose quality moves
// the needle most — strategy, the copywriter, and the final assembler — are bumped
// to a stronger model. Keyed by stepId -> provider -> model id. Only the entry for
// the provider that actually runs is used; an unset provider falls back to that
// provider's default model. Defaults target Anthropic (the recommended provider);
// admins can extend per provider in Settings & API.
export const DEFAULT_AGENT_MODEL_TIERS: Record<
  string,
  Partial<Record<"anthropic" | "gemini" | "openrouter", string>>
> = {
  hakim: { anthropic: "claude-sonnet-4-6" },
  bayan: { anthropic: "claude-sonnet-4-6" },
  "ali-final": { anthropic: "claude-sonnet-4-6" },
};

export interface AppSettings {
  models: {
    anthropic: string;
    gemini: string;
    openrouter: string;
    openai: string;
    geminiImage: string;
    openrouterTextFallbacks: string[];
    openrouterImageFallbacks: string[];
    byAgent: Record<string, Partial<Record<"anthropic" | "gemini" | "openrouter", string>>>;
  };
  providerOrder: Array<"anthropic" | "gemini" | "openrouter">;
  features: {
    openRouterFallback: boolean;
    imageGeneration: boolean;
  };
  compliance: {
    extraBlockedTerms: string[];
  };
}

export type SettingsPatch = {
  models?: Partial<AppSettings["models"]>;
  providerOrder?: AppSettings["providerOrder"];
  features?: Partial<AppSettings["features"]>;
  compliance?: Partial<AppSettings["compliance"]>;
};

const SETTINGS_KEY = "app";
const CACHE_TTL_MS = 30_000;

function defaults(): AppSettings {
  return {
    models: {
      // Haiku 4.5 is the fast/cheap workhorse for most agents (strong JSON +
      // vision for Noor); critical agents are bumped to Sonnet via byAgent below.
      anthropic: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      openrouter: process.env.OPENROUTER_WORKFLOW_MODEL || DEFAULT_OPENROUTER_TEXT_MODELS[0],
      openai: process.env.OPENAI_WORKFLOW_MODEL || "gpt-5.4-mini",
      geminiImage: process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_OPENROUTER_IMAGE_MODELS[0],
      openrouterTextFallbacks: DEFAULT_OPENROUTER_TEXT_MODELS.slice(1),
      openrouterImageFallbacks: DEFAULT_OPENROUTER_IMAGE_MODELS.slice(1),
      byAgent: DEFAULT_AGENT_MODEL_TIERS,
    },
    // Anthropic first: reliable paid models (Haiku/Sonnet) lead, with the free
    // OpenRouter chain and Gemini as fallbacks if Anthropic is unavailable.
    providerOrder: ["anthropic", "openrouter", "gemini"],
    features: {
      openRouterFallback: true,
      imageGeneration: true,
    },
    compliance: {
      extraBlockedTerms: [],
    },
  };
}

export function mergeSettings(base: AppSettings, stored: SettingsPatch | null): AppSettings {
  if (!stored) return base;
  return {
    models: { ...base.models, ...(stored.models ?? {}) },
    providerOrder:
      Array.isArray(stored.providerOrder) && stored.providerOrder.length
        ? stored.providerOrder
        : base.providerOrder,
    features: { ...base.features, ...(stored.features ?? {}) },
    compliance: { ...base.compliance, ...(stored.compliance ?? {}) },
  };
}

let cache: { data: AppSettings; ts: number } | null = null;

export function invalidateSettingsCache() {
  cache = null;
}

export async function getSettings(): Promise<AppSettings> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) return cache.data;

  let stored: SettingsPatch | null = null;
  try {
    const row = await db.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (row) stored = JSON.parse(row.value) as SettingsPatch;
  } catch {
    stored = null;
  }

  const data = mergeSettings(defaults(), stored);
  cache = { data, ts: now };
  return data;
}

export async function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  const current = await getSettings();
  const next = mergeSettings(current, patch);
  await db.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { data: next, ts: Date.now() };
  return next;
}
