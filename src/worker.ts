import { Worker } from "bullmq";
import { getRedisConnectionOptions, WORKFLOW_QUEUE } from "@/lib/queue";

// Standalone background worker. Run separately from the Next server:
//   bun run worker
// BullMQ workers cannot run inside the Next.js process; they need their own
// long-lived process (a separate service in production).

async function main() {
  const connection = await getRedisConnectionOptions();

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
    { connection, concurrency: 2 }
  );

  worker.on("completed", (job) => console.log(`[worker] completed id=${job.id}`));
  worker.on("failed", (job, err) => console.error(`[worker] failed id=${job?.id}: ${err?.message}`));

  console.log(`[worker] listening on "${WORKFLOW_QUEUE}"`);
}

main().catch((error) => {
  console.error("[worker] fatal:", error);
  process.exit(1);
});
