import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export function paymentMemoForIntent(intentId: string): string {
  return `veloran:intent:${intentId}`;
}

export function buildMemoInstruction(memo: string): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(memo, "utf8"),
  });
}

export function buildPaymentMemoIx(intentId: string): TransactionInstruction {
  return buildMemoInstruction(paymentMemoForIntent(intentId));
}
