import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { base64urlEncode, parsePaymentHeader } from "../lib/x402";
import { buildMemoInstruction, paymentMemoForIntent } from "../lib/payment-memo";

const intentId = "intent_smoke_123";
const header = base64urlEncode(
  JSON.stringify({
    scheme: "exact-veloran",
    network: "solana-devnet",
    txSignature: "5".repeat(88),
    payerAddress: "11111111111111111111111111111111",
    intentId,
  })
);

const parsed = parsePaymentHeader(header);
assert.equal(parsed?.intentId, intentId);
assert.equal(paymentMemoForIntent(intentId), `veloran:intent:${intentId}`);
assert.equal(
  buildMemoInstruction("veloran:intent:nonce_from_server").data.toString("utf8"),
  "veloran:intent:nonce_from_server"
);

const schema = readFileSync("prisma/schema.prisma", "utf8");
assert.match(schema, /model PaymentIntent/);
assert.match(schema, /model PaymentReceipt/);
assert.match(schema, /txSignature\s+String\s+@unique/);

const unlockRoute = readFileSync("app/api/unlock/[slug]/route.ts", "utf8");
assert.match(unlockRoute, /paymentReceipt\.findUnique/);
assert.match(unlockRoute, /Payment signature already consumed/);
assert.match(unlockRoute, /expectedMemo: intent\.memo/);

const x402Route = readFileSync("app/api/x402/[slug]/route.ts", "utf8");
assert.match(x402Route, /Missing payment intent ID/);
assert.match(x402Route, /paymentReceipt\.create/);
assert.match(x402Route, /consumedAt: new Date\(\)/);

const aiReader = readFileSync("scripts/ai-reader.ts", "utf8");
assert.match(aiReader, /buildMemoInstruction\(reqs\.extra\.memo\)/);

const paywallGate = readFileSync("components/PaywallGate.tsx", "utf8");
assert.match(paywallGate, /buildMemoInstruction\(intent\.memo\)/);

console.log("payment safety smoke: ok");
