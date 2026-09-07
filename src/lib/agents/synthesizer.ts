import { streamText } from "ai";
import { cachedInstructions, toUsage, type ModelHandle } from "./client";

const MAX_RESULT_TOKENS = 2500;

const SYNTHESIZER_SYSTEM = `You are the editor of a small team of AI specialists.
You receive the original goal and the work of each specialist, labelled by role.
Write one polished, well-structured answer in markdown that fully addresses the goal.
Merge overlapping points, keep the strongest material, and do not mention the specialists or the process.`;

export async function synthesize(
  handle: ModelHandle,
  goal: string,
  outputs: { role: string; text: string }[],
  onDelta: (text: string) => void,
  abortSignal?: AbortSignal,
) {
  const prompt = [
    `# Goal\n${goal}`,
    ...outputs.map((o) => `# ${o.role}\n${o.text}`),
  ].join("\n\n");

  const result = streamText({
    model: handle.model,
    instructions: cachedInstructions(SYNTHESIZER_SYSTEM),
    prompt,
    maxOutputTokens: MAX_RESULT_TOKENS,
    providerOptions: handle.providerOptions,
    abortSignal,
  });
  for await (const chunk of result.textStream) onDelta(chunk);
  return { text: await result.text, usage: toUsage(await result.usage) };
}
