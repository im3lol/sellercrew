import { Worker } from "bullmq";
import { getRedisConnectionOptions, WORKFLOW_QUEUE } from "@/lib/queue";
import { db } from "@/lib/db";
import { FULL_WORKFLOW_COST } from "@/lib/credits";
import { refundByCreditId } from "@/lib/server-credits";

// Standalone background worker. Run separately from the Next server:
//   bun run worker
// BullMQ workers cannot run inside the Next.js process; they need their own
// long-lived process (a separate service in production).

const STALE_JOB_MS = 15 * 60 * 1000; // a real run is <~6min; older "running" = dead

/**
 * Recover jobs whose process died mid-run: anything stuck in queued/running and
 * untouched for STALE_JOB_MS is marked failed, and if it was charged but never
 * refunded, the credits are returned. Runs once on startup.
 */
async function reapStrandedJobs() {
  const cutoff = new Date(Date.now() - STALE_JOB_MS);
  let stranded: Array<{ id: string; charged: boolean; refunded: boolean; creditId: string | null; result: string | null }> = [];
  try {
    stranded = await db.workflowJob.findMany({
      where: { status: { in: ["queued", "running"] }, updatedAt: { lt: cutoff } },
      select: { id: true, charged: true, refunded: true, creditId: true, result: true },
    });
  } catch (error) {
    console.error("[worker] reaper query failed:", error);
    return;
  }

  for (const job of stranded) {
    // If a result was already persisted, the workflow actually delivered before the
    // process died — do NOT refund (the user kept the listing); just unstick the
    // status. Only genuinely incomplete jobs (no result) are failed + refunded.
    const delivered = Boolean(job.result);
    if (delivered) {
      await db.workflowJob.update({ where: { id: job.id }, data: { status: "completed" } }).catch(() => {});
      continue;
    }
    if (job.charged && !job.refunded && job.creditId) {
      await refundByCreditId(job.creditId, FULL_WORKFLOW_COST);
    }
    await db.workflowJob
      .update({
        where: { id: job.id },
        data: {
          status: "failed",
          refunded: job.charged ? true : job.refunded,
          error: "The worker restarted before this job finished. Any reserved credits were refunded.",
        },
      })
      .catch(() => {});
  }
  if (stranded.length) console.log(`[worker] reaped ${stranded.length} stranded job(s)`);
}

async function main() {
  const connection = await getRedisConnectionOptions();

  await reapStrandedJobs();

  const worker = new Worker(
    WORKFLOW_QUEUE,
    async (job) => {
      console.log(`[worker] processing "${job.name}" id=${job.id}`);
      if (job.name === "healthcheck") {
        return { ok: true, at: new Date().toISOString() };
      }
      if (job.name === "workflow") {
        const { runWorkflowJob } = await import("@/lib/workflow-job-runner");
        return runWorkflowJob((job.data as { jobId: string }).jobId);
      }
      return { ok: false, reason: `unhandled job ${job.name}` };
    },
    // lockDuration generous so long image-generation runs aren't deemed "stalled"
    // and re-executed (which would double-charge); attempts:1 is set at enqueue.
    { connection, concurrency: 2, lockDuration: 10 * 60 * 1000, maxStalledCount: 0 }
  );

  worker.on("completed", (job) => console.log(`[worker] completed id=${job.id}`));
  worker.on("failed", (job, err) => console.error(`[worker] failed id=${job?.id}: ${err?.message}`));

  console.log(`[worker] listening on "${WORKFLOW_QUEUE}"`);
}

main().catch((error) => {
  console.error("[worker] fatal:", error);
  process.exit(1);
});
