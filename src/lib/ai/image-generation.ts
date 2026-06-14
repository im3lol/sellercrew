import type { AIImageInput } from "@/lib/ai/providers";
import { DEFAULT_OPENROUTER_IMAGE_MODELS, getSettings } from "@/lib/settings";
import { getSecret } from "@/lib/secrets";
import type { GeneratedImage } from "@/lib/workflow";

function dataUrlToPart(image: AIImageInput) {
  const commaIndex = image.dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid image data URL.");
  return {
    inline_data: {
      mime_type: image.type,
      data: image.dataUrl.slice(commaIndex + 1),
    },
  };
}

export async function generateProductImage(options: {
  imageNumber: number;
  purpose: string;
  prompt: string;
  referenceImages: AIImageInput[];
}): Promise<GeneratedImage> {
  const openRouterKey = await getSecret("OPENROUTER_API_KEY");
  const geminiKey = await getSecret("GEMINI_API_KEY");
  const settings = await getSettings().catch(() => null);
  const openRouterModels = [...new Set([
    settings?.models.geminiImage,
    ...(settings?.models.openrouterImageFallbacks ?? DEFAULT_OPENROUTER_IMAGE_MODELS.slice(1)),
    process.env.OPENROUTER_IMAGE_MODEL,
  ].map((model) => model?.trim()).filter((model): model is string => Boolean(model)))];

  if (openRouterKey) {
    const errors: string[] = [];
    for (const openRouterModel of openRouterModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "SellerCrew",
          },
          body: JSON.stringify({
            model: openRouterModel,
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${options.prompt}

Use the supplied product photos as strict visual references. Preserve the exact product design, colors, proportions, logos, labels, and packaging. Do not invent accessories or features. Create one professional Amazon Egypt listing image. No Amazon logo or badges.`,
                },
                ...options.referenceImages.slice(0, 6).map((image) => ({
                  type: "image_url",
                  image_url: { url: image.dataUrl },
                })),
              ],
            }],
            modalities: openRouterModel.includes("seedream") ? ["image"] : ["image", "text"],
          }),
          signal: AbortSignal.timeout(110_000),
        });
        const payload = await response.json() as {
          choices?: Array<{
            message?: {
              images?: Array<{ image_url?: { url?: string } }>;
            };
          }>;
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(payload.error?.message || `request failed (${response.status})`);
        }

        const imageUrl = payload.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageUrl) throw new Error("model returned no image");

        let dataUrl = imageUrl;
        if (!imageUrl.startsWith("data:")) {
          const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
          if (!imageResponse.ok) throw new Error("model returned an unreadable image");
          const responseMimeType = imageResponse.headers.get("content-type") || "image/png";
          const bytes = Buffer.from(await imageResponse.arrayBuffer());
          dataUrl = `data:${responseMimeType};base64,${bytes.toString("base64")}`;
        }
        const mimeType = /^data:([^;]+);base64,/.exec(dataUrl)?.[1] || "image/png";
        return {
          imageNumber: options.imageNumber,
          purpose: options.purpose,
          prompt: options.prompt,
          mimeType,
          dataUrl,
          model: openRouterModel,
        };
      } catch (error) {
        errors.push(`${openRouterModel}: ${error instanceof Error ? error.message : "request failed"}`);
      }
    }
    if (!geminiKey) {
      throw new Error(`OpenRouter image models failed. ${errors.join(" ")}`);
    }
  }

  const apiKey = geminiKey;
  if (!apiKey) throw new Error("OpenRouter image generation is not configured.");

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `${options.prompt}

Use the supplied product photos as strict visual references. Preserve the exact product design, colors, proportions, logos, labels, and packaging. Do not invent accessories or features. Create one professional Amazon Egypt listing image. No Amazon logo or badges.`,
            },
            ...options.referenceImages.slice(0, 6).map(dataUrlToPart),
          ],
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          responseFormat: {
            image: {
              aspectRatio: "1:1",
              imageSize: "1K",
            },
          },
        },
      }),
      signal: AbortSignal.timeout(110_000),
    }
  );

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini image generation failed (${response.status}).`);
  }

  const imagePart = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data || part.inline_data?.data
  );
  const data = imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;
  const mimeType = imagePart?.inlineData?.mimeType ?? imagePart?.inline_data?.mime_type ?? "image/png";
  if (!data) throw new Error("Gemini did not return a generated image.");

  return {
    imageNumber: options.imageNumber,
    purpose: options.purpose,
    prompt: options.prompt,
    mimeType,
    dataUrl: `data:${mimeType};base64,${data}`,
    model,
  };
}
