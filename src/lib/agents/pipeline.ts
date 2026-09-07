import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agentTasks, events, runs } from "@/lib/db/schema";
import type { ProviderId } from "@/lib/providers";
import { PROVIDERS } from "@/lib/providers";
import { getModel } from "./client";
import { TRANSIENT_EVENTS, type RunEvent, type RunEventPayload, type Usage } from "./events";
import { planTasks } from "./orchestrator";
import { estimateCost } from "./pricing";
import { synthesize } from "./synthesizer";
import { runAgent } from "./worker";

const DELTA_BATCH_MS = 50;

export type PipelineInput = {
  goal: string;
  provider: ProviderId;
  apiKey: string;
  signal?: AbortSignal;
};

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function addUsage(total: Usage, add: Usage): Usage {
  return {
    inputTokens: total.inputTokens + add.inputTokens,
    outputTokens: total.outputTokens + add.outputTokens,
  };
}

/** Collects text chunks and sends them at most once per batch window. */
function batcher(send: (text: string) => void) {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    if (!buffer) return;
    send(buffer);
    buffer = "";
  };
  return {
    push(text: string) {
      buffer += text;
      timer ??= setTimeout(flush, DELTA_BATCH_MS);
    },
    flush() {
      if (timer) clearTimeout(timer);
      flush();
    },
  };
}

/**
 * Runs one full pipeline: plan, agents in parallel, synthesis.
 * Every event is sent to `onEvent`; non-transient events are also stored.
 */
export async function runPipeline(input: PipelineInput, onEvent: (event: RunEvent) => void) {
  const db = getDb();
  const { goal, provider, apiKey, signal } = input;
  const { model } = PROVIDERS[provider];
  const startedAt = Date.now();

  const [run] = await db.insert(runs).values({ goal, provider, model }).returning({ id: runs.id });
  const runId = run.id;

  let seq = 0;
  const pending: Promise<unknown>[] = [];
  const emit = (payload: RunEventPayload) => {
    onEvent({ ...payload, runId, at: new Date().toISOString() });
    if (TRANSIENT_EVENTS.has(payload.type)) return;
    const { type, ...rest } = payload;
    pending.push(db.insert(events).values({ runId, seq: seq++, type, payload: rest }));
  };

  const handle = getModel(provider, apiKey);
  let total: Usage = { inputTokens: 0, outputTokens: 0 };

  try {
    emit({ type: "run_started", goal, provider, model });

    // 1. Orchestrator plans the work.
    emit({ type: "plan_started" });
    const plan = await planTasks(handle, goal, signal);
    total = addUsage(total, plan.usage);

    const tasks = await db
      .insert(agentTasks)
      .values(plan.tasks.map((t, position) => ({ runId, position, ...t })))
      .returning();
    await db.update(runs).set({ status: "running" }).where(eq(runs.id, runId));
    emit({
      type: "plan_completed",
      tasks: tasks.map(({ position, role, title }) => ({ position, role, title })),
    });

    // 2. Agents work in parallel.
    const results = await Promise.all(
      tasks.map(async (task) => {
        const { position } = task;
        const t0 = Date.now();
        await db.update(agentTasks).set({ status: "running", startedAt: new Date() }).where(eq(agentTasks.id, task.id));
        emit({ type: "agent_started", position });
        const deltas = batcher((text) => emit({ type: "agent_delta", position, text }));
        try {
          const { text, usage } = await runAgent(handle, task, deltas.push, signal);
          deltas.flush();
          await db
            .update(agentTasks)
            .set({ status: "completed", output: text, completedAt: new Date(), ...usage })
            .where(eq(agentTasks.id, task.id));
          emit({ type: "agent_completed", position, durationMs: Date.now() - t0, ...usage });
          return { role: task.role, text, usage };
        } catch (err) {
          deltas.flush();
          const error = errorMessage(err);
          await db.update(agentTasks).set({ status: "failed", error, completedAt: new Date() }).where(eq(agentTasks.id, task.id));
          emit({ type: "agent_failed", position, error });
          return null;
        }
      }),
    );

    const outputs = results.filter((r) => r !== null);
    for (const o of outputs) total = addUsage(total, o.usage);
    if (outputs.length === 0) throw new Error("Every agent failed, so there is nothing to merge.");

    // 3. Synthesizer merges the outputs.
    await db.update(runs).set({ status: "synthesizing" }).where(eq(runs.id, runId));
    emit({ type: "synthesis_started" });
    const deltas = batcher((text) => emit({ type: "synthesis_delta", text }));
    const synthesis = await synthesize(handle, goal, outputs, deltas.push, signal);
    deltas.flush();
    total = addUsage(total, synthesis.usage);

    const durationMs = Date.now() - startedAt;
    const cost = estimateCost(provider, total.inputTokens, total.outputTokens);
    await db
      .update(runs)
      .set({ status: "completed", result: synthesis.text, completedAt: new Date(), ...total })
      .where(eq(runs.id, runId));
    emit({ type: "run_completed", result: synthesis.text, durationMs, cost, ...total });
  } catch (err) {
    const error = errorMessage(err);
    await db
      .update(runs)
      .set({ status: "failed", error, completedAt: new Date(), ...total })
      .where(eq(runs.id, runId));
    emit({ type: "run_failed", error });
  } finally {
    await Promise.allSettled(pending);
  }

  return runId;
}
