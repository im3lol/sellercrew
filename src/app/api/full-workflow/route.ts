import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";

export const runtime = "nodejs";

// Deprecated endpoint. The full workflow now runs exclusively through the
// streaming route at /api/full-workflow/stream. This handler is kept only so
// the path does not 404; it performs no AI work and stays behind auth.
export async function POST(request: NextRequest) {
  const access = await guard(request, { scope: "full-workflow-legacy", limit: 5, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  return NextResponse.json(
    { error: "This endpoint has moved. Use POST /api/full-workflow/stream instead." },
    { status: 410 }
  );
}
