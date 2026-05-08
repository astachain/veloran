import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  USDC_MINT,
  VELORAN_PROGRAM_ID,
  VELORAN_TREASURY,
  VELORAN_X402_NETWORK,
} from "./solana";

export const VELORAN_X402_SCHEME = "exact-veloran";
export { VELORAN_X402_NETWORK } from "./solana";
export const X402_VERSION = 1;

/** Mirror of the program's PLATFORM_BPS constant (5.00%). */
export const PLATFORM_BPS = 500n;
export const BPS_DENOMINATOR = 10_000n;

export type PostForRequirements = {
  slug: string;
  priceUsdc: number;
  preview: string;
  creator: { solanaAddress: string };
};

export type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: {
    creator: string;
    creatorAta: string;
    platform: string;
    platformAta: string;
  };
  extra: {
    programId: string;
    splitBps: { creator: number; platform: number };
    intentId?: string;
    memo?: string;
    expiresAt?: string;
  };
};

export type PaymentIntentForRequirements = {
  id: string;
  memo: string;
  expiresAt: Date;
};

export function buildPaymentRequirements(
  post: PostForRequirements,
  intent?: PaymentIntentForRequirements
): PaymentRequirements {
  const creatorAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    new PublicKey(post.creator.solanaAddress)
  ).toBase58();
  const platformAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    VELORAN_TREASURY
  ).toBase58();

  return {
    scheme: VELORAN_X402_SCHEME,
    network: VELORAN_X402_NETWORK,
    asset: USDC_MINT.toBase58(),
    maxAmountRequired: String(post.priceUsdc),
    resource: `/api/x402/${post.slug}`,
    description: `Unlock "${post.preview}" — pays creator (95%) + Veloran (5%) via on-chain split`,
    payTo: {
      creator: post.creator.solanaAddress,
      creatorAta,
      platform: VELORAN_TREASURY.toBase58(),
      platformAta,
    },
    extra: {
      programId: VELORAN_PROGRAM_ID.toBase58(),
      splitBps: {
        creator: Number(BPS_DENOMINATOR - PLATFORM_BPS),
        platform: Number(PLATFORM_BPS),
      },
      ...(intent
        ? {
            intentId: intent.id,
            memo: intent.memo,
            expiresAt: intent.expiresAt.toISOString(),
          }
        : {}),
    },
  };
}

export type PaymentHeader = {
  scheme: string;
  network: string;
  txSignature: string;
  payerAddress: string;
  intentId?: string;
};

export function base64urlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64urlDecode(input: string): string | null {
  try {
    const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
    const std = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return Buffer.from(std, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function parsePaymentHeader(
  headerValue: string | null
): PaymentHeader | null {
  if (!headerValue) return null;
  const json = base64urlDecode(headerValue.trim());
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.scheme !== "string") return null;
  if (typeof p.network !== "string") return null;
  if (typeof p.txSignature !== "string" || p.txSignature.length < 32) return null;
  if (typeof p.payerAddress !== "string" || p.payerAddress.length < 32) return null;

  try {
    new PublicKey(p.payerAddress);
  } catch {
    return null;
  }

  return {
    scheme: p.scheme,
    network: p.network,
    txSignature: p.txSignature,
    payerAddress: p.payerAddress,
    ...(typeof p.intentId === "string" ? { intentId: p.intentId } : {}),
  };
}

export function buildPaymentResponseHeader(
  ok: boolean,
  txSignature: string
): string {
  return base64urlEncode(JSON.stringify({ ok, txSignature }));
}

export type VerifyResult =
  | { ok: true; creatorDelta: bigint; platformDelta: bigint; price: bigint }
  | { ok: false; status: number; error: string };

export function transactionContainsMemo(
  tx: ParsedTransactionWithMeta,
  expectedMemo: string
): boolean {
  const instructions = tx.transaction.message.instructions as unknown[];
  return instructions.some((ix) => {
    if (!ix || typeof ix !== "object") return false;
    const obj = ix as Record<string, unknown>;
    if (obj.program === "spl-memo" && obj.parsed === expectedMemo) return true;
    if (obj.programId instanceof PublicKey && obj.programId.toBase58() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr") {
      const data = obj.data;
      return typeof data === "string" && data === expectedMemo;
    }
    return false;
  });
}

export function transactionInvokesProgram(
  tx: ParsedTransactionWithMeta,
  programId: PublicKey
): boolean {
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    k.pubkey.toBase58()
  );
  const expectedProgramId = programId.toBase58();
  const instructions = tx.transaction.message.instructions as unknown[];

  return instructions.some((ix) => {
    if (!ix || typeof ix !== "object") return false;
    const obj = ix as Record<string, unknown>;
    if (obj.programId instanceof PublicKey) {
      return obj.programId.toBase58() === expectedProgramId;
    }
    if (typeof obj.programId === "string") {
      return obj.programId === expectedProgramId;
    }
    if (typeof obj.programIdIndex === "number") {
      return accountKeys[obj.programIdIndex] === expectedProgramId;
    }
    return false;
  });
}

export function verifyOnChainPayment(args: {
  tx: ParsedTransactionWithMeta;
  recipientAddress: string;
  amountUsdc: number;
  expectedPayerAddress: string;
  expectedMemo?: string;
}): VerifyResult {
  const { tx, recipientAddress, amountUsdc, expectedPayerAddress } = args;

  if (args.expectedMemo && !transactionContainsMemo(tx, args.expectedMemo)) {
    return {
      ok: false,
      status: 400,
      error: "Transaction memo does not match payment intent",
    };
  }

  if (tx.meta?.err) {
    return { ok: false, status: 400, error: "Transaction failed on-chain" };
  }

  const payerPk = new PublicKey(expectedPayerAddress);
  const recipientPk = new PublicKey(recipientAddress);
  const recipientAta = getAssociatedTokenAddressSync(USDC_MINT, recipientPk).toBase58();
  const payerAta = getAssociatedTokenAddressSync(USDC_MINT, payerPk).toBase58();
  const platformAta = getAssociatedTokenAddressSync(USDC_MINT, VELORAN_TREASURY).toBase58();

  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    k.pubkey.toBase58()
  );
  if (!transactionInvokesProgram(tx, VELORAN_PROGRAM_ID)) {
    return {
      ok: false,
      status: 400,
      error: "Transaction did not invoke the Veloran program",
    };
  }

  const pre = tx.meta?.preTokenBalances ?? [];
  const post_ = tx.meta?.postTokenBalances ?? [];

  const balanceFor = (
    arr: typeof pre,
    owner: string,
    accountIndex: number
  ): bigint => {
    const entry = arr.find(
      (b) =>
        b.accountIndex === accountIndex &&
        b.mint === USDC_MINT.toBase58() &&
        b.owner === owner
    );
    return entry ? BigInt(entry.uiTokenAmount.amount) : 0n;
  };

  const recipientAtaIdx = accountKeys.indexOf(recipientAta);
  const platformAtaIdx = accountKeys.indexOf(platformAta);
  const payerAtaIdx = accountKeys.indexOf(payerAta);
  if (recipientAtaIdx === -1) {
    return { ok: false, status: 400, error: "Recipient USDC account not in transaction" };
  }
  if (platformAtaIdx === -1) {
    return { ok: false, status: 400, error: "Platform USDC account not in transaction" };
  }

  const price = BigInt(amountUsdc);
  const expectedPlatform = (price * PLATFORM_BPS) / BPS_DENOMINATOR;
  const expectedCreator = price - expectedPlatform;

  const creatorDelta =
    balanceFor(post_, recipientAddress, recipientAtaIdx) -
    balanceFor(pre, recipientAddress, recipientAtaIdx);
  const platformDelta =
    balanceFor(post_, VELORAN_TREASURY.toBase58(), platformAtaIdx) -
    balanceFor(pre, VELORAN_TREASURY.toBase58(), platformAtaIdx);

  if (creatorDelta < expectedCreator) {
    return {
      ok: false,
      status: 400,
      error: `Recipient received ${creatorDelta} micro-USDC, expected >= ${expectedCreator}`,
    };
  }
  if (platformDelta < expectedPlatform) {
    return {
      ok: false,
      status: 400,
      error: `Platform received ${platformDelta} micro-USDC, expected >= ${expectedPlatform}`,
    };
  }
  if (creatorDelta + platformDelta < price) {
    return {
      ok: false,
      status: 400,
      error: "Combined recipient + platform credit is less than the price",
    };
  }

  if (payerAtaIdx === -1) {
    return {
      ok: false,
      status: 400,
      error: "Claimed payer's USDC account not in transaction",
    };
  }
  const payerPre = balanceFor(pre, expectedPayerAddress, payerAtaIdx);
  const payerPost = balanceFor(post_, expectedPayerAddress, payerAtaIdx);
  if (payerPre - payerPost < price) {
    return {
      ok: false,
      status: 400,
      error: "Claimed payer wallet did not fund this transfer",
    };
  }

  return { ok: true, creatorDelta, platformDelta, price };
}
