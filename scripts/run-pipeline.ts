// Runs one pipeline from the terminal and prints every event.
// Usage: npm run pipeline -- openai "Write a short market report on electric scooters in India"
import { resolveApiKey } from "@/lib/agents/client";
import { runPipeline } from "@/lib/agents/pipeline";
import { isProviderId } from "@/lib/providers";

async function main() {
  const [provider, ...goalParts] = process.argv.slice(2);
  const goal = goalParts.join(" ");

  if (!isProviderId(provider) || !goal) {
    console.error('Usage: npm run pipeline -- <openai|google|anthropic> "<goal>"');
    process.exit(1);
  }

  const apiKey = resolveApiKey(provider, null);
  if (!apiKey) {
    console.error(`No API key for ${provider} in .env or .env.local.`);
    process.exit(1);
  }

  await runPipeline({ goal, provider, apiKey }, (event) => {
    if (event.type === "agent_delta" || event.type === "synthesis_delta") {
      process.stdout.write(event.text);
      return;
    }
    const details = JSON.stringify(event, (key, value) =>
      key === "runId" || key === "at" || key === "type" ? undefined : value,
    );
    console.log(`\n[${event.at.slice(11, 23)}] ${event.type}`, details.slice(0, 300));
  });
  process.exit(0);
}

void main();
