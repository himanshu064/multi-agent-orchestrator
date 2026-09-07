"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCost, formatDuration } from "@/lib/format";
import { PROVIDERS } from "@/lib/providers";
import type { RunSummary } from "@/lib/runs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRuns: RunSummary[];
  onSelect: (id: string) => void;
};

export function RunHistory({ open, onOpenChange, initialRuns, onSelect }: Props) {
  const [runs, setRuns] = useState(initialRuns);

  // Refresh the list each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    fetch("/api/runs")
      .then((r) => (r.ok ? (r.json() as Promise<RunSummary[]>) : Promise.reject(r)))
      .then(setRuns)
      .catch(() => {});
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Run history</SheetTitle>
          <SheetDescription>Click a run to load it exactly as it finished.</SheetDescription>
        </SheetHeader>
        <div className="-mx-4 flex-1 overflow-y-auto px-4">
          {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(r.id);
                    onOpenChange(false);
                  }}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="line-clamp-2 text-sm font-medium">{r.goal}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant={r.status === "completed" ? "secondary" : r.status === "failed" ? "destructive" : "outline"}>
                      {r.status}
                    </Badge>
                    <span>{PROVIDERS[r.provider]?.name ?? r.provider}</span>
                    {r.durationMs != null && <span>· {formatDuration(r.durationMs)}</span>}
                    <span>· {formatCost(r.cost)}</span>
                    <span className="ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
