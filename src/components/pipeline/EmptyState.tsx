const STEPS = ["Pick a goal or write your own", "Press Run pipeline", "Watch the agents work in parallel"];

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="p-5">
      <p className="text-sm font-medium">{title}</p>
      <ol className="mt-3 space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] text-foreground/70">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
