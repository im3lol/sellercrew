import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { googleDriveConfigured } from "@/lib/google-drive";

const settingsSchema = z.object({
  workspaceId: z.string().min(1),
  sheetMode: z.enum(["workspace", "global"]),
  imageFolderMode: z.enum(["workspace", "global"]),
  selectedSpreadsheetId: z.string().nullable().optional(),
  selectedSpreadsheetName: z.string().nullable().optional(),
  selectedFolderId: z.string().nullable().optional(),
  selectedFolderName: z.string().nullable().optional(),
  autoSync: z.boolean(),
});

async function membership(userId: string, organizationId: string) {
  return db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId || !(await membership(session.uid, workspaceId))) {
    return NextResponse.json({ error: "Workspace access required." }, { status: 403 });
  }
  const [connection, settings] = await Promise.all([
    db.googleDriveConnection.findUnique({
      where: { userId: session.uid },
      select: { googleEmail: true, connectedAt: true, scope: true },
    }),
    db.googleDriveSettings.findUnique({ where: { organizationId: workspaceId } }),
  ]);
  return NextResponse.json({
    configured: await googleDriveConfigured(),
    connected: Boolean(connection),
    connection,
    settings: settings ?? {
      sheetMode: "workspace",
      imageFolderMode: "workspace",
      selectedSpreadsheetId: null,
      selectedSpreadsheetName: null,
      selectedFolderId: null,
      selectedFolderName: null,
      autoSync: true,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Google Drive settings." }, { status: 400 });
  }
  const member = await membership(session.uid, parsed.data.workspaceId);
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json(
      { error: "Only the workspace owner or an admin can change shared Drive settings." },
      { status: 403 }
    );
  }
  const { workspaceId, ...data } = parsed.data;
  const current = await db.googleDriveSettings.findUnique({
    where: { organizationId: workspaceId },
    select: { selectedFolderId: true },
  });
  const folderChanged = current?.selectedFolderId !== data.selectedFolderId;
  const settings = await db.googleDriveSettings.upsert({
    where: { organizationId: workspaceId },
    create: { organizationId: workspaceId, ...data },
    update: {
      ...data,
      ...(folderChanged ? { workspaceFolderId: null } : {}),
    },
  });
  return NextResponse.json({ settings });
}

export async function DELETE(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await db.googleDriveConnection.deleteMany({ where: { userId: session.uid } });
  return NextResponse.json({ connected: false });
}
