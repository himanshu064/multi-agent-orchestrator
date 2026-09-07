import { estimateCost } from "@/lib/agents/pricing";
import type { ProviderId } from "@/lib/providers";

/** Header the browser uses to send the vendor API key for one request. */
export const API_KEY_HEADER = "x-api-key";

export type RunSummary = ReturnType<typeof toRunSummary>;

export function toRunSummary(row: {
  id: string;
  goal: string;
  status: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: Date;
  completedAt: Date | null;
}) {
  const provider = row.provider as ProviderId;
  return {
    id: row.id,
    goal: row.goal,
    status: row.status,
    provider,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
    durationMs: row.completedAt ? row.completedAt.getTime() - row.createdAt.getTime() : null,
    cost: estimateCost(provider, row.inputTokens, row.outputTokens),
  };
}
