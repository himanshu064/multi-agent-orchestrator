"use client";

import { CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react";
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
  /** Vendors whose key is set on the server, so they can be used without pasting one. */
  envKeys: ProviderId[];
};

type Check =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "cleared" }
  | { state: "error"; message: string };

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  envKeys,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Keyed on `open` so the form starts fresh from saved settings every time. */}
        <SettingsForm
          key={String(open)}
          settings={settings}
          envKeys={envKeys}
          onSave={onSave}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function SettingsForm({
  settings,
  envKeys,
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

  const clearKey = () => {
    const keys = { ...settings.keys };
    delete keys[provider];
    onSave({ provider, keys });
    setKey("");
    setCheck({ state: "cleared" });
  };

  const info = PROVIDERS[provider];
  const hasSavedKey = Boolean(settings.keys[provider]);
  const hasEnvKey = envKeys.includes(provider);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add or update your API key</DialogTitle>
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
        {hasEnvKey ? (
          <p className="text-xs text-muted-foreground">
            The server has a {info.name} key in its env, so you can also use it without pasting one.
          </p>
        ) : null}
        {check.state === "ok" && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> Key works. Saved.
          </p>
        )}
        {check.state === "cleared" && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" /> Key removed from this browser.
          </p>
        )}
        {check.state === "error" && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <XCircle className="size-4" /> {check.message}
          </p>
        )}
      </div>

      <DialogFooter className="sm:justify-between">
        <div>
          {hasSavedKey && (
            <Button variant="ghost" size="sm" onClick={clearKey} className="text-destructive hover:text-destructive">
              <Trash2 /> Clear key
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {hasEnvKey ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSave({ provider, keys: settings.keys });
                onClose();
              }}
            >
              Use without key
            </Button>
          ) : null}
          <Button size="sm" onClick={verifyAndSave} disabled={!key.trim() || check.state === "checking"}>
            {check.state === "checking" && <Loader2 className="animate-spin" />}
            Save key
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
