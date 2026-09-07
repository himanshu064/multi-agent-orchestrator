"use client";

import { Check, Link2, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatCost, formatDuration, formatTokens } from "@/lib/format";
import { PROVIDERS } from "@/lib/providers";
import { Markdown } from "./Markdown";
import type { RunView } from "./useRun";

type Props = { open: boolean; onClose: () => void; view: RunView; loading: boolean };

export function ResultModal({ open, onClose, view, loading }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the address bar still has the link.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
      >
        <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold">{view.goal || "Result"}</DialogTitle>
            <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {view.provider && (
                <span>
                  {PROVIDERS[view.provider].name} · <code className="font-mono">{view.model}</code>
                </span>
              )}
              {view.durationMs != null && <span>{formatDuration(view.durationMs)}</span>}
              {view.status === "completed" && (
                <span>
                  {formatTokens(view.inputTokens)} in / {formatTokens(view.outputTokens)} out tokens
                </span>
              )}
              {view.cost != null && <span className="font-medium text-emerald-700">{formatCost(view.cost)}</span>}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyLink} className="ps-2.5 pe-3">
              {copied ? <Check className="text-emerald-600" /> : <Link2 />} {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close result">
              <X />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-6 py-8">
          <article className="mx-auto max-w-3xl rounded-2xl bg-card p-8 shadow-(--shadow-border)">
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading run
              </p>
            ) : view.result ? (
              <Markdown>{view.result}</Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">
                {view.status === "failed" ? (view.error ?? "This run failed.") : "This run has no result yet."}
              </p>
            )}
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
