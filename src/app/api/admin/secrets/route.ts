import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-guard";
import { MANAGED_SECRETS, clearSecret, secretStatus, setSecret, type SecretName } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const names = Object.keys(MANAGED_SECRETS) as [SecretName, ...SecretName[]];

const putSchema = z.object({
  name: z.enum(names),
  value: z.string().trim().min(1).max(1000),
});

export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  return NextResponse.json({ secrets: await secretStatus() });
}

export async function PUT(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid secret name and value." }, { status: 400 });
  await setSecret(parsed.data.name, parsed.data.value);
  return NextResponse.json({ secrets: await secretStatus() });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;
  const name = request.nextUrl.searchParams.get("name");
  if (!name || !(name in MANAGED_SECRETS)) {
    return NextResponse.json({ error: "Unknown secret." }, { status: 400 });
  }
  await clearSecret(name as SecretName);
  return NextResponse.json({ secrets: await secretStatus() });
}
