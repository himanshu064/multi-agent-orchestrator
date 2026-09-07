import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Check, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrchestratorStatus = "waiting" | "working" | "done";
export type OrchestratorNodeType = Node<{ status: OrchestratorStatus }, "orchestrator">;

export function OrchestratorNode({ data }: NodeProps<OrchestratorNodeType>) {
  const { status } = data;
  return (
    <div
      className={cn(
        "relative flex size-32 flex-col items-center justify-center gap-1.5 rounded-full border-2 bg-red-50 text-red-600 transition-[border-color,box-shadow,opacity] duration-300 ease-out",
        status === "waiting" && "border-dashed border-red-200 opacity-70",
        status === "working" && "border-red-500 shadow-[0_0_0_8px_oklch(0.637_0.237_25/0.12)]",
        status === "done" && "border-red-500",
      )}
    >
      {status === "working" ? <Loader2 className="size-7 animate-spin" strokeWidth={2} /> : <Network className="size-7" strokeWidth={2} />}
      <span className="text-sm font-semibold">Orchestrator</span>
      {status === "done" && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
