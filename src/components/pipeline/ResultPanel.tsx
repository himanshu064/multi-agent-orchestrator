"use client";

import { formatCost, formatDuration, formatTokens } from "@/lib/format";
import { PROVIDERS } from "@/lib/providers";
import { Markdown } from "./Markdown";
import type { RunView } from "./useRun";

export function ResultPanel({ view }: { view: RunView }) {
  if (!view.result) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {view.status === "idle" ? "The final answer will appear here." : "Waiting for the agents to finish."}
      </p>
    );
  }

  const done = view.status === "completed";

  return (
    <div className="p-4">
      <Markdown>{view.result}</Markdown>
      {done && view.provider && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <dt>Vendor and model</dt>
          <dd className="text-right font-medium text-foreground">
            {PROVIDERS[view.provider].name} · {view.model}
          </dd>
          <dt>Total time</dt>
          <dd className="text-right font-mono">{formatDuration(view.durationMs ?? 0)}</dd>
          <dt>Tokens in / out</dt>
          <dd className="text-right font-mono">
            {formatTokens(view.inputTokens)} / {formatTokens(view.outputTokens)}
          </dd>
          <dt>Estimated cost</dt>
          <dd className="text-right font-mono font-medium text-emerald-700">{formatCost(view.cost ?? 0)}</dd>
        </dl>
      )}
    </div>
  );
}
