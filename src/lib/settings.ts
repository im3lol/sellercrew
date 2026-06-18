import { db } from "@/lib/db";

// Free OpenRouter models (no per-token cost). The primary accepts image input so
// Noor's product-image analysis still works. Admins can override these in
// Settings & API. Free models are rate-limited by OpenRouter (see notes) and vary
// in quality/JSON adherence — use a paid model for production-grade output.
export const DEFAULT_OPENROUTER_TEXT_MODELS = [
  "nex-agi/nex-n2-pro:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "poolside/laguna-m.1:free",
  "openrouter/owl-alpha",
] as const;

export const DEFAULT_OPENROUTER_IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview",
  "bytedance-seed/seedream-4.5",
  "openai/gpt-5.4-image-2",
] as const;

export interface AppSettings {
  models: {
    anthropic: string;
    gemini: string;
    openrouter: string;
    openai: string;
    geminiImage: string;
    openrouterTextFallbacks: string[];
    openrouterImageFallbacks: string[];
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
      anthropic: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      openrouter: process.env.OPENROUTER_WORKFLOW_MODEL || DEFAULT_OPENROUTER_TEXT_MODELS[0],
      openai: process.env.OPENAI_WORKFLOW_MODEL || "gpt-5.4-mini",
      geminiImage: process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_OPENROUTER_IMAGE_MODELS[0],
      openrouterTextFallbacks: DEFAULT_OPENROUTER_TEXT_MODELS.slice(1),
      openrouterImageFallbacks: DEFAULT_OPENROUTER_IMAGE_MODELS.slice(1),
    },
    providerOrder: ["openrouter", "anthropic", "gemini"],
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
