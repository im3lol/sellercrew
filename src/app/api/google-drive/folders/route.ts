import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listDriveFolders } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const folders = await listDriveFolders(session.uid);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Google Drive folders error:", error);
    return NextResponse.json({ error: "Could not read Google Drive folders." }, { status: 400 });
  }
}
