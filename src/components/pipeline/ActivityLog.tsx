"use client";

import { useEffect, useRef } from "react";
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
    return <p className="p-4 text-sm text-muted-foreground">Events will appear here as the run progresses.</p>;
  }

  return (
    <ol className="space-y-2 p-4 text-sm">
      {entries.map((e, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{time(e.at)}</span>
          <span>{e.message}</span>
        </li>
      ))}
      <div ref={end} />
    </ol>
  );
}
