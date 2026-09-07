import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const RUN_STATUSES = [
  "planning",
  "running",
  "synthesizing",
  "completed",
  "failed",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const TASK_STATUSES = ["pending", "running", "completed", "failed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
};

export const runs = pgTable("runs", {
  id: uuid().primaryKey().defaultRandom(),
  goal: text().notNull(),
  status: text().$type<RunStatus>().notNull().default("planning"),
  provider: text().notNull(),
  model: text().notNull(),
  result: text(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  error: text(),
  ...timestamps,
});

export const agentTasks = pgTable(
  "agent_tasks",
  {
    id: uuid().primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    role: text().notNull(),
    title: text().notNull(),
    instructions: text().notNull(),
    status: text().$type<TaskStatus>().notNull().default("pending"),
    output: text(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    error: text(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("agent_tasks_run_idx").on(t.runId, t.position)],
);

export const events = pgTable(
  "events",
  {
    id: serial().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    seq: integer().notNull(),
    type: text().notNull(),
    payload: jsonb().notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_run_seq_idx").on(t.runId, t.seq)],
);

export type Run = typeof runs.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;
export type StoredEvent = typeof events.$inferSelect;
