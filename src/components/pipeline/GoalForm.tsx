"use client";

import { Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PREDEFINED_GOALS } from "@/lib/goals";
import { cn } from "@/lib/utils";

type Props = {
  goal: string;
  onGoalChange: (goal: string) => void;
  onRun: () => void;
  onCancel: () => void;
  running: boolean;
};

export function GoalForm({ goal, onGoalChange, onRun, onCancel, running }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Textarea
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="Describe the goal for the team, or pick one below"
          rows={2}
          disabled={running}
          className="min-h-16 resize-none text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !running && goal.trim()) onRun();
          }}
        />
        {running ? (
          <Button variant="outline" size="lg" className="h-16 w-36" onClick={onCancel}>
            <Square /> Cancel
          </Button>
        ) : (
          <Button size="lg" className="h-16 w-36" onClick={onRun} disabled={!goal.trim()}>
            {running ? <Loader2 className="animate-spin" /> : <Play />} Run pipeline
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {PREDEFINED_GOALS.map((g) => {
          const selected = g.goal === goal;
          return (
            <button
              key={g.label}
              type="button"
              disabled={running}
              onClick={() => onGoalChange(g.goal)}
              title={g.goal}
              className={cn(
                "rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-accent disabled:opacity-60",
                selected && "border-primary bg-accent",
              )}
            >
              <div className="text-sm font-medium">{g.label}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{g.goal}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
