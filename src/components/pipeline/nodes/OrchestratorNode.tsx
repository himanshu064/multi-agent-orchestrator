import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrchestratorStatus = "waiting" | "working" | "done";
export type OrchestratorNodeType = Node<{ status: OrchestratorStatus }, "orchestrator">;

export function OrchestratorNode({ data }: NodeProps<OrchestratorNodeType>) {
  const { status } = data;
  return (
    <div
      className={cn(
        "flex size-32 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed bg-card text-red-600 transition-all",
        status === "waiting" && "border-red-200 opacity-60",
        status === "working" && "animate-pulse border-red-500 shadow-lg shadow-red-100",
        status === "done" && "border-solid border-red-500",
      )}
    >
      {status === "working" ? <Loader2 className="size-7 animate-spin" /> : <Network className="size-7" />}
      <span className="text-sm font-semibold">Orchestrator</span>
      {status === "done" && <CheckCircle2 className="absolute -right-1 -top-1 size-6 rounded-full bg-card text-emerald-600" />}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
