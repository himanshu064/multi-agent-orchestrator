"use client";

import { History, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RunSummary } from "@/lib/runs";
import { ActivityLog } from "./ActivityLog";
import { GoalForm } from "./GoalForm";
import { Markdown } from "./Markdown";
import { PipelineCanvas } from "./PipelineCanvas";
import { ProviderBadge } from "./ProviderBadge";
import { ResultModal } from "./ResultModal";
import { RunHistory } from "./RunHistory";
import { SettingsDialog } from "./SettingsDialog";
import { StatusStrip } from "./StatusStrip";
import { useRun } from "./useRun";
import { useSettings } from "./useSettings";

type Props = { initialRuns: RunSummary[]; dbError: string | null };

export function Demo({ initialRuns, dbError }: Props) {
  const { settings, save, apiKey } = useSettings();
  const { view, start, load, cancel, isActive } = useRun();
  const [goal, setGoal] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  // ?result=<runId> opens the full-screen result, so a link can reach it directly.
  const router = useRouter();
  const resultId = useSearchParams().get("result");
  const showResult = (id: string) => router.replace(`?result=${id}`, { scroll: false });
  const closeResult = () => router.replace("/", { scroll: false });

  // The requested run is still loading until the view catches up with it.
  const loadingResult = Boolean(resultId) && resultId !== view.runId;

  useEffect(() => {
    if (!resultId || resultId === view.runId) return;
    load(resultId).catch(() => closeResult());
    // Only re-run when the requested id changes; `view.runId` catching up must not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]);

  const run = () => void start(goal.trim(), settings.provider, apiKey);

  const agent = selectedAgent != null ? view.agents.find((a) => a.position === selectedAgent) : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-6 pt-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Multi-Agent Orchestrator</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">One orchestrator plans, several agents work in parallel, one merged result.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderBadge provider={settings.provider} hasKey={Boolean(apiKey)} />
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="rounded-full ps-2.5 pe-3 shadow-(--shadow-border)">
            <KeyRound strokeWidth={2} /> {apiKey ? "Update API key" : "Add API key"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)} className="rounded-full ps-2.5 pe-3 shadow-(--shadow-border)">
            <History strokeWidth={2} /> History
          </Button>
        </div>
      </header>

      {dbError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-900">
          Database is not reachable: {dbError}. Check DATABASE_URL in .env.local and run <code>npm run db:push</code>.
        </div>
      )}

      <GoalForm goal={goal} onGoalChange={setGoal} onRun={run} onCancel={cancel} running={isActive} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="flex h-[600px] flex-col gap-0 overflow-hidden p-0 shadow-(--shadow-border) ring-0">
          <StatusStrip view={view} onShowResult={() => view.runId && showResult(view.runId)} />
          <div className="min-h-0 flex-1 bg-[radial-gradient(ellipse_at_top,oklch(0.985_0.002_250),oklch(0.97_0.003_250))]">
            <PipelineCanvas view={view} onSelectAgent={setSelectedAgent} />
          </div>
        </Card>
        <Card className="flex h-[600px] flex-col gap-0 overflow-hidden p-0 shadow-(--shadow-border) ring-0">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
            Activity
            {view.log.length > 0 && <span className="rounded-full bg-muted px-1.5 font-mono text-[10px] tabular-nums">{view.log.length}</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ActivityLog entries={view.log} />
          </div>
        </Card>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSave={save} />
      <RunHistory open={historyOpen} onOpenChange={setHistoryOpen} initialRuns={initialRuns} onSelect={showResult} />
      <ResultModal open={Boolean(resultId)} onClose={closeResult} view={view} loading={loadingResult} />

      <Dialog open={agent != null} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          {agent && (
            <>
              <DialogHeader>
                <DialogTitle>{agent.role}</DialogTitle>
                <DialogDescription>{agent.title}</DialogDescription>
              </DialogHeader>
              {agent.error ? (
                <p className="text-sm text-destructive">{agent.error}</p>
              ) : agent.output ? (
                <Markdown>{agent.output}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">No output yet.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
