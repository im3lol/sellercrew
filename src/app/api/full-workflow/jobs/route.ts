import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { productInputSchema } from "@/lib/workflow";
import { getWorkflowQueue, isQueueEnabled } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — enqueue a background workflow job (returns a jobId to poll).
export async function POST(request: NextRequest) {
  const access = await guard(request, { scope: "full-workflow-jobs", limit: 8, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  if (!(await isQueueEnabled())) {
    return NextResponse.json(
      { error: "Background processing is not configured. Set REDIS_URL in admin settings, or use the streaming endpoint." },
      { status: 503 }
    );
  }

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Complete the required product information." }, { status: 400 });
  }

  const job = await db.workflowJob.create({
    data: { userId: access.session.uid, status: "queued", input: JSON.stringify(parsed.data) },
  });

  try {
    const queue = await getWorkflowQueue();
    // attempts: 1 — never auto-retry: a re-run would re-charge credits (the charge
    // lives inside the workflow). Stranded/crashed jobs are handled by the reaper.
    await queue.add(
      "workflow",
      { jobId: job.id },
      { attempts: 1, removeOnComplete: 50, removeOnFail: 50 }
    );
  } catch (error) {
    await db.workflowJob.update({ where: { id: job.id }, data: { status: "failed", error: "Could not enqueue the job." } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not enqueue the job." },
      { status: 502 }
    );
  }

  return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 202 });
}

// GET ?id= — poll a job's status, progress events, and result.
export async function GET(request: NextRequest) {
  const access = await guard(request, { scope: "full-workflow-jobs-status", limit: 240, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing job id." }, { status: 400 });

  const job = await db.workflowJob.findFirst({
    where: { id, userId: access.session.uid },
    select: { id: true, status: true, events: true, result: true, error: true, updatedAt: true },
  });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    events: safeParse(job.events) ?? [],
    result: safeParse(job.result),
    error: job.error,
    updatedAt: job.updatedAt,
  });
}
