import { NextRequest } from "next/server";
import { guard } from "@/lib/api-guard";
import { productInputSchema } from "@/lib/workflow";
import { runWorkflow, type ProgressEvent } from "@/lib/workflow-runner";

export const runtime = "nodejs";
export const maxDuration = 300;

function createEmitter(controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder();
  return (event: ProgressEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

// Streaming (SSE/NDJSON) entry point. Runs the workflow inline and streams
// progress. The same runWorkflow also powers the BullMQ worker.
export async function POST(request: NextRequest) {
  const access = await guard(request, { scope: "full-workflow", limit: 8, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response(
      `${JSON.stringify({ type: "error", error: "Complete the required product information before starting the workflow." })}\n`,
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const input = parsed.data;
  const uid = access.session.uid;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = createEmitter(controller);
      try {
        await runWorkflow(input, { userId: uid, emit });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
