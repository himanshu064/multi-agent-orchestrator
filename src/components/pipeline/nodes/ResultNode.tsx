import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Check, Loader2, Trophy } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export type ResultStatus = "waiting" | "working" | "done" | "failed";
export type ResultNodeType = Node<{ status: ResultStatus }, "result">;

export const ResultNode = memo(
  function ResultNode({ data }: NodeProps<ResultNodeType>) {
  const { status } = data;
  return (
    <div className="relative flex size-32 items-center justify-center">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div
        className={cn(
          "absolute inset-4 rotate-45 rounded-lg border-2 bg-sky-50 transition-[border-color,box-shadow,opacity] duration-300 ease-out",
          status === "waiting" && "border-dashed border-sky-200 opacity-70",
          status === "working" && "border-sky-500 shadow-[0_0_0_8px_oklch(0.685_0.169_237/0.12)]",
          status === "done" && "border-sky-500",
          status === "failed" && "border-red-400",
        )}
      />
      <div className="relative flex flex-col items-center gap-1 text-sky-600">
        {status === "working" ? <Loader2 className="size-6 animate-spin" strokeWidth={2} /> : <Trophy className="size-6" strokeWidth={2} />}
        <span className="text-sm font-semibold">Result</span>
      </div>
      {status === "done" && (
        <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </div>
  );
},
  (prev, next) => prev.data.status === next.data.status,
);
