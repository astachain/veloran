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

const solanaConfig = readFileSync("lib/solana.ts", "utf8");
assert.match(solanaConfig, /Refusing to boot: NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta/);
assert.match(solanaConfig, /DEVNET_USDC_MINT/);
assert.match(solanaConfig, /SERVER_SOLANA_RPC_URL/);

const networkHelper = readFileSync("lib/network.ts", "utf8");
assert.match(networkHelper, /solscanTxUrl/);
assert.match(networkHelper, /solscanAccountUrl/);

const paymentIntents = readFileSync("lib/payment-intents.ts", "utf8");
assert.match(paymentIntents, /createSubscriptionIntent/);
assert.match(paymentIntents, /getUsableSubscriptionIntent/);

const subscribeBtn = readFileSync("components/SubscribeButton.tsx", "utf8");
assert.match(subscribeBtn, /buildMemoInstruction\(memo\)/);

const subRoute = readFileSync("app/api/subscriptions/\[creatorId\]/route.ts", "utf8");
assert.match(subRoute, /expectedMemo: intent\.memo/);
assert.match(subRoute, /subscriptionPaymentIntent\.update/);
assert.match(subRoute, /consumedAt: new Date\(\)/);

assert.match(schema, /model SubscriptionPaymentIntent/);

if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta") {
  assert.notEqual(
    process.env.NEXT_PUBLIC_USDC_MINT,
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "config: mainnet env must not use devnet USDC mint"
  );
  assert.notEqual(
    process.env.NEXT_PUBLIC_VELORAN_PROGRAM_ID,
    "2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS",
    "config: mainnet env must not use devnet Veloran program"
  );
  assert.notEqual(
    process.env.NEXT_PUBLIC_VELORAN_TREASURY,
    "DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP",
    "config: mainnet env must not use devnet treasury"
  );
  assert.ok(
    process.env.SERVER_SOLANA_RPC_URL &&
      !process.env.SERVER_SOLANA_RPC_URL.toLowerCase().includes("devnet"),
    "config: mainnet env requires non-devnet SERVER_SOLANA_RPC_URL"
  );
}

console.log("payment safety smoke: ok");
