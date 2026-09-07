import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { toRunSummary } from "@/lib/runs";

const HISTORY_LIMIT = 20;

export async function listRecentRuns() {
  const rows = await getDb()
    .select({
      id: runs.id,
      goal: runs.goal,
      status: runs.status,
      provider: runs.provider,
      model: runs.model,
      inputTokens: runs.inputTokens,
      outputTokens: runs.outputTokens,
      createdAt: runs.createdAt,
      completedAt: runs.completedAt,
    })
    .from(runs)
    .orderBy(desc(runs.createdAt))
    .limit(HISTORY_LIMIT);
  return rows.map(toRunSummary);
}
