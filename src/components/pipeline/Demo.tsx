"use client";

import { History, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProviderId } from "@/lib/providers";
import type { RunSummary } from "@/lib/runs";
import { ActivityLog } from "./ActivityLog";
import { AgentDialog } from "./AgentDialog";
import { GoalForm } from "./GoalForm";
import { PipelineCanvas } from "./PipelineCanvas";
import { ProviderBadge } from "./ProviderBadge";
import { ResultModal } from "./ResultModal";
import { RunHistory } from "./RunHistory";
import { SettingsDialog } from "./SettingsDialog";
import { StatusStrip } from "./StatusStrip";
import { summarize, useRun } from "./useRun";
import { useSettings } from "./useSettings";

type Props = { initialRuns: RunSummary[]; dbError: string | null; envKeys: ProviderId[] };

export function Demo({ initialRuns, dbError, envKeys }: Props) {
  const { settings, save, apiKey } = useSettings();
  const hasEnvKey = envKeys.includes(settings.provider);
  const { view, start, load, cancel, isActive } = useRun();
  const [goal, setGoal] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  // ?result=<runId> opens the full-screen result, so a link can reach it directly.
  const router = useRouter();
  const resultId = useSearchParams().get("result");
  const showResult = useCallback((id: string) => router.replace(`?result=${id}`, { scroll: false }), [router]);
  const closeResult = useCallback(() => router.replace("/", { scroll: false }), [router]);

  // The requested run is still loading until the view catches up with it.
  const loadingResult = Boolean(resultId) && resultId !== view.runId;
  const loadingId = useRef<string | null>(null);

  useEffect(() => {
    if (!resultId || resultId === view.runId || loadingId.current === resultId) return;
    loadingId.current = resultId;
    load(resultId)
      .catch(closeResult)
      .finally(() => {
        if (loadingId.current === resultId) loadingId.current = null;
      });
  }, [resultId, view.runId, load, closeResult]);

  const run = () => void start(goal.trim(), settings.provider, apiKey);
  const showCurrentResult = useCallback(() => {
    if (view.runId) showResult(view.runId);
  }, [view.runId, showResult]);
  const closeAgent = useCallback(() => setSelectedAgent(null), []);

  const agent = selectedAgent != null ? view.agents.find((a) => a.position === selectedAgent) : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-6 pt-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Multi-Agent Orchestrator</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">One orchestrator plans, several agents work in parallel, one merged result.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderBadge provider={settings.provider} hasKey={Boolean(apiKey) || hasEnvKey} />
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
          Database is not reachable: {dbError}. Check DATABASE_URL in .env or .env.local and run <code>npm run db:push</code>.
        </div>
      )}

      <GoalForm goal={goal} onGoalChange={setGoal} onRun={run} onCancel={cancel} running={isActive} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="flex h-[600px] flex-col gap-0 overflow-hidden p-0 shadow-(--shadow-border) ring-0">
          <StatusStrip {...summarize(view)} onShowResult={showCurrentResult} />
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

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSave={save} envKeys={envKeys} />
      <RunHistory open={historyOpen} onOpenChange={setHistoryOpen} initialRuns={initialRuns} onSelect={showResult} />
      <ResultModal open={Boolean(resultId)} onClose={closeResult} view={view} loading={loadingResult} />

      <AgentDialog agent={agent} onClose={closeAgent} />
    </div>
  );
}
