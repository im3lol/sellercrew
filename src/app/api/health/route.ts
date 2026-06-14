import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isQueueEnabled } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public health probe for deploy platforms / uptime monitors / Docker healthcheck.
// Exposes only booleans — no sensitive data.
export async function GET() {
  let database = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = false;
  }

  let queueConfigured = false;
  try {
    queueConfigured = await isQueueEnabled();
  } catch {
    queueConfigured = false;
  }

  const healthy = database;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      queueConfigured,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
