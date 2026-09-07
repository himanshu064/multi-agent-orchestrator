import { streamText } from "ai";
import { cachedInstructions, toUsage, type ModelHandle } from "./client";

const MAX_AGENT_TOKENS = 1800;

export async function runAgent(
  handle: ModelHandle,
  task: { role: string; instructions: string },
  onDelta: (text: string) => void,
  abortSignal?: AbortSignal,
) {
  const result = streamText({
    model: handle.model,
    instructions: cachedInstructions(
      `You are the ${task.role}. Complete only your assigned task. Be concise and concrete. Use short markdown headings and bullet points. Keep the whole answer under 350 words and finish with a complete sentence.`,
    ),
    prompt: task.instructions,
    maxOutputTokens: MAX_AGENT_TOKENS,
    providerOptions: handle.providerOptions,
    abortSignal,
  });
  for await (const chunk of result.textStream) onDelta(chunk);
  return { text: await result.text, usage: toUsage(await result.usage) };
}
