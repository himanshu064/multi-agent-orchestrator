import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { AlertCircle, Bot, Check } from "lucide-react";
import { memo } from "react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentView } from "../useRun";

/** The agent view is the node data itself, so an unchanged agent keeps the same reference. */
export type AgentNodeType = Node<AgentView, "agent">;

export const AGENT_NODE_WIDTH = 232;

const BAR: Record<AgentView["status"], string> = {
  pending: "bg-neutral-300",
  running: "bg-amber-400",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

const LABEL: Record<AgentView["status"], string> = {
  pending: "Waiting",
  running: "Working",
  completed: "Done",
  failed: "Failed",
};

export const AgentNode = memo(function AgentNode({ data: agent }: NodeProps<AgentNodeType>) {
  const { status } = agent;
  return (
    <div
      style={{ width: AGENT_NODE_WIDTH }}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl bg-card p-3 ps-4 text-left shadow-(--shadow-border) transition-[box-shadow,opacity] duration-300 ease-out hover:shadow-(--shadow-border-hover)",
        status === "pending" && "opacity-70",
        status === "running" && "shadow-[0_0_0_1px_oklch(0.769_0.188_70/0.6),0_0_0_6px_oklch(0.769_0.188_70/0.12)]",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", BAR[status])} />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{agent.role}</div>
          <div className="line-clamp-1 text-[11px] text-muted-foreground">{agent.title}</div>
        </div>
        <Bot className="size-5 shrink-0 text-foreground/70" strokeWidth={2} />
      </div>
      <div className="mt-2 h-8 overflow-hidden text-[11px] leading-4 text-muted-foreground">
        {agent.output ? (
          <p className="line-clamp-2 whitespace-pre-wrap">{agent.output.slice(-240)}</p>
        ) : (
          <p className="italic">{status === "pending" ? "Waiting for a task" : status === "running" ? "Thinking..." : ""}</p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {status === "running" && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
          )}
          {status === "completed" && <Check className="size-3.5 text-emerald-600" strokeWidth={2.5} />}
          {status === "failed" && <AlertCircle className="size-3.5 text-red-600" strokeWidth={2.5} />}
          {status === "pending" && <span className="size-2 rounded-full bg-neutral-300" />}
          <span className={cn(status === "pending" ? "text-muted-foreground" : "text-foreground")}>{LABEL[status]}</span>
        </span>
        {agent.durationMs != null && <span className="font-mono tabular-nums text-muted-foreground">{formatDuration(agent.durationMs)}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
});
