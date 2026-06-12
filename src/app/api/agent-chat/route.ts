import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { agentId, message, systemPrompt, history } = await request.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for AI chat
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt || "You are a helpful AI assistant specialized in Amazon product listings.",
      },
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({
      agentId,
      content: responseContent,
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
