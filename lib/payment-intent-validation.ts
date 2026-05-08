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
