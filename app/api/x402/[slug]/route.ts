import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getServerConnection } from "@/lib/solana";
import { createPaymentIntent, getUsablePaymentIntent } from "@/lib/payment-intents";
import {
  buildPaymentRequirements,
  buildPaymentResponseHeader,
  parsePaymentHeader,
  verifyOnChainPayment,
  VELORAN_X402_NETWORK,
  VELORAN_X402_SCHEME,
  X402_VERSION,
} from "@/lib/x402";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      preview: true,
      content: true,
      priceUsdc: true,
      creator: { select: { solanaAddress: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (!post.creator.solanaAddress) {
    return NextResponse.json(
      { error: "Creator wallet missing" },
      { status: 500 }
    );
  }

  const headerValue = req.headers.get("x-payment");
  if (!headerValue) {
    const intent = await createPaymentIntent({
      postId: post.id,
      slug: post.slug,
      amountUsdc: post.priceUsdc,
      creatorAddress: post.creator.solanaAddress,
    });
    const requirements = buildPaymentRequirements(
      {
        slug: post.slug,
        priceUsdc: post.priceUsdc,
        preview: post.preview,
        creator: { solanaAddress: post.creator.solanaAddress },
      },
      intent
    );
    return NextResponse.json(
      { x402Version: X402_VERSION, accepts: [requirements] },
      { status: 402 }
    );
  }

  const parsed = parsePaymentHeader(headerValue);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid X-PAYMENT header" },
      { status: 400 }
    );
  }
  if (parsed.scheme !== VELORAN_X402_SCHEME) {
    return NextResponse.json(
      { error: `Unsupported scheme '${parsed.scheme}'` },
      { status: 400 }
    );
  }
  if (parsed.network !== VELORAN_X402_NETWORK) {
    return NextResponse.json(
      { error: `Unsupported network '${parsed.network}'` },
      { status: 400 }
    );
  }
  if (!parsed.intentId) {
    return NextResponse.json(
      { error: "Missing payment intent ID" },
      { status: 400 }
    );
  }

  const intent = await getUsablePaymentIntent({
    intentId: parsed.intentId,
    postId: post.id,
    payerAddress: parsed.payerAddress,
  });
  if ("error" in intent) {
    return NextResponse.json({ error: intent.error }, { status: intent.status });
  }

  const existingReceipt = await prisma.paymentReceipt.findUnique({
    where: { txSignature: parsed.txSignature },
  });
  if (existingReceipt) {
    return NextResponse.json(
      { error: "Payment signature already consumed" },
      { status: 409 }
    );
  }

  const connection = getServerConnection();
  const tx = await connection.getParsedTransaction(parsed.txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 400 }
    );
  }

  const result = verifyOnChainPayment({
    tx,
    recipientAddress: intent.creatorAddress,
    amountUsdc: intent.amountUsdc,
    expectedPayerAddress: parsed.payerAddress,
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
          readerAddress: parsed.payerAddress,
          amountUsdc: intent.amountUsdc,
          txSignature: parsed.txSignature,
        },
      }),
      prisma.unlock.create({
        data: {
          postId: post.id,
          readerCreatorId: null,
          readerAddress: parsed.payerAddress,
          readerType: "agent",
          amountUsdc: intent.amountUsdc,
          txSignature: parsed.txSignature,
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

  return ok(post, parsed.txSignature);
}

function ok(
  post: { title: string; content: string },
  txSignature: string
): NextResponse {
  const res = NextResponse.json({
    ok: true,
    title: post.title,
    content: post.content,
    txSignature,
  });
  res.headers.set(
    "X-PAYMENT-RESPONSE",
    buildPaymentResponseHeader(true, txSignature)
  );
  return res;
}
