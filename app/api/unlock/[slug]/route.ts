import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPrivyToken } from "@/lib/privy-server";
import { getServerConnection } from "@/lib/solana";
import { getUsablePaymentIntent } from "@/lib/payment-intents";
import { verifyOnChainPayment } from "@/lib/x402";
import {
  signUnlockToken,
  unlockCookieName,
  UNLOCK_COOKIE_MAX_AGE,
} from "@/lib/content-gate";

function withUnlockCookie(res: NextResponse, slug: string): NextResponse {
  res.cookies.set({
    name: unlockCookieName(slug),
    value: signUnlockToken(slug),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_COOKIE_MAX_AGE,
  });
  return res;
}

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const claims = await verifyPrivyToken(req.headers.get("authorization"));
  if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reader = await prisma.creator.findUnique({
    where: { privyUserId: claims.userId },
  });
  if (!reader?.solanaAddress) {
    return NextResponse.json(
      { error: "Reader has no wallet on record" },
      { status: 400 }
    );
  }

  let body: { txSignature?: string; intentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const txSignature = body.txSignature?.trim();
  const intentId = body.intentId?.trim();
  if (!txSignature) {
    return NextResponse.json({ error: "Missing txSignature" }, { status: 400 });
  }
  if (!intentId) {
    return NextResponse.json({ error: "Missing payment intent ID" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { creator: { select: { id: true, solanaAddress: true } } },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (!post.creator.solanaAddress) {
    return NextResponse.json(
      { error: "Creator wallet missing" },
      { status: 500 }
    );
  }

  const intent = await getUsablePaymentIntent({
    intentId,
    postId: post.id,
    payerAddress: reader.solanaAddress,
  });
  if ("error" in intent) {
    return NextResponse.json({ error: intent.error }, { status: intent.status });
  }

  const existingReceipt = await prisma.paymentReceipt.findUnique({
    where: { txSignature },
  });
  if (existingReceipt) {
    return NextResponse.json(
      { error: "Payment signature already consumed" },
      { status: 409 }
    );
  }

  const connection = getServerConnection();
  const tx = await connection.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 400 });
  }

  const result = verifyOnChainPayment({
    tx,
    recipientAddress: intent.creatorAddress,
    amountUsdc: intent.amountUsdc,
    expectedPayerAddress: reader.solanaAddress,
    expectedMemo: intent.memo,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  try {
    await prisma.$transaction([
      prisma.paymentReceipt.create({
        data: {
          intentId: intent.id,
          postId: post.id,
          readerAddress: reader.solanaAddress,
          amountUsdc: intent.amountUsdc,
          txSignature,
        },
      }),
      prisma.unlock.create({
        data: {
          postId: post.id,
          readerCreatorId: reader.id,
          readerAddress: reader.solanaAddress,
          readerType: "human",
          amountUsdc: intent.amountUsdc,
          txSignature,
        },
      }),
      prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { consumedAt: new Date() },
      }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Payment signature or intent already consumed" },
        { status: 409 }
      );
    }
    throw e;
  }

  return withUnlockCookie(
    NextResponse.json({ ok: true, content: post.content }),
    slug
  );
}
