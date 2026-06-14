import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkflowQueue, isQueueEnabled } from "@/lib/queue";

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
  let queue = false;
  try {
    queueConfigured = await isQueueEnabled();
    if (queueConfigured) {
      // Resolves once the underlying Redis connection is ready; throws otherwise.
      await (await getWorkflowQueue()).waitUntilReady();
      queue = true;
    }
  } catch {
    queueConfigured = false;
    queue = false;
  }

  const healthy = database && (!queueConfigured || queue);
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      queueConfigured,
      queue,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
