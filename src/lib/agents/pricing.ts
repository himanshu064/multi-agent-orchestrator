import { PROVIDERS, type ProviderId } from "@/lib/providers";

/** Estimated cost in US dollars for a number of input and output tokens. */
export function estimateCost(provider: ProviderId, inputTokens: number, outputTokens: number) {
  const { input, output } = PROVIDERS[provider].pricing;
  return (inputTokens * input + outputTokens * output) / 1_000_000;
}
