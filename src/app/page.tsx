import { Suspense } from "react";
import { Demo } from "@/components/pipeline/Demo";
import { listRecentRuns } from "@/lib/db/queries";
import { providersWithEnvKey } from "@/lib/providers";
import type { RunSummary } from "@/lib/runs";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialRuns: RunSummary[] = [];
  let dbError: string | null = null;
  try {
    initialRuns = await listRecentRuns();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }
  return (
    <Suspense>
      <Demo initialRuns={initialRuns} dbError={dbError} envKeys={providersWithEnvKey()} />
    </Suspense>
  );
}
