import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { PROVIDERS, type ProviderId } from "@/lib/providers";

export function ProviderBadge({ provider, hasKey }: { provider: ProviderId; hasKey: boolean }) {
  const { name, model, pricing } = PROVIDERS[provider];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{name}</span>
      <span aria-hidden>·</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{model}</code>
      <span aria-hidden>·</span>
      <span>
        {formatPrice(pricing.input)} in / {formatPrice(pricing.output)} out per 1M tokens
      </span>
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
        cheapest tier
      </Badge>
      {!hasKey && <Badge variant="outline">no key saved</Badge>}
    </div>
  );
}
