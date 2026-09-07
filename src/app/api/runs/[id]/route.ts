import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { agentTasks, events, runs } from "@/lib/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One run with its tasks and stored events, used to replay a past run. */
export async function GET(_request: Request, ctx: RouteContext<"/api/runs/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "Run not found." }, { status: 404 });

  const db = getDb();
  const [run, tasks, log] = await Promise.all([
    db.query.runs.findFirst({ where: eq(runs.id, id) }),
    db.select().from(agentTasks).where(eq(agentTasks.runId, id)).orderBy(asc(agentTasks.position)),
    db.select().from(events).where(eq(events.runId, id)).orderBy(asc(events.seq)),
  ]);
  if (!run) return Response.json({ error: "Run not found." }, { status: 404 });

  return Response.json({ run, tasks, events: log });
}
