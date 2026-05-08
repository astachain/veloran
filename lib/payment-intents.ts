import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { paymentMemoForIntent } from "@/lib/payment-memo";

const PAYMENT_INTENT_TTL_MS = 15 * 60 * 1000;

export type PaymentIntentContext = {
  id: string;
  postId: string;
  resource: string;
  amountUsdc: number;
  creatorAddress: string;
  payerAddress: string | null;
  memo: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

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
  if (intent.postId !== args.postId) {
    return { error: "Payment intent is for a different resource", status: 400 };
  }
  if (intent.expiresAt.getTime() < Date.now()) {
    return { error: "Payment intent expired", status: 400 };
  }
  if (intent.consumedAt) {
    return { error: "Payment intent already consumed", status: 409 };
  }
  if (intent.payerAddress && intent.payerAddress !== args.payerAddress) {
    return { error: "Payment intent is bound to a different payer", status: 400 };
  }
  return intent;
}
