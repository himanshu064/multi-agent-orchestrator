"use client";

import { BarChart3, Code2, PenLine, Plane, Play, Rocket, Scale, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PREDEFINED_GOALS, type PredefinedGoal } from "@/lib/goals";
import { cn } from "@/lib/utils";

const ICONS: Record<PredefinedGoal["icon"], typeof Rocket> = {
  chart: BarChart3,
  rocket: Rocket,
  scale: Scale,
  pen: PenLine,
  plane: Plane,
  code: Code2,
};

type Props = {
  goal: string;
  onGoalChange: (goal: string) => void;
  onRun: () => void;
  onCancel: () => void;
  running: boolean;
};

export function GoalForm({ goal, onGoalChange, onRun, onCancel, running }: Props) {
  const canRun = !running && goal.trim().length > 0;
  return (
    <section className="space-y-3">
      {/* Outer radius 18px = inner 10px + 8px padding, so the corners stay concentric. */}
      <div className="rounded-2xl bg-card p-2 shadow-(--shadow-border) transition-[box-shadow] duration-150 ease-out focus-within:shadow-(--shadow-border-hover)">
        <Textarea
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="Describe the goal for the team, or pick one below"
          rows={2}
          autoFocus
          disabled={running}
          className="min-h-14 resize-none rounded-lg border-0 bg-transparent px-3 py-2.5 text-base shadow-none focus-visible:ring-0 disabled:bg-transparent md:text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canRun) onRun();
          }}
        />
        <div className="flex items-center justify-between gap-3 ps-3 pe-1 pb-1">
          <p className="text-xs text-muted-foreground">
            {running ? "Agents are working. You can cancel at any time." : "Press ⌘ Enter to run"}
          </p>
          {running ? (
            <Button variant="outline" onClick={onCancel} className="ps-3 pe-3.5">
              <Square /> Cancel
            </Button>
          ) : (
            <Button
              onClick={onRun}
              disabled={!canRun}
              className="ps-3 pe-3.5 transition-[scale,background-color] duration-150 ease-out active:scale-[0.96]"
            >
              <Play className="translate-x-px" /> Run pipeline
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="me-1 text-xs font-medium text-muted-foreground">Try a goal</span>
        {PREDEFINED_GOALS.map((g) => {
          const Icon = ICONS[g.icon];
          const selected = g.goal === goal;
          return (
            <button
              key={g.label}
              type="button"
              disabled={running}
              onClick={() => onGoalChange(g.goal)}
              title={g.goal}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full bg-card ps-2.5 pe-3 text-xs font-medium shadow-(--shadow-border) transition-[box-shadow,background-color,color,scale] duration-150 ease-out hover:shadow-(--shadow-border-hover) active:scale-[0.96] disabled:opacity-50",
                selected && "bg-primary text-primary-foreground shadow-none",
              )}
            >
              <Icon className="size-3.5" strokeWidth={2} />
              {g.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
