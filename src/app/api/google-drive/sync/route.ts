import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncProductToGoogle } from "@/lib/google-drive";

const imageSchema = z.object({ name: z.string().min(1).max(200), dataUrl: z.string().startsWith("data:image/") });
const syncSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  workspaceName: z.string().min(1),
  productName: z.string().min(1),
  brandName: z.string(),
  marketplace: z.string(),
  category: z.string(),
  status: z.string(),
  title: z.string(),
  bullets: z.array(z.string()),
  description: z.string(),
  keywords: z.array(z.string()),
  complianceScore: z.number(),
  customerImages: z.array(imageSchema).max(10),
  generatedImages: z.array(imageSchema).max(10),
});

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = syncSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product sync payload." }, { status: 400 });
  const access = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: parsed.data.workspaceId,
        userId: session.uid,
      },
    },
  });
  if (!access) return NextResponse.json({ error: "Workspace access required." }, { status: 403 });
  const connection = await db.googleDriveConnection.findUnique({ where: { userId: session.uid } });
  if (!connection) return NextResponse.json({ skipped: true, reason: "not-connected" });
  try {
    return NextResponse.json(await syncProductToGoogle(session.uid, parsed.data));
  } catch (error) {
    console.error("Google Drive sync error:", error);
    return NextResponse.json({ error: "Google Drive sync failed." }, { status: 400 });
  }
}
