import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listSpreadsheets } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const spreadsheets = await listSpreadsheets(session.uid);
    return NextResponse.json({ spreadsheets });
  } catch (error) {
    console.error("Google Sheets list error:", error);
    return NextResponse.json({ error: "Could not read Google Sheets." }, { status: 400 });
  }
}
