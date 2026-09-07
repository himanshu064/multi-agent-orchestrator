"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ACTIVE_STATUSES, type RunView } from "./useRun";

const STAGES = [
  { key: "plan", label: "Plan" },
  { key: "work", label: "Work" },
  { key: "merge", label: "Merge" },
] as const;

type StageState = "pending" | "active" | "done" | "failed";

/** Which of the three stages each status maps to, as an index. */
function stageIndex(view: RunView) {
  switch (view.status) {
    case "planning":
      return 0;
    case "running":
      return 1;
    case "synthesizing":
      return 2;
    case "completed":
      return 3;
    case "failed":
      return view.agents.length === 0 ? 0 : view.result ? 2 : 1;
    default:
      return -1;
  }
}

function message(view: RunView) {
  switch (view.status) {
    case "idle":
      return "Pick a goal and press Run pipeline";
    case "planning":
      return "Orchestrator is planning the work";
    case "running": {
      const total = view.agents.length;
      const done = view.agents.filter((a) => a.status === "completed" || a.status === "failed").length;
      return done === 0 ? `${total} of ${total} agents working` : `${done} of ${total} agents done`;
    }
    case "synthesizing":
      return "Merging results";
    case "completed":
      return `Done in ${formatDuration(view.durationMs ?? 0)}`;
    case "failed":
      return view.error ?? "Run failed";
  }
}

export function StatusStrip({ view }: { view: RunView }) {
  const active = ACTIVE_STATUSES.has(view.status);
  const failed = view.status === "failed";
  const current = stageIndex(view);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);

  // While running the chip is the live timer; once done the message already says the duration.
  const elapsed = active && view.startedAt ? now - view.startedAt : null;

  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
      <ol className="flex items-center gap-1" aria-label="Pipeline stages">
        {STAGES.map((stage, i) => {
          const state: StageState = i < current ? "done" : i === current ? (failed ? "failed" : "active") : "pending";
          return (
            <li key={stage.key} className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full ps-2 pe-2.5 text-xs font-medium transition-[background-color,color] duration-150 ease-out",
                  state === "pending" && "text-muted-foreground",
                  state === "active" && "bg-amber-100 text-amber-900",
                  state === "done" && "bg-emerald-100 text-emerald-800",
                  state === "failed" && "bg-red-100 text-red-800",
                )}
              >
                <span className="inline-flex size-4 items-center justify-center">
                  {state === "done" && <Check className="size-3.5" strokeWidth={2.5} />}
                  {state === "active" && <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />}
                  {state === "failed" && <AlertCircle className="size-3.5" strokeWidth={2.5} />}
                  {state === "pending" && <span className="size-1.5 rounded-full bg-current opacity-50" />}
                </span>
                {stage.label}
              </span>
              {i < STAGES.length - 1 && <span className={cn("h-px w-4", i < current ? "bg-emerald-300" : "bg-border")} />}
            </li>
          );
        })}
      </ol>
      <div className="flex min-w-0 items-center gap-3 text-sm">
        <span className={cn("truncate font-medium", failed && "text-red-700")} aria-live="polite">
          {message(view)}
        </span>
        {elapsed != null && (
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {formatDuration(elapsed)}
          </span>
        )}
      </div>
    </div>
  );
}
