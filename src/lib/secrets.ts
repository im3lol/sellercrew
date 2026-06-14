import { db } from "@/lib/db";
import { encryptGoogleToken, decryptGoogleToken } from "@/lib/google-drive";

// Secrets that an admin can manage from the dashboard. Stored encrypted in
// SystemSetting (key "secret:<NAME>") and, when set, override the .env value.
export const MANAGED_SECRETS = {
  ANTHROPIC_API_KEY: "Anthropic API key",
  GEMINI_API_KEY: "Google Gemini API key",
  OPENROUTER_API_KEY: "OpenRouter API key",
  OPENAI_API_KEY: "OpenAI API key",
  REDIS_URL: "Redis connection URL",
} as const;

export type SecretName = keyof typeof MANAGED_SECRETS;

const KEY_PREFIX = "secret:";
const TTL_MS = 30_000;
const cache = new Map<SecretName, { value: string | null; ts: number }>();

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

  cache.set(name, { value, ts: now });
  return value;
}

export async function setSecret(name: SecretName, value: string): Promise<void> {
  await db.systemSetting.upsert({
    where: { key: KEY_PREFIX + name },
    create: { key: KEY_PREFIX + name, value: encryptGoogleToken(value) },
    update: { value: encryptGoogleToken(value) },
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
  return (Object.keys(MANAGED_SECRETS) as SecretName[]).map((name) => ({
    name,
    label: MANAGED_SECRETS[name],
    configured: stored.has(name) || Boolean(process.env[name]),
    source: stored.has(name) ? "admin" : process.env[name] ? "environment" : null,
  }));
}

export async function isConfigured(name: SecretName): Promise<boolean> {
  return Boolean(await getSecret(name));
}
