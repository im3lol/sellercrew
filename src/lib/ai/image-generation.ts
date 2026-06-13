import type { AIImageInput } from "@/lib/ai/providers";
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini image generation is not configured.");

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
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
