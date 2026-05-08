import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { paymentMemoForIntent } from "@/lib/payment-memo";
import {
  validatePaymentIntentRecord,
  type PaymentIntentContext,
} from "@/lib/payment-intent-validation";

export { validatePaymentIntentRecord, type PaymentIntentContext };

const PAYMENT_INTENT_TTL_MS = 15 * 60 * 1000;

export async function createPaymentIntent(args: {
  postId: string;
  slug: string;
  amountUsdc: number;
  creatorAddress: string;
  payerAddress?: string | null;
}): Promise<PaymentIntentContext> {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + PAYMENT_INTENT_TTL_MS);
  const intent = await prisma.paymentIntent.create({
    data: {
      postId: args.postId,
      resource: `/api/x402/${args.slug}`,
      amountUsdc: args.amountUsdc,
      creatorAddress: args.creatorAddress,
      payerAddress: args.payerAddress ?? null,
      nonce,
      memo: paymentMemoForIntent(nonce),
      expiresAt,
    },
  });
  return intent;
}

export async function getUsablePaymentIntent(args: {
  intentId: string;
  postId: string;
  payerAddress: string;
}): Promise<PaymentIntentContext | { error: string; status: number }> {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: args.intentId },
  });
  if (!intent) return { error: "Payment intent not found", status: 400 };
  return validatePaymentIntentRecord(intent, args);
}
