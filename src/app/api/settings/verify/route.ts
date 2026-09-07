import { generateText } from "ai";
import { getModel } from "@/lib/agents/client";
import { isProviderId, PROVIDERS } from "@/lib/providers";
import { API_KEY_HEADER } from "@/lib/runs";

/** Makes one tiny call with the given key so the Settings dialog can show a tick or an error. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { provider?: unknown } | null;
  const provider = body?.provider;
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();

  if (!isProviderId(provider)) return Response.json({ ok: false, error: "Unknown provider." }, { status: 400 });
  if (!apiKey) return Response.json({ ok: false, error: "Paste an API key first." }, { status: 400 });

  try {
    const handle = getModel(provider, apiKey);
    await generateText({
      model: handle.model,
      prompt: "Reply with the single word OK.",
      maxOutputTokens: 16,
      providerOptions: handle.providerOptions,
    });
    return Response.json({ ok: true, model: PROVIDERS[provider].model });
  } catch (err) {
    return Response.json({ ok: false, error: friendlyError(err) });
  }
}

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (/401|403|invalid.*key|unauthori[sz]ed|permission/i.test(message)) return "The key was rejected by the vendor.";
  if (/429|quota|rate limit|billing|insufficient/i.test(message)) return "The key works but the account has no quota or credit.";
  return message.slice(0, 200);
}
