import { db } from "@/lib/db";
import { productInputSchema } from "@/lib/workflow";
import { runWorkflow, type ProgressEvent } from "@/lib/workflow-runner";

// Keep heavy base64 image data out of the polled `events` blob — it lives in the
// `result` column. Persisting full images here made `events` grow to many MB, so
// every 1s flush rewrote a huge row and every client poll re-downloaded it, which
// is what made long workflows look "stuck". The client reads final images from
// the `result` column instead.
function slimEvents(events: ProgressEvent[]): unknown[] {
  return events.map((event) => {
    if (event.type === "generated_image") {
      return { ...event, image: { ...event.image, dataUrl: "" } };
    }
    if (event.type === "result") {
      return {
        ...event,
        result: {
          ...event.result,
          generatedImages: (event.result.generatedImages ?? []).map((g) => ({ ...g, dataUrl: "" })),
        },
      };
    }
    return event;
  });
}

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
    await db.workflowJob.update({ where: { id: jobId }, data: { events: JSON.stringify(slimEvents(events)) } }).catch(() => {});
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
      events: JSON.stringify(slimEvents(events)),
      result: result ? JSON.stringify(result) : null,
      error: errorMessage,
    },
  });

  return { jobId, status: finalStatus };
}
