import { desc } from "drizzle-orm";
import { resolveApiKey } from "@/lib/agents/client";
import { runPipeline } from "@/lib/agents/pipeline";
import { encodeEvent, SSE_HEADERS } from "@/lib/agents/sse";
import { getDb } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { isProviderId, PROVIDERS } from "@/lib/providers";
import { API_KEY_HEADER, toRunSummary } from "@/lib/runs";

const HISTORY_LIMIT = 20;

/** Starts a run and streams its events as Server-Sent Events until it ends. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { goal?: unknown; provider?: unknown } | null;
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  const provider = body?.provider;

  if (!goal) return Response.json({ error: "Goal is required." }, { status: 400 });
  if (!isProviderId(provider)) return Response.json({ error: "Unknown provider." }, { status: 400 });

  const apiKey = resolveApiKey(provider, request.headers.get(API_KEY_HEADER));
  if (!apiKey) {
    return Response.json(
      { error: `No API key for ${PROVIDERS[provider].name}. Add one in Settings.` },
      { status: 400 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      runPipeline({ goal, provider, apiKey, signal: request.signal }, (event) => {
        try {
          controller.enqueue(encodeEvent(event));
        } catch {
          // The browser went away; the pipeline keeps going and the run is still saved.
        }
      })
        .catch((err) => controller.error(err))
        .finally(() => {
          try {
            controller.close();
          } catch {
            // Already closed.
          }
        });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

/** Recent runs for the history drawer. */
export async function GET() {
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

  return Response.json(rows.map(toRunSummary));
}
