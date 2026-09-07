"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Markdown } from "./Markdown";
import type { AgentView } from "./useRun";

type Props = { agent: AgentView | undefined; onClose: () => void };

export function AgentDialog({ agent, onClose }: Props) {
  return (
    <Dialog open={agent != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        {agent ? (
          <>
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>{agent.role}</DialogTitle>
              <DialogDescription>{agent.title}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {agent.error ? (
                <p className="text-sm text-destructive">{agent.error}</p>
              ) : agent.output ? (
                <Markdown>{agent.output}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">No output yet.</p>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
