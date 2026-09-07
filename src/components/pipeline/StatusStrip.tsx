"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ACTIVE_STATUSES, type RunView } from "./useRun";

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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active && view.startedAt ? now - view.startedAt : view.durationMs;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm",
        view.status === "completed" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        view.status === "failed" && "border-red-200 bg-red-50 text-red-900",
        active && "border-amber-200 bg-amber-50 text-amber-900",
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 font-medium">
        {active && <Loader2 className="size-4 animate-spin" />}
        {view.status === "completed" && <CheckCircle2 className="size-4" />}
        {view.status === "failed" && <AlertCircle className="size-4" />}
        {message(view)}
      </div>
      {elapsed != null && <span className="font-mono tabular-nums">{formatDuration(elapsed)}</span>}
    </div>
  );
}
