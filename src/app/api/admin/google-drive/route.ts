import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-guard";
import {
  clearGoogleDriveOAuthConfig,
  getGoogleDriveOAuthConfig,
  saveGoogleDriveOAuthConfig,
} from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  clientId: z.string().trim().min(20).max(300),
  clientSecret: z.string().trim().max(300).optional(),
});

function publicConfig(config: Awaited<ReturnType<typeof getGoogleDriveOAuthConfig>>) {
  return {
    configured: Boolean(config),
    clientId: config?.clientId ?? "",
    secretConfigured: Boolean(config?.clientSecret),
    source: config?.source ?? null,
    callbackUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/api/google-drive/callback`,
  };
}

export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  return NextResponse.json(publicConfig(await getGoogleDriveOAuthConfig()));
}

export async function PUT(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid Google OAuth Client ID and Client Secret." }, { status: 400 });
  }

  try {
    await saveGoogleDriveOAuthConfig(parsed.data.clientId, parsed.data.clientSecret || undefined);
    return NextResponse.json(publicConfig(await getGoogleDriveOAuthConfig()));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save Google Drive settings." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  await clearGoogleDriveOAuthConfig();
  return NextResponse.json(publicConfig(await getGoogleDriveOAuthConfig()));
}
