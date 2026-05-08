import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPrivyToken } from "@/lib/privy-server";
import { createPaymentIntent } from "@/lib/payment-intents";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const claims = await verifyPrivyToken(req.headers.get("authorization"));
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reader = await prisma.creator.findUnique({
    where: { privyUserId: claims.userId },
    select: { solanaAddress: true },
  });
  if (!reader?.solanaAddress) {
    return NextResponse.json(
      { error: "Reader has no wallet on record" },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
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

  const intent = await createPaymentIntent({
    postId: post.id,
    slug: post.slug,
    amountUsdc: post.priceUsdc,
    creatorAddress: post.creator.solanaAddress,
    payerAddress: reader.solanaAddress,
  });

  return NextResponse.json({
    id: intent.id,
    memo: intent.memo,
    expiresAt: intent.expiresAt.toISOString(),
  });
}
