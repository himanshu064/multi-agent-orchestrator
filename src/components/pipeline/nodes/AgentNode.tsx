import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { AlertCircle, Bot, CheckCircle2, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentView } from "../useRun";

export type AgentNodeType = Node<{ agent: AgentView }, "agent">;

export const AGENT_NODE_WIDTH = 224;

export function AgentNode({ data }: NodeProps<AgentNodeType>) {
  const { agent } = data;
  const { status } = agent;
  return (
    <div
      style={{ width: AGENT_NODE_WIDTH }}
      className={cn(
        "cursor-pointer rounded-xl border bg-muted/70 p-3 text-left shadow-sm transition-all hover:shadow-md",
        status === "pending" && "opacity-60",
        status === "running" && "animate-pulse border-amber-400 ring-2 ring-amber-200",
        status === "completed" && "border-emerald-500",
        status === "failed" && "border-red-500",
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{agent.role}</div>
          <div className="line-clamp-1 text-[11px] text-muted-foreground">{agent.title}</div>
        </div>
        <Bot className="size-6 shrink-0 text-foreground/80" />
      </div>
      <div className="mt-2 h-8 overflow-hidden text-[11px] leading-4 text-muted-foreground">
        {agent.output ? (
          <p className="line-clamp-2 whitespace-pre-wrap">{agent.output.slice(-240)}</p>
        ) : (
          <p className="italic">{status === "pending" ? "Waiting for assignment" : status === "running" ? "Thinking..." : ""}</p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1">
          {status === "running" && <Loader2 className="size-3.5 animate-spin text-amber-600" />}
          {status === "completed" && <CheckCircle2 className="size-3.5 text-emerald-600" />}
          {status === "failed" && <AlertCircle className="size-3.5 text-red-600" />}
          <span className="capitalize text-muted-foreground">{status === "pending" ? "waiting" : status === "running" ? "working" : status}</span>
        </span>
        {agent.durationMs != null && <span className="font-mono text-muted-foreground">{formatDuration(agent.durationMs)}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
