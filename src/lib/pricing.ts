// Approximate model pricing in USD per 1,000,000 tokens. Used only to estimate
// AI cost in the admin report — not billing. Update as provider pricing changes.

interface Rate {
  input: number;
  output: number;
}

const MODEL_RATES: { match: RegExp; rate: Rate }[] = [
  { match: /claude.*opus/i, rate: { input: 15, output: 75 } },
  { match: /claude.*sonnet/i, rate: { input: 3, output: 15 } },
  { match: /claude.*haiku/i, rate: { input: 0.8, output: 4 } },
  { match: /gemini.*flash.*lite/i, rate: { input: 0.1, output: 0.4 } },
  { match: /gemini.*flash/i, rate: { input: 0.3, output: 2.5 } },
  { match: /gemini.*pro/i, rate: { input: 1.25, output: 10 } },
  { match: /gpt.*mini/i, rate: { input: 0.15, output: 0.6 } },
  { match: /gpt/i, rate: { input: 2.5, output: 10 } },
  { match: /deepseek/i, rate: { input: 0.25, output: 0.4 } },
];

const FALLBACK_RATE: Rate = { input: 1, output: 3 };

function rateForModel(model: string | null | undefined): Rate {
  if (!model) return FALLBACK_RATE;
  return MODEL_RATES.find((entry) => entry.match.test(model))?.rate ?? FALLBACK_RATE;
}

/** Estimated USD cost for a given model and token counts. */
export function estimateCostUsd(model: string | null | undefined, inputTokens: number, outputTokens: number): number {
  const rate = rateForModel(model);
  const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
  return Math.round(cost * 10_000) / 10_000; // 4 dp
}
