import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAIText } from "@/lib/ai/providers";
import { guard } from "@/lib/api-guard";

export const runtime = "nodejs";

const requestSchema = z.object({
  agentId: z.string().trim().min(1).max(50),
  message: z.string().trim().min(1).max(8_000),
  systemPrompt: z.string().trim().max(8_000).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8_000),
  })).max(30).optional().default([]),
});

export async function POST(request: NextRequest) {
  const access = guard(request, { scope: "agent-chat", limit: 30, windowMs: 60 * 1000 });
  if (!access.ok) return access.response;

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid agent message." },
        { status: 400 }
      );
    }

    const { agentId, message, systemPrompt, history } = parsed.data;
    const result = await generateAIText({
      system: systemPrompt || "You are a helpful AI assistant specialized in Amazon product listings.",
      prompt: message,
      history,
      maxTokens: 1_000,
    });

    return NextResponse.json({
      agentId,
      content: result.text,
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Agent chat error:", error);
    const isConfigurationError =
      error instanceof Error && error.message.toLowerCase().includes("configuration");
    return NextResponse.json(
      {
        error: isConfigurationError
          ? "AI chat is not configured on this server."
          : "Agent chat failed. Please try again.",
      },
      { status: isConfigurationError ? 503 : 500 }
    );
  }
}
