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

export function validatePaymentIntentRecord(
  intent: PaymentIntentContext,
  args: { postId: string; payerAddress: string }
): PaymentIntentContext | { error: string; status: number } {
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

export type SubscriptionIntentContext = {
  id: string;
  creatorId: string;
  subscriberAddress: string | null;
  memo: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export function validateSubscriptionIntentRecord(
  intent: SubscriptionIntentContext,
  args: { creatorId: string; subscriberAddress: string }
): SubscriptionIntentContext | { error: string; status: number } {
  if (intent.creatorId !== args.creatorId) {
    return {
      error: "Subscription intent is for a different creator",
      status: 400,
    };
  }
  if (intent.expiresAt.getTime() < Date.now()) {
    return { error: "Subscription intent expired", status: 400 };
  }
  if (intent.consumedAt) {
    return { error: "Subscription intent already consumed", status: 409 };
  }
  if (
    intent.subscriberAddress &&
    intent.subscriberAddress !== args.subscriberAddress
  ) {
    return {
      error: "Subscription intent is bound to a different payer",
      status: 400,
    };
  }
  return intent;
}
