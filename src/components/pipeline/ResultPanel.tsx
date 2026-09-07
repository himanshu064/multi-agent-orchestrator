"use client";

import { formatCost, formatDuration, formatTokens } from "@/lib/format";
import { PROVIDERS } from "@/lib/providers";
import { EmptyState } from "./EmptyState";
import { Markdown } from "./Markdown";
import type { RunView } from "./useRun";

export function ResultPanel({ view }: { view: RunView }) {
  if (!view.result) {
    return view.status === "idle" ? (
      <EmptyState title="The merged answer appears here" />
    ) : (
      <p className="p-5 text-sm text-muted-foreground">Waiting for the agents to finish before merging.</p>
    );
  }

  const done = view.status === "completed";

  return (
    <div className="p-5">
      <Markdown>{view.result}</Markdown>
      {done && view.provider && (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-4 text-xs text-muted-foreground">
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
