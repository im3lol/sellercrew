import { db } from "@/lib/db";
import { encryptGoogleToken, decryptGoogleToken } from "@/lib/google-drive";

// Groups for the admin "API Keys & Secrets" UI (rendered as collapsible sections).
export const SECRET_GROUPS = {
  "ai-openrouter": {
    title: "AI — OpenRouter (gateway)",
    description: "Single key that routes AI generation through OpenRouter. Applies immediately.",
  },
  "ai-direct": {
    title: "AI — Direct providers",
    description: "Optional keys to call providers directly instead of via OpenRouter. Apply immediately.",
  },
  auth: {
    title: "Authentication — Clerk (Google sign-in)",
    description:
      "Clerk keys for Google sign-in. NOTE: these take effect only after a redeploy/rebuild — the publishable key is baked into the browser bundle at build time, and Clerk reads its keys from the environment at startup.",
  },
  infra: {
    title: "Infrastructure",
    description: "Background job queue and multi-instance rate-limit store. Applies on restart.",
  },
} as const;

export type SecretGroup = keyof typeof SECRET_GROUPS;

interface ManagedSecret {
  label: string;
  group: SecretGroup;
}

// Secrets an admin can manage from the dashboard. Stored encrypted in
// SystemSetting (key "secret:<NAME>") and, when set, override the .env value.
export const MANAGED_SECRETS = {
  OPENROUTER_API_KEY: { label: "OpenRouter API key", group: "ai-openrouter" },
  ANTHROPIC_API_KEY: { label: "Anthropic API key", group: "ai-direct" },
  GEMINI_API_KEY: { label: "Google Gemini API key", group: "ai-direct" },
  OPENAI_API_KEY: { label: "OpenAI API key", group: "ai-direct" },
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: { label: "Clerk publishable key", group: "auth" },
  CLERK_SECRET_KEY: { label: "Clerk secret key", group: "auth" },
  REDIS_URL: { label: "Redis connection URL", group: "infra" },
} as const satisfies Record<string, ManagedSecret>;

export type SecretName = keyof typeof MANAGED_SECRETS;

const KEY_PREFIX = "secret:";
const TTL_MS = 30_000;
const cache = new Map<SecretName, { value: string | null; ts: number }>();

// Tolerate users pasting a whole `.env` line (e.g. `REDIS_URL="rediss://..."`)
// by stripping a leading `NAME=` prefix and surrounding quotes.
export function cleanSecretValue(raw: string): string {
  let value = raw.trim();
  const prefixed = value.match(/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*([\s\S]*)$/);
  if (prefixed) value = prefixed[1].trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  return value.trim();
}

export async function getSecret(name: SecretName): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(name);
  if (cached && now - cached.ts < TTL_MS) return cached.value;

  let value: string | null = null;
  try {
    const row = await db.systemSetting.findUnique({ where: { key: KEY_PREFIX + name } });
    if (row?.value) value = decryptGoogleToken(row.value);
  } catch {
    value = null;
  }
  if (!value) value = process.env[name]?.trim() || null;
  if (value) value = cleanSecretValue(value);

  cache.set(name, { value, ts: now });
  return value;
}

export async function setSecret(name: SecretName, value: string): Promise<void> {
  const clean = cleanSecretValue(value);
  await db.systemSetting.upsert({
    where: { key: KEY_PREFIX + name },
    create: { key: KEY_PREFIX + name, value: encryptGoogleToken(clean) },
    update: { value: encryptGoogleToken(clean) },
  });
  cache.delete(name);
}

export async function clearSecret(name: SecretName): Promise<void> {
  await db.systemSetting.deleteMany({ where: { key: KEY_PREFIX + name } });
  cache.delete(name);
}

export interface SecretStatus {
  name: SecretName;
  label: string;
  group: SecretGroup;
  groupTitle: string;
  groupDescription: string;
  configured: boolean;
  source: "admin" | "environment" | null;
}

export async function secretStatus(): Promise<SecretStatus[]> {
  let stored = new Set<string>();
  try {
    const rows = await db.systemSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
      select: { key: true },
    });
    stored = new Set(rows.map((r) => r.key.slice(KEY_PREFIX.length)));
  } catch {
    stored = new Set();
  }
  return (Object.keys(MANAGED_SECRETS) as SecretName[]).map((name) => {
    const def = MANAGED_SECRETS[name];
    const group = SECRET_GROUPS[def.group];
    return {
      name,
      label: def.label,
      group: def.group,
      groupTitle: group.title,
      groupDescription: group.description,
      configured: stored.has(name) || Boolean(process.env[name]),
      source: stored.has(name) ? "admin" : process.env[name] ? "environment" : null,
    };
  });
}

export async function isConfigured(name: SecretName): Promise<boolean> {
  return Boolean(await getSecret(name));
}
