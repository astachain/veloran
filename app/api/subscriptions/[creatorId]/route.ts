import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPrivyToken } from "@/lib/privy-server";
import { getServerConnection } from "@/lib/solana";
import {
  createSubscriptionIntent,
  getUsableSubscriptionIntent,
} from "@/lib/payment-intents";
import { verifyOnChainPayment, VELORAN_X402_NETWORK } from "@/lib/x402";
import { event, sigPrefix6 } from "@/lib/log";
import {
  signSubscriptionToken,
  subscriptionCookieName,
  subscriptionCookieMaxAge,
  type SubscriptionPlan,
} from "@/lib/content-gate";

type Params = { params: Promise<{ creatorId: string }> };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function withSubscriptionCookie(
  res: NextResponse,
  creatorId: string,
  plan: SubscriptionPlan
): NextResponse {
  res.cookies.set({
    name: subscriptionCookieName(creatorId),
    value: signSubscriptionToken(creatorId, plan),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: subscriptionCookieMaxAge(plan),
  });
  return res;
}

function isPlan(v: unknown): v is SubscriptionPlan {
  return v === "monthly" || v === "yearly";
}

/**
 * POST /api/subscriptions/[creatorId]
 *
 * Two-phase intent-bound flow:
 *   Phase 1 (no txSignature): create SubscriptionPaymentIntent → 402
 *   Phase 2 (intentId + txSignature): verify on-chain, consume intent, subscribe
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { creatorId } = await params;

  // 1. Authenticate reader
  const claims = await verifyPrivyToken(req.headers.get("authorization"));
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriber = await prisma.creator.findUnique({
    where: { privyUserId: claims.userId },
  });
  if (!subscriber || !subscriber.solanaAddress) {
    return NextResponse.json(
      { error: "Subscriber has no wallet on record" },
      { status: 400 }
    );
  }
  const subscriberAddress = subscriber.solanaAddress;

  // 2. Body
  let body: {
    intentId?: string;
    txSignature?: string;
    plan?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const plan = body.plan;
  if (!isPlan(plan)) {
    return NextResponse.json(
      { error: "plan must be 'monthly' or 'yearly'" },
      { status: 400 }
    );
  }

  // 3. Load creator + tier
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      solanaAddress: true,
      tier: {
        select: {
          monthlyPrice: true,
          yearlyPrice: true,
          active: true,
        },
      },
    },
  });
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  if (!creator.solanaAddress) {
    return NextResponse.json(
      { error: "Creator wallet missing" },
      { status: 500 }
    );
  }
  if (!creator.tier || !creator.tier.active) {
    return NextResponse.json(
      { error: "Creator does not offer subscriptions" },
      { status: 400 }
    );
  }
  const expectedPrice =
    plan === "monthly" ? creator.tier.monthlyPrice : creator.tier.yearlyPrice;
  if (expectedPrice === null || expectedPrice === undefined) {
    return NextResponse.json(
      { error: `Creator does not offer a ${plan} plan` },
      { status: 400 }
    );
  }

  // ── Phase 1: no txSignature → create intent, return 402 challenge ──
  const txSignature = body.txSignature?.trim();
  const intentId = body.intentId?.trim();
  if (!txSignature) {
    const intent = await createSubscriptionIntent({
      creatorId: creator.id,
      plan,
      amountUsdc: expectedPrice,
      subscriberAddress,
      subscriberCreatorId: subscriber.id,
    });
    event("subscription_challenge_created", {
      intentId: intent.id,
      creatorId: creator.id,
      network: VELORAN_X402_NETWORK,
      expectedAmount: expectedPrice,
      plan,
    });
    return NextResponse.json(
      {
        intentId: intent.id,
        memo: intent.memo,
        expiresAt: intent.expiresAt.toISOString(),
      },
      { status: 402 }
    );
  }

  if (!intentId) {
    return NextResponse.json(
      { error: "Missing payment intent ID" },
      { status: 400 }
    );
  }

  // ── Phase 2: validate intent + verify on-chain + persist ──

  const intent = await getUsableSubscriptionIntent({
    intentId,
    creatorId: creator.id,
    subscriberAddress,
  });
  if ("error" in intent) {
    if (intent.status === 409) {
      event("subscription_replay_rejected", {
        intentId,
        signaturePrefix6: sigPrefix6(txSignature),
        network: VELORAN_X402_NETWORK,
        plan,
      });
    }
    return NextResponse.json({ error: intent.error }, { status: intent.status });
  }

  // Idempotency at the signature level (second guard)
  const existing = await prisma.subscription.findUnique({
    where: { txSignature },
  });
  if (existing) {
    event("subscription_replay_rejected", {
      intentId,
      signaturePrefix6: sigPrefix6(txSignature),
      network: VELORAN_X402_NETWORK,
      plan,
    });
    return withSubscriptionCookie(
      NextResponse.json({
        ok: true,
        plan: existing.plan,
        expiresAt: existing.expiresAt.toISOString(),
        txSignature,
      }),
      creator.id,
      existing.plan === "yearly" ? "yearly" : "monthly"
    );
  }

  // Fetch + verify the on-chain payment
  const connection = getServerConnection();
  const tx = await connection.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    event("subscription_tx_lookup_failed", {
      intentId,
      signaturePrefix6: sigPrefix6(txSignature),
      network: VELORAN_X402_NETWORK,
      errorCode: "tx_not_found",
      plan,
    });
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 400 }
    );
  }

  const result = verifyOnChainPayment({
    tx,
    recipientAddress: creator.solanaAddress,
    amountUsdc: expectedPrice,
    expectedPayerAddress: subscriberAddress,
    expectedMemo: intent.memo,
  });
  if (!result.ok) {
    event("subscription_verification_failed", {
      intentId,
      reason: result.error,
      network: VELORAN_X402_NETWORK,
      plan,
    });
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Persist subscription + consume intent
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (plan === "yearly" ? 365 : 30) * MS_PER_DAY
  );

  try {
    const sub = await prisma.$transaction(async (txPrisma) => {
      const subRow = await txPrisma.subscription.create({
        data: {
          creatorId: creator.id,
          subscriberCreatorId: subscriber.id,
          subscriberAddress,
          plan,
          amountUsdc: expectedPrice,
          startsAt: now,
          expiresAt,
          txSignature,
        },
        select: {
          plan: true,
          expiresAt: true,
          txSignature: true,
        },
      });
      await txPrisma.subscriptionPaymentIntent.update({
        where: { id: intent.id },
        data: { consumedAt: new Date() },
      });
      return subRow;
    });

    event("subscription_accepted", {
      intentId: intent.id,
      signaturePrefix6: sigPrefix6(txSignature),
      network: VELORAN_X402_NETWORK,
      creatorDeltaMicro: Number(result.creatorDelta),
      platformDeltaMicro: Number(result.platformDelta),
      plan,
    });

    return withSubscriptionCookie(
      NextResponse.json({
        ok: true,
        plan: sub.plan,
        expiresAt: sub.expiresAt.toISOString(),
        txSignature: sub.txSignature,
      }),
      creator.id,
      plan
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      event("subscription_replay_rejected", {
        intentId,
        signaturePrefix6: sigPrefix6(txSignature),
        network: VELORAN_X402_NETWORK,
        plan,
      });
      return NextResponse.json(
        { error: "Subscription signature already consumed" },
        { status: 409 }
      );
    }
    throw e;
  }
}

/**
 * GET /api/subscriptions/[creatorId]   (Privy authed)
 *
 * Returns the caller's active subscription to this creator, if any.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { creatorId } = await params;
  const claims = await verifyPrivyToken(req.headers.get("authorization"));
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.creator.findUnique({
    where: { privyUserId: claims.userId },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ subscription: null });
  }

  const active = await prisma.subscription.findFirst({
    where: {
      creatorId,
      subscriberCreatorId: me.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
    select: {
      id: true,
      plan: true,
      startsAt: true,
      expiresAt: true,
      amountUsdc: true,
      txSignature: true,
    },
  });

  return NextResponse.json({
    subscription: active
      ? {
          id: active.id,
          plan: active.plan,
          startsAt: active.startsAt.toISOString(),
          expiresAt: active.expiresAt.toISOString(),
          amountUsdc: active.amountUsdc,
          txSignature: active.txSignature,
        }
      : null,
  });
}
