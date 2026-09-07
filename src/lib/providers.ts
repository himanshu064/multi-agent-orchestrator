export type ProviderId = "openai" | "google" | "anthropic";

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  model: string;
  /** US dollars per one million tokens. */
  pricing: { input: number; output: number };
  envKey: string;
  keyHint: string;
};

/** Cheapest text model per vendor. Prices checked on official pricing pages on 2026-09-07. */
export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    model: "gpt-5-nano",
    pricing: { input: 0.05, output: 0.4 },
    envKey: "OPENAI_API_KEY",
    keyHint: "sk-...",
  },
  google: {
    id: "google",
    name: "Google Gemini",
    model: "gemini-2.5-flash-lite",
    pricing: { input: 0.1, output: 0.4 },
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    keyHint: "AIza...",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    model: "claude-haiku-4-5",
    pricing: { input: 1, output: 5 },
    envKey: "ANTHROPIC_API_KEY",
    keyHint: "sk-ant-...",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}
