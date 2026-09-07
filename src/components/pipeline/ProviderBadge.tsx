import { formatPrice } from "@/lib/format";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ProviderBadge({ provider, hasKey }: { provider: ProviderId; hasKey: boolean }) {
  const { name, model, pricing } = PROVIDERS[provider];
  return (
    <div className="inline-flex h-8 items-center gap-2.5 rounded-full bg-card ps-3 pe-3.5 text-xs shadow-(--shadow-border)">
      <span className="relative flex size-2">
        <span className={cn("absolute inline-flex size-full rounded-full opacity-60", hasKey ? "animate-ping bg-emerald-400" : "bg-amber-400")} />
        <span className={cn("relative inline-flex size-2 rounded-full", hasKey ? "bg-emerald-500" : "bg-amber-500")} />
      </span>
      <span className="font-medium">
        {name} <span className="text-muted-foreground">·</span> <code className="font-mono text-[11px]">{model}</code>
      </span>
      <span className="hidden text-muted-foreground xl:inline">
        {formatPrice(pricing.input)} in / {formatPrice(pricing.output)} out per 1M
      </span>
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        cheapest tier
      </span>
    </div>
  );
}
