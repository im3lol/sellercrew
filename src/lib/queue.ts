import { Queue, type ConnectionOptions } from "bullmq";
import { getSecret } from "@/lib/secrets";

export const WORKFLOW_QUEUE = "sellercrew-workflow";

let cachedOptions: ConnectionOptions | null = null;
let queue: Queue | null = null;

/**
 * BullMQ connection options parsed from REDIS_URL. We pass options (not an
 * ioredis instance) so BullMQ builds its own client and there's no dual-ioredis
 * type/version clash. TLS is auto-enabled for Upstash / rediss URLs.
 */
export async function getRedisConnectionOptions(): Promise<ConnectionOptions> {
  if (cachedOptions) return cachedOptions;
  const url = await getSecret("REDIS_URL");
  if (!url) throw new Error("REDIS_URL is not configured.");
  const parsed = new URL(url);
  const useTls = parsed.protocol === "rediss:" || parsed.hostname.includes("upstash.io");
  cachedOptions = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    ...(useTls ? { tls: {} } : {}),
  };
  return cachedOptions;
}

export async function isQueueEnabled(): Promise<boolean> {
  // Allow disabling the queue on hosts without a worker (e.g. Vercel-only),
  // forcing the client's inline SSE fallback even if REDIS_URL is set.
  if (process.env.WORKFLOW_QUEUE_DISABLED === "1") return false;
  return Boolean(await getSecret("REDIS_URL"));
}

export async function getWorkflowQueue(): Promise<Queue> {
  if (queue) return queue;
  queue = new Queue(WORKFLOW_QUEUE, { connection: await getRedisConnectionOptions() });
  return queue;
}

export interface WorkflowJobData {
  jobId: string; // our WorkflowJob row id (input + progress live in the DB)
}
