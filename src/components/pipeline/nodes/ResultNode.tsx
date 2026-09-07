import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResultStatus = "waiting" | "working" | "done" | "failed";
export type ResultNodeType = Node<{ status: ResultStatus }, "result">;

export function ResultNode({ data }: NodeProps<ResultNodeType>) {
  const { status } = data;
  return (
    <div className="relative flex size-32 items-center justify-center">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div
        className={cn(
          "absolute inset-3 rotate-45 rounded-md border-2 border-dashed bg-card transition-all",
          status === "waiting" && "border-sky-200 opacity-60",
          status === "working" && "animate-pulse border-sky-500 shadow-lg shadow-sky-100",
          status === "done" && "border-solid border-sky-500",
          status === "failed" && "border-solid border-red-400",
        )}
      />
      <div className="relative flex flex-col items-center gap-1 text-sky-600">
        {status === "working" ? <Loader2 className="size-6 animate-spin" /> : <Trophy className="size-6" />}
        <span className="text-sm font-semibold">Result</span>
      </div>
      {status === "done" && <CheckCircle2 className="absolute right-1 top-1 size-6 rounded-full bg-card text-emerald-600" />}
    </div>
  );
}
