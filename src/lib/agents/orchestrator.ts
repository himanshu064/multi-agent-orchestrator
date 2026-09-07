import { generateObject } from "ai";
import { z } from "zod";
import { cachedInstructions, toUsage, type ModelHandle } from "./client";

const ORCHESTRATOR_SYSTEM = `You are the orchestrator of a small team of AI specialists.
Split the user's goal into 2 to 5 independent tasks that can be done at the same time by different specialists.
Each task needs a distinct role (a short job title such as "Market Researcher"), a one-line title, and clear, detailed instructions that a specialist can complete on their own without seeing the other tasks.
Do not include a task that merges or summarises the others; a separate editor does that later.`;

const PlanSchema = z.object({
  tasks: z.array(
    z.object({
      role: z.string().describe("Short job title for the specialist"),
      title: z.string().describe("One-line description of the task"),
      instructions: z.string().describe("Detailed instructions for the specialist"),
    }),
  ),
});

export type PlanTask = z.infer<typeof PlanSchema>["tasks"][number];

export async function planTasks(handle: ModelHandle, goal: string, abortSignal?: AbortSignal) {
  const { object, usage } = await generateObject({
    model: handle.model,
    schema: PlanSchema,
    instructions: cachedInstructions(ORCHESTRATOR_SYSTEM),
    prompt: goal,
    providerOptions: handle.providerOptions,
    abortSignal,
  });
  const tasks = object.tasks.slice(0, 5);
  if (tasks.length < 2) throw new Error("Orchestrator returned fewer than two tasks.");
  return { tasks, usage: toUsage(usage) };
}
