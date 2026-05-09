import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { type PaymentIntentContext } from "../lib/payment-intent-validation";

process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
process.env.NEXT_PUBLIC_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
process.env.NEXT_PUBLIC_VELORAN_PROGRAM_ID = "2CtnLfdePpjitQQLtHrQAsa74RXLiubKfSdJmjy2pGcS";
process.env.NEXT_PUBLIC_VELORAN_TREASURY = "DgGYE7boZTEwrotFsYS9bFYsrgpz8TC76cXCZ8GcFKnP";

type FixtureAccountKey = { pubkey: string | PublicKey } | string;
type FixtureInstruction = Record<string, unknown>;
type FixtureTransaction = {
  transaction: {
    message: {
      accountKeys: FixtureAccountKey[];
      instructions: FixtureInstruction[];
    };
  };
};

type Case = {
  name: string;
  fixture: string;
  args: {
    recipientAddress: string;
    amountUsdc: number;
    expectedPayerAddress: string;
    expectedMemo?: string;
  };
  expect: "ok" | "fail";
  expectedReasonRegex?: RegExp;
};

let verifyOnChainPayment: (args: {
  tx: ParsedTransactionWithMeta;
  recipientAddress: string;
  amountUsdc: number;
  expectedPayerAddress: string;
  expectedMemo?: string;
}) => { ok: true; creatorDelta: bigint; platformDelta: bigint; price: bigint } | { ok: false; status: number; error: string };
let validatePaymentIntentRecord: (
  intent: PaymentIntentContext,
  args: { postId: string; payerAddress: string }
) => PaymentIntentContext | { error: string; status: number };
let validateSubscriptionIntentRecord: (
  intent: {
    id: string;
    creatorId: string;
    subscriberAddress: string | null;
    memo: string;
    expiresAt: Date;
    consumedAt: Date | null;
  },
  args: { creatorId: string; subscriberAddress: string }
) =>
  | {
      id: string;
      creatorId: string;
      subscriberAddress: string | null;
      memo: string;
      expiresAt: Date;
      consumedAt: Date | null;
    }
  | { error: string; status: number };

const HAPPY_RECIPIENT = "BKnuQ2psJ3rSwVhTJms2DAG7zqQ7kuFuLoQTFqYnTU8W";
const HAPPY_PAYER = "oBSzTgxxpJ8WGcGxwHweDchFAofMfykBJbQpWE9esRo";
const OTHER_PAYER = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWdrXd6bmwB2K27y";
const HAPPY_MEMO = "veloran:intent:testnonce000000000000000000000000";
const HAPPY_AMOUNT = 500_000;

function loadFixture(name: string): ParsedTransactionWithMeta {
  const tx = JSON.parse(
    readFileSync(`tests/fixtures/${name}`, "utf8")
  ) as FixtureTransaction;

  tx.transaction.message.accountKeys = tx.transaction.message.accountKeys.map((key) => ({
    pubkey: new PublicKey(typeof key === "string" ? key : String(key.pubkey)),
  }));
  tx.transaction.message.instructions = tx.transaction.message.instructions.map((ix) => ({
    ...ix,
    ...(typeof ix.programId === "string" ? { programId: new PublicKey(ix.programId) } : {}),
  }));

  return tx as unknown as ParsedTransactionWithMeta;
}

const verificationCases: Case[] = [
  {
    name: "happy: correct memo + payer + deltas accepted",
    fixture: "happy.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "ok",
  },
  {
    name: "wrong memo rejected",
    fixture: "wrong-memo.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /memo does not match/i,
  },
  {
    name: "missing Veloran program invocation rejected",
    fixture: "no-program.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /did not invoke the Veloran program/i,
  },
  {
    name: "wrong payer rejected",
    fixture: "happy.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: OTHER_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /payer.*USDC account not in transaction|payer wallet did not fund/i,
  },
  {
    name: "missing recipient ATA rejected",
    fixture: "missing-recipient-ata.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /Recipient USDC account not in transaction/i,
  },
  {
    name: "missing platform ATA rejected",
    fixture: "missing-platform-ata.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /Platform USDC account not in transaction/i,
  },
  {
    name: "insufficient creator delta rejected",
    fixture: "insufficient-creator-delta.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /Recipient received .* expected >=/i,
  },
  {
    name: "insufficient platform delta rejected",
    fixture: "insufficient-platform-delta.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /Platform received .* expected >=/i,
  },
  {
    name: "failed on-chain transaction rejected",
    fixture: "failed-tx.json",
    args: {
      recipientAddress: HAPPY_RECIPIENT,
      amountUsdc: HAPPY_AMOUNT,
      expectedPayerAddress: HAPPY_PAYER,
      expectedMemo: HAPPY_MEMO,
    },
    expect: "fail",
    expectedReasonRegex: /Transaction failed on-chain/i,
  },
];

function formatResult(result: unknown): string {
  return JSON.stringify(result, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

function assertVerificationCases(): number {
  let passed = 0;
  for (const c of verificationCases) {
    const result = verifyOnChainPayment({ tx: loadFixture(c.fixture), ...c.args });
    if (c.expect === "ok") {
      assert.equal(result.ok, true, `${c.name} — got ${formatResult(result)}`);
    } else {
      assert.equal(result.ok, false, `${c.name} — got ${formatResult(result)}`);
      assert.match(result.error, c.expectedReasonRegex!, c.name);
    }
    console.log(`✅ ${c.name}`);
    passed++;
  }
  return passed;
}

function intent(overrides: Partial<PaymentIntentContext>): PaymentIntentContext {
  return {
    id: "intent_test",
    postId: "post_test",
    resource: "/api/x402/test-post",
    amountUsdc: HAPPY_AMOUNT,
    creatorAddress: HAPPY_RECIPIENT,
    payerAddress: null,
    memo: HAPPY_MEMO,
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    ...overrides,
  };
}

function assertIntentCases(): number {
  const valid = intent({});
  assert.equal(validatePaymentIntentRecord(valid, {
    postId: "post_test",
    payerAddress: HAPPY_PAYER,
  }), valid);
  console.log("✅ valid intent accepted");

  const wrongResource = validatePaymentIntentRecord(intent({}), {
    postId: "other_post",
    payerAddress: HAPPY_PAYER,
  });
  assert.deepEqual(wrongResource, {
    error: "Payment intent is for a different resource",
    status: 400,
  });
  console.log("✅ wrong-resource intent rejected");

  const boundPayer = intent({ payerAddress: HAPPY_PAYER });
  assert.equal(validatePaymentIntentRecord(boundPayer, {
    postId: "post_test",
    payerAddress: HAPPY_PAYER,
  }), boundPayer);
  console.log("✅ bound payer accepted");

  const wrongBoundPayer = validatePaymentIntentRecord(boundPayer, {
    postId: "post_test",
    payerAddress: OTHER_PAYER,
  });
  assert.deepEqual(wrongBoundPayer, {
    error: "Payment intent is bound to a different payer",
    status: 400,
  });
  console.log("✅ bound payer mismatch rejected");

  const consumed = validatePaymentIntentRecord(
    intent({ consumedAt: new Date() }),
    { postId: "post_test", payerAddress: HAPPY_PAYER }
  );
  assert.deepEqual(consumed, {
    error: "Payment intent already consumed",
    status: 409,
  });
  console.log("✅ consumed intent rejected");

  const expired = validatePaymentIntentRecord(
    intent({ expiresAt: new Date(Date.now() - 60_000) }),
    { postId: "post_test", payerAddress: HAPPY_PAYER }
  );
  assert.deepEqual(expired, {
    error: "Payment intent expired",
    status: 400,
  });
  console.log("✅ expired intent rejected");

  return 6;
}

// ---------------------------------------------------------------------------
// Subscription intent invariants (no DB — pure validation logic)
// ---------------------------------------------------------------------------

function subIntent(overrides: Partial<{
  creatorId: string;
  subscriberAddress: string | null;
  consumedAt: Date | null;
  expiresAt: Date;
}> = {}) {
  return {
    id: "sub_intent_test",
    creatorId: "creator_test",
    subscriberCreatorId: null,
    subscriberAddress: null as string | null,
    plan: "monthly",
    amountUsdc: HAPPY_AMOUNT,
    nonce: "subnonce000000000000000000000000",
    memo: HAPPY_MEMO,
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null as Date | null,
    ...overrides,
  };
}

function assertSubscriptionIntentCases(): number {
  const valid = subIntent({ subscriberAddress: HAPPY_PAYER });
  const r1 = validateSubscriptionIntentRecord(valid, {
    creatorId: valid.creatorId,
    subscriberAddress: HAPPY_PAYER,
  });
  assert.ok(!("error" in r1), `valid subscription intent accepted — got ${formatResult(r1)}`);
  console.log("✅ valid subscription intent accepted");

  const r2 = validateSubscriptionIntentRecord(valid, {
    creatorId: "wrong_creator",
    subscriberAddress: HAPPY_PAYER,
  });
  assert.deepEqual(r2, {
    error: "Subscription intent is for a different creator",
    status: 400,
  });
  console.log("✅ wrong-creator subscription intent rejected");

  const bound = subIntent({ subscriberAddress: HAPPY_PAYER });
  const r3 = validateSubscriptionIntentRecord(bound, {
    creatorId: bound.creatorId,
    subscriberAddress: HAPPY_PAYER,
  });
  assert.ok(!("error" in r3));
  console.log("✅ bound subscriber accepted");

  const r4 = validateSubscriptionIntentRecord(bound, {
    creatorId: bound.creatorId,
    subscriberAddress: OTHER_PAYER,
  });
  assert.deepEqual(r4, {
    error: "Subscription intent is bound to a different payer",
    status: 400,
  });
  console.log("✅ bound subscriber mismatch rejected");

  const consumed = subIntent({ consumedAt: new Date() });
  const r5 = validateSubscriptionIntentRecord(consumed, {
    creatorId: consumed.creatorId,
    subscriberAddress: HAPPY_PAYER,
  });
  assert.deepEqual(r5, {
    error: "Subscription intent already consumed",
    status: 409,
  });
  console.log("✅ consumed subscription intent rejected");

  const expired = subIntent({ expiresAt: new Date(Date.now() - 60_000) });
  const r6 = validateSubscriptionIntentRecord(expired, {
    creatorId: expired.creatorId,
    subscriberAddress: HAPPY_PAYER,
  });
  assert.deepEqual(r6, {
    error: "Subscription intent expired",
    status: 400,
  });
  console.log("✅ expired subscription intent rejected");

  return 6;
}

async function main(): Promise<void> {
  ({ verifyOnChainPayment } = await import("../lib/x402"));
  ({ validatePaymentIntentRecord } = await import("../lib/payment-intent-validation"));
  ({ validateSubscriptionIntentRecord } = await import("../lib/payment-intents"));

  const total = assertVerificationCases() + assertIntentCases() + assertSubscriptionIntentCases();
  console.log(`\npayment verification tests: ${total}/${verificationCases.length + 12} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
