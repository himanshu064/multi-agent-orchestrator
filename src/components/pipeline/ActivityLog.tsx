"use client";

import { useEffect, useRef } from "react";
import { EmptyState } from "./EmptyState";
import type { LogEntry } from "./useRun";

function time(at: string) {
  return new Date(at).toLocaleTimeString("en-GB", { hour12: false });
}

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [entries.length]);

  if (entries.length === 0) {
    return <EmptyState title="Every step of the run is logged here" />;
  }

  return (
    <ol className="space-y-2 p-4 text-sm">
      {entries.map((e, i) => (
        <li key={i} className="flex gap-3 leading-5">
          <span className="shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">{time(e.at)}</span>
          <span>{e.message}</span>
        </li>
      ))}
      <div ref={end} />
    </ol>
  );
}
