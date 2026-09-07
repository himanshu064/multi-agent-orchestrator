"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isProviderId, type ProviderId } from "@/lib/providers";

export type Settings = {
  provider: ProviderId;
  keys: Partial<Record<ProviderId, string>>;
};

const STORAGE_KEY = "multi-agent-demo.settings";
// Bump when the stored shape changes; older data is discarded instead of misread.
const STORAGE_VERSION = 1;
const DEFAULT_SETTINGS: Settings = { provider: "openai", keys: {} };

type Stored = Settings & { v: number };

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<Stored>;
    if (value.v !== STORAGE_VERSION) return DEFAULT_SETTINGS;
    return {
      provider: isProviderId(value.provider) ? value.provider : DEFAULT_SETTINGS.provider,
      keys: value.keys ?? {},
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Vendor choice and API keys, kept only in this browser. */
export function useSettings() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const settings = useMemo(() => parse(raw), [raw]);

  const save = useCallback((next: Settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, ...next } satisfies Stored));
    } catch {
      // Private mode or storage blocked; the choice lasts for this page only.
    }
    listeners.forEach((l) => l());
  }, []);

  return { settings, save, apiKey: settings.keys[settings.provider] ?? "" };
}
