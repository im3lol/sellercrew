import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-guard";
import { getSettings, updateSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  models: z
    .object({
      anthropic: z.string().trim().max(160).optional(),
      gemini: z.string().trim().max(160).optional(),
      openrouter: z.string().trim().max(160).optional(),
      openai: z.string().trim().max(160).optional(),
      geminiImage: z.string().trim().max(160).optional(),
    })
    .optional(),
  providerOrder: z.array(z.enum(["anthropic", "gemini", "openrouter"])).min(1).max(3).optional(),
  features: z
    .object({
      openRouterFallback: z.boolean().optional(),
      imageGeneration: z.boolean().optional(),
    })
    .optional(),
  compliance: z
    .object({
      extraBlockedTerms: z.array(z.string().trim().min(1).max(80)).max(200).optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  const settings = await updateSettings(parsed.data);
  return NextResponse.json({ success: true, settings });
}
