import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import { getSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ provider: z.enum(["anthropic", "gemini", "openrouter", "openai"]) });

// Validate a provider's API key without spending generation tokens, by hitting
// its lightweight list/key endpoint.
async function testProvider(provider: string): Promise<{ ok: boolean; message: string }> {
  const timeout = AbortSignal.timeout(15_000);
  try {
    if (provider === "anthropic") {
      const key = await getSecret("ANTHROPIC_API_KEY");
      if (!key) return { ok: false, message: "Anthropic API key is not set." };
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        signal: timeout,
      });
      return res.ok
        ? { ok: true, message: "Key valid — Anthropic reachable." }
        : { ok: false, message: `Anthropic returned ${res.status}.` };
    }
    if (provider === "gemini") {
      const key = await getSecret("GEMINI_API_KEY");
      if (!key) return { ok: false, message: "Gemini API key is not set." };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, { signal: timeout });
      return res.ok
        ? { ok: true, message: "Key valid — Gemini reachable." }
        : { ok: false, message: `Gemini returned ${res.status} (quota or key issue).` };
    }
    if (provider === "openrouter") {
      const key = await getSecret("OPENROUTER_API_KEY");
      if (!key) return { ok: false, message: "OpenRouter API key is not set." };
      const res = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${key}` },
        signal: timeout,
      });
      if (!res.ok) return { ok: false, message: `OpenRouter returned ${res.status}.` };
      const data = (await res.json().catch(() => null)) as { data?: { limit_remaining?: number | null; usage?: number } } | null;
      const remaining = data?.data?.limit_remaining;
      return {
        ok: true,
        message: remaining == null ? "Key valid — OpenRouter reachable." : `Key valid — ${remaining} credits remaining.`,
      };
    }
    if (provider === "openai") {
      const key = await getSecret("OPENAI_API_KEY");
      if (!key) return { ok: false, message: "OpenAI API key is not set." };
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: timeout,
      });
      return res.ok
        ? { ok: true, message: "Key valid — OpenAI reachable." }
        : { ok: false, message: `OpenAI returned ${res.status}.` };
    }
    return { ok: false, message: "Unknown provider." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Connection failed." };
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const limited = await rateLimit(`test-provider:${access.session.email}`, 20, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: `Slow down. Try again in ${limited.retryAfterSeconds}s.` }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid provider." }, { status: 400 });

  const result = await testProvider(parsed.data.provider);
  return NextResponse.json(result);
}
