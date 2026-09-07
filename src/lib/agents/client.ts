import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel, streamText } from "ai";

type ProviderOptions = NonNullable<Parameters<typeof streamText>[0]["providerOptions"]>;
import { PROVIDERS, type ProviderId } from "@/lib/providers";

export type ModelHandle = {
  model: LanguageModel;
  /** Vendor-specific settings that keep the cheapest models fast and cheap. */
  providerOptions: ProviderOptions;
};

/** The key from the request wins; a key in .env.local is the fallback. */
export function resolveApiKey(provider: ProviderId, headerKey: string | null) {
  const key = headerKey?.trim() || process.env[PROVIDERS[provider].envKey];
  return key || null;
}

export function getModel(provider: ProviderId, apiKey: string): ModelHandle {
  const { model } = PROVIDERS[provider];
  switch (provider) {
    case "openai":
      return {
        model: createOpenAI({ apiKey })(model),
        providerOptions: { openai: { reasoningEffort: "minimal" } },
      };
    case "google":
      return { model: createGoogle({ apiKey })(model), providerOptions: {} };
    case "anthropic":
      return { model: createAnthropic({ apiKey })(model), providerOptions: {} };
  }
}

/** A system prompt marked cacheable; vendors without prompt caching ignore the option. */
export function cachedInstructions(content: string) {
  return {
    role: "system" as const,
    content,
    providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
  };
}

export function toUsage(usage: { inputTokens?: number; outputTokens?: number }) {
  return { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
}
