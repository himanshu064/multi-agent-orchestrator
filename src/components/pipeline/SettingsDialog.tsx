"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { PROVIDER_IDS, PROVIDERS, type ProviderId } from "@/lib/providers";
import { API_KEY_HEADER } from "@/lib/runs";
import type { Settings } from "./useSettings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (next: Settings) => void;
};

type Check =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "error"; message: string };

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Keyed on `open` so the form starts fresh from saved settings every time. */}
        <SettingsForm
          key={String(open)}
          settings={settings}
          onSave={onSave}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({
  settings,
  onSave,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [provider, setProvider] = useState<ProviderId>(settings.provider);
  const [key, setKey] = useState(settings.keys[settings.provider] ?? "");
  const [check, setCheck] = useState<Check>({ state: "idle" });

  const choose = (id: ProviderId) => {
    setProvider(id);
    setKey(settings.keys[id] ?? "");
    setCheck({ state: "idle" });
  };

  const verifyAndSave = async () => {
    setCheck({ state: "checking" });
    try {
      const res = await fetch("/api/settings/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [API_KEY_HEADER]: key.trim(),
        },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setCheck({
          state: "error",
          message: data.error ?? "The key could not be verified.",
        });
        return;
      }
      setCheck({ state: "ok" });
      onSave({ provider, keys: { ...settings.keys, [provider]: key.trim() } });
      setTimeout(onClose, 600);
    } catch {
      setCheck({ state: "error", message: "Could not reach the server." });
    }
  };

  const info = PROVIDERS[provider];

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI vendor and API key</DialogTitle>
        <DialogDescription>
          Every run uses the cheapest model of the chosen vendor. The key stays
          in this browser and is sent only with your own runs.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-2">
        {PROVIDER_IDS.map((id) => {
          const p = PROVIDERS[id];
          const selected = id === provider;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                selected && "border-primary bg-accent ring-1 ring-primary",
              )}
            >
              <div className="text-sm font-medium">{p.name}</div>
              <code className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">
                {p.model}
              </code>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatPrice(p.pricing.input)} in /{" "}
                {formatPrice(p.pricing.output)} out
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                cheapest tier
              </div>
              {settings.keys[id] && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  key saved
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key">{info.name} API key</Label>
        <Input
          id="api-key"
          type="password"
          autoComplete="off"
          placeholder={info.keyHint}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setCheck({ state: "idle" });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the {info.envKey} value from the server&apos;s
          .env.local, if one is set.
        </p>
        {check.state === "ok" && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> Key works. Saved.
          </p>
        )}
        {check.state === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <XCircle className="size-4" /> {check.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onSave({ provider, keys: settings.keys });
            onClose();
          }}
        >
          Use {info.name} without a key
        </Button>
        <Button
          onClick={verifyAndSave}
          disabled={!key.trim() || check.state === "checking"}
        >
          {check.state === "checking" && <Loader2 className="animate-spin" />}
          Verify and save
        </Button>
      </DialogFooter>
    </>
  );
}
