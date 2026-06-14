import { db } from "@/lib/db";
import { productInputSchema } from "@/lib/workflow";
import { runWorkflow, type ProgressEvent } from "@/lib/workflow-runner";

/**
 * Runs a queued WorkflowJob (in the BullMQ worker): loads its input, runs the
 * shared workflow with progress persisted to the DB, then stores the result.
 */
export async function runWorkflowJob(jobId: string): Promise<{ jobId: string; status: string }> {
  const jobRow = await db.workflowJob.findUnique({ where: { id: jobId } });
  if (!jobRow) throw new Error(`WorkflowJob ${jobId} not found.`);

  const input = productInputSchema.parse(JSON.parse(jobRow.input));
  await db.workflowJob.update({ where: { id: jobId }, data: { status: "running" } });

  const events: ProgressEvent[] = [];
  let finalStatus = "completed";
  let result: unknown = null;
  let errorMessage: string | null = null;
  let lastFlush = 0;

  const flush = async () => {
    const now = Date.now();
    if (now - lastFlush < 1000) return;
    lastFlush = now;
    await db.workflowJob.update({ where: { id: jobId }, data: { events: JSON.stringify(events) } }).catch(() => {});
  };

  try {
    await runWorkflow(input, {
      userId: jobRow.userId,
      emit: (event) => {
        events.push(event);
        if (event.type === "result") {
          result = event.result;
          finalStatus = event.result.policyStatus?.status === "blocked" ? "blocked" : "completed";
        } else if (event.type === "error") {
          errorMessage = event.error;
          finalStatus = "failed";
        }
        void flush();
      },
      // Record the credit charge on the job row before the long work, so a crashed
      // process leaves enough state for the reaper to refund it.
      onCharge: async (charge) => {
        await db.workflowJob
          .update({ where: { id: jobId }, data: { charged: true, creditId: charge.creditId } })
          .catch(() => {});
      },
      // runWorkflow refunded itself (block/fail) — mark it so the reaper won't refund again.
      onRefund: async () => {
        await db.workflowJob.update({ where: { id: jobId }, data: { refunded: true } }).catch(() => {});
      },
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "The workflow failed.";
    finalStatus = "failed";
  }

  await db.workflowJob.update({
    where: { id: jobId },
    data: {
      status: finalStatus,
      events: JSON.stringify(events),
      result: result ? JSON.stringify(result) : null,
      error: errorMessage,
    },
  });

  return { jobId, status: finalStatus };
}
