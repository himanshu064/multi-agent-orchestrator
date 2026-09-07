export function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatCost(usd: number) {
  return usd < 0.0001 ? "< $0.0001" : `$${usd.toFixed(4)}`;
}

export function formatTokens(n: number) {
  return n.toLocaleString("en-US");
}

export function formatPrice(perMillion: number) {
  return `$${perMillion.toFixed(2)}`;
}
