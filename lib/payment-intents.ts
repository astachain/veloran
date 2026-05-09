import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { paymentMemoForIntent } from "@/lib/payment-memo";
import {
  validatePaymentIntentRecord,
  validateSubscriptionIntentRecord,
  type PaymentIntentContext,
} from "@/lib/payment-intent-validation";

export {
  validatePaymentIntentRecord,
  validateSubscriptionIntentRecord,
  type PaymentIntentContext,
};

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

// ---------------------------------------------------------------------------
// Subscription intents (memo-bound, same TTL, creator-scoped)
// ---------------------------------------------------------------------------

export type SubscriptionIntentContext = {
  id: string;
  creatorId: string;
  subscriberAddress: string | null;
  memo: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export async function createSubscriptionIntent(args: {
  creatorId: string;
  plan: string;
  amountUsdc: number;
  subscriberAddress?: string | null;
  subscriberCreatorId?: string | null;
}): Promise<SubscriptionIntentContext> {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + PAYMENT_INTENT_TTL_MS);
  const intent = await prisma.subscriptionPaymentIntent.create({
    data: {
      creatorId: args.creatorId,
      plan: args.plan,
      amountUsdc: args.amountUsdc,
      subscriberCreatorId: args.subscriberCreatorId ?? null,
      subscriberAddress: args.subscriberAddress ?? null,
      nonce,
      memo: paymentMemoForIntent(nonce),
      expiresAt,
    },
  });
  return intent;
}

export async function getUsableSubscriptionIntent(args: {
  intentId: string;
  creatorId: string;
  subscriberAddress: string;
}): Promise<SubscriptionIntentContext | { error: string; status: number }> {
  const intent = await prisma.subscriptionPaymentIntent.findUnique({
    where: { id: args.intentId },
  });
  if (!intent) return { error: "Subscription intent not found", status: 400 };
  return validateSubscriptionIntentRecord(intent, args);
}
