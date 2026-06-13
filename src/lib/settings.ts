import { db } from "@/lib/db";

export interface AppSettings {
  models: {
    anthropic: string;
    gemini: string;
    openrouter: string;
    openai: string;
    geminiImage: string;
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
      openrouter: process.env.OPENROUTER_WORKFLOW_MODEL || "google/gemini-2.5-flash",
      openai: process.env.OPENAI_WORKFLOW_MODEL || "gpt-5.4-mini",
      geminiImage: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
    },
    providerOrder: ["anthropic", "gemini", "openrouter"],
    features: {
      openRouterFallback: true,
      imageGeneration: true,
    },
    compliance: {
      extraBlockedTerms: [],
    },
  };
}

function merge(base: AppSettings, stored: SettingsPatch | null): AppSettings {
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

  const data = merge(defaults(), stored);
  cache = { data, ts: now };
  return data;
}

export async function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  const current = await getSettings();
  const next = merge(current, patch);
  await db.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  cache = { data: next, ts: Date.now() };
  return next;
}
