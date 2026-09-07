import type { ProviderId } from "@/lib/providers";

export type PlannedTask = { position: number; role: string; title: string };

export type Usage = { inputTokens: number; outputTokens: number };

export type RunEventPayload =
  | { type: "run_started"; goal: string; provider: ProviderId; model: string }
  | { type: "plan_started" }
  | { type: "plan_completed"; tasks: PlannedTask[] }
  | { type: "agent_started"; position: number }
  | { type: "agent_delta"; position: number; text: string }
  | ({ type: "agent_completed"; position: number; durationMs: number } & Usage)
  | { type: "agent_failed"; position: number; error: string }
  | { type: "synthesis_started" }
  | { type: "synthesis_delta"; text: string }
  | ({ type: "run_completed"; result: string; durationMs: number; cost: number } & Usage)
  | { type: "run_failed"; error: string };

export type RunEvent = RunEventPayload & { runId: string; at: string };

export type RunEventType = RunEvent["type"];

/** Delta events are streamed to the browser but not stored; the final text is stored instead. */
export const TRANSIENT_EVENTS: ReadonlySet<RunEventType> = new Set(["agent_delta", "synthesis_delta"]);
