const ALLOWED_KEYS = new Set([
  "event",
  "intentId",
  "slug",
  "network",
  "expectedAmount",
  "signaturePrefix6",
  "errorCode",
  "reason",
  "creatorDeltaMicro",
  "platformDeltaMicro",
  "ts",
  "plan",
  "creatorId",
]);

export function event(name: string, payload: Record<string, unknown>): void {
  const safe: Record<string, unknown> = {
    event: name,
    ts: new Date().toISOString(),
  };
  for (const [k, v] of Object.entries(payload)) {
    if (ALLOWED_KEYS.has(k) && v !== undefined && v !== null) {
      safe[k] = v;
    }
  }
  // Use console.info so Vercel collects without surfacing as warnings
  console.info(JSON.stringify(safe));
}

export function sigPrefix6(sig: string): string {
  return sig.slice(0, 6);
}
