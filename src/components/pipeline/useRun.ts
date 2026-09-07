"use client";

import { useCallback, useRef, useState } from "react";
import type { RunEvent } from "@/lib/agents/events";
import type { AgentTask, Run, RunStatus, StoredEvent, TaskStatus } from "@/lib/db/schema";
import { formatCost, formatDuration } from "@/lib/format";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { API_KEY_HEADER } from "@/lib/runs";

export type AgentView = {
  position: number;
  role: string;
  title: string;
  status: TaskStatus;
  output: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number | null;
  error: string | null;
};

export type LogEntry = { at: string; message: string };

export type RunView = {
  runId: string | null;
  goal: string;
  provider: ProviderId | null;
  model: string | null;
  status: "idle" | RunStatus;
  agents: AgentView[];
  result: string;
  log: LogEntry[];
  inputTokens: number;
  outputTokens: number;
  cost: number | null;
  startedAt: number | null;
  durationMs: number | null;
  error: string | null;
};

export const EMPTY_RUN: RunView = {
  runId: null,
  goal: "",
  provider: null,
  model: null,
  status: "idle",
  agents: [],
  result: "",
  log: [],
  inputTokens: 0,
  outputTokens: 0,
  cost: null,
  startedAt: null,
  durationMs: null,
  error: null,
};

export const ACTIVE_STATUSES: ReadonlySet<RunView["status"]> = new Set(["planning", "running", "synthesizing"]);

function updateAgent(view: RunView, position: number, patch: Partial<AgentView>): RunView {
  return { ...view, agents: view.agents.map((a) => (a.position === position ? { ...a, ...patch } : a)) };
}

function log(view: RunView, at: string, message: string): RunView {
  return { ...view, log: [...view.log, { at, message }] };
}

function agentName(view: RunView, position: number) {
  return view.agents.find((a) => a.position === position)?.role ?? `Agent ${position + 1}`;
}

/** Applies one event to the view. Pure, so it serves both live runs and replays. */
export function applyEvent(view: RunView, event: RunEvent): RunView {
  const { at } = event;
  switch (event.type) {
    case "run_started":
      return log(
        { ...EMPTY_RUN, runId: event.runId, goal: event.goal, provider: event.provider, model: event.model, status: "planning", startedAt: Date.parse(at) },
        at,
        `Run started with ${PROVIDERS[event.provider].name} (${event.model})`,
      );
    case "plan_started":
      return log(view, at, "Orchestrator is planning the work");
    case "plan_completed": {
      const agents = event.tasks.map<AgentView>((t) => ({ ...t, status: "pending", output: "", inputTokens: 0, outputTokens: 0, durationMs: null, error: null }));
      const roles = agents.map((a) => a.role).join(", ");
      return log({ ...view, status: "running", agents }, at, `Orchestrator split the goal into ${agents.length} tasks: ${roles}`);
    }
    case "agent_started":
      return log(updateAgent(view, event.position, { status: "running" }), at, `${agentName(view, event.position)} started`);
    case "agent_delta": {
      const agent = view.agents[event.position];
      return updateAgent(view, event.position, { output: (agent?.output ?? "") + event.text });
    }
    case "agent_completed":
      return log(
        updateAgent(view, event.position, { status: "completed", inputTokens: event.inputTokens, outputTokens: event.outputTokens, durationMs: event.durationMs }),
        at,
        `${agentName(view, event.position)} finished in ${formatDuration(event.durationMs)}`,
      );
    case "agent_failed":
      return log(updateAgent(view, event.position, { status: "failed", error: event.error }), at, `${agentName(view, event.position)} failed: ${event.error}`);
    case "synthesis_started":
      return log({ ...view, status: "synthesizing", result: "" }, at, "Merging results into the final answer");
    case "synthesis_delta":
      return { ...view, result: view.result + event.text };
    case "run_completed":
      return log(
        { ...view, status: "completed", result: event.result, inputTokens: event.inputTokens, outputTokens: event.outputTokens, cost: event.cost, durationMs: event.durationMs },
        at,
        `Done in ${formatDuration(event.durationMs)} for ${formatCost(event.cost)}`,
      );
    case "run_failed":
      return log({ ...view, status: "failed", error: event.error }, at, `Run failed: ${event.error}`);
  }
}

type StoredRun = { run: Run; tasks: AgentTask[]; events: StoredEvent[] };

/** Rebuilds a finished run from what was stored. Deltas are not stored, so outputs come from the rows. */
function viewFromStored({ run, tasks, events }: StoredRun): RunView {
  let view = EMPTY_RUN;
  for (const e of events) {
    view = applyEvent(view, { ...e.payload, type: e.type, runId: e.runId, at: new Date(e.createdAt).toISOString() } as RunEvent);
  }
  const byPosition = new Map(tasks.map((t) => [t.position, t]));
  return {
    ...view,
    status: run.status,
    agents: view.agents.map((a) => {
      const t = byPosition.get(a.position);
      return t ? { ...a, output: t.output ?? "", error: t.error } : a;
    }),
    result: run.result ?? "",
    startedAt: null,
    durationMs: view.durationMs ?? (run.completedAt ? new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime() : null),
  };
}

async function* readSse(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      for (const line of frame.split("\n")) {
        if (line.startsWith("data: ")) yield JSON.parse(line.slice(6)) as RunEvent;
      }
    }
  }
}

export function useRun() {
  const [view, setView] = useState<RunView>(EMPTY_RUN);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => controller.current?.abort(), []);

  const start = useCallback(async (goal: string, provider: ProviderId, apiKey: string) => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setView({ ...EMPTY_RUN, goal, provider, model: PROVIDERS[provider].model, status: "planning", startedAt: Date.now() });

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers[API_KEY_HEADER] = apiKey;
      const res = await fetch("/api/runs", { method: "POST", headers, body: JSON.stringify({ goal, provider }), signal: ac.signal });
      if (!res.ok || !res.body) {
        const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
        throw new Error(error || "The server could not start the run.");
      }
      for await (const event of readSse(res.body)) setView((v) => applyEvent(v, event));
    } catch (err) {
      const message = ac.signal.aborted ? "Run cancelled" : err instanceof Error ? err.message : String(err);
      setView((v) => (ACTIVE_STATUSES.has(v.status) ? log({ ...v, status: "failed", error: message }, new Date().toISOString(), message) : v));
    }
  }, []);

  const load = useCallback(async (runId: string) => {
    controller.current?.abort();
    const res = await fetch(`/api/runs/${runId}`);
    if (!res.ok) throw new Error("Run not found.");
    setView(viewFromStored((await res.json()) as StoredRun));
  }, []);

  return { view, start, load, cancel, isActive: ACTIVE_STATUSES.has(view.status) };
}
