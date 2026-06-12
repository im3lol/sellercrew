import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const requestSchema = z.object({
  productName: z.string().trim().min(2).max(200),
  productDescription: z.string().trim().max(5000).optional().default(""),
  keywords: z.array(z.string().trim().min(1).max(100)).max(30).optional().default([]),
  competitorAsins: z.array(z.string().trim().min(1).max(20)).max(20).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide valid product information." },
        { status: 400 }
      );
    }

    const { productName, productDescription, keywords, competitorAsins } = parsed.data;
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const prompt = `You are a team of Amazon listing experts. Generate a complete Amazon product listing for:

Product: ${productName}
${productDescription ? `Description: ${productDescription}` : ""}
${keywords?.length ? `Target Keywords: ${keywords.join(", ")}` : ""}
${competitorAsins?.length ? `Competitor ASINs: ${competitorAsins.join(", ")}` : ""}

Generate the following in JSON format:
{
  "title": "Amazon-optimized title (under 200 chars, primary keyword first)",
  "bullets": ["5 bullet points, each starting with a benefit in caps, followed by details. Under 500 chars each."],
  "description": "HTML description with h2 tags and paragraphs, compelling and benefit-focused",
  "backendKeywords": ["10-15 relevant backend keywords"],
  "complianceScore": 85,
  "complianceNotes": "Brief compliance assessment"
}

Ensure the listing is Amazon-compliant, keyword-optimized, and conversion-focused.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert Amazon listing optimization team. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let result;
    try {
      const content = completion.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
    } catch {
      result = { rawContent: completion.choices?.[0]?.message?.content };
    }

    if (result.description) {
      result.description = sanitizeHtml(result.description, {
        allowedTags: ["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "br"],
        allowedAttributes: {},
      });
    }

    return NextResponse.json({
      success: true,
      listing: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Listing generation error:", error);
    const isConfigurationError =
      error instanceof Error && error.message.toLowerCase().includes("configuration");
    return NextResponse.json(
      {
        error: isConfigurationError
          ? "AI generation is not configured on this server."
          : "Listing generation failed. Please try again.",
      },
      { status: isConfigurationError ? 503 : 500 }
    );
  }
}
