import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const statements = [
  `CREATE TABLE IF NOT EXISTS "PaymentIntent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "payerAddress" TEXT,
    "nonce" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "readerAddress" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_nonce_key" ON "PaymentIntent"("nonce")`,
  `CREATE INDEX IF NOT EXISTS "PaymentIntent_postId_expiresAt_idx" ON "PaymentIntent"("postId", "expiresAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReceipt_txSignature_key" ON "PaymentReceipt"("txSignature")`,
  `CREATE INDEX IF NOT EXISTS "PaymentReceipt_intentId_idx" ON "PaymentReceipt"("intentId")`,
  `CREATE INDEX IF NOT EXISTS "PaymentReceipt_postId_readerAddress_idx" ON "PaymentReceipt"("postId", "readerAddress")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentIntent_postId_fkey') THEN
      ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReceipt_intentId_fkey') THEN
      ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_intentId_fkey"
      FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,
];

export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATION_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  const [paymentIntentCount, paymentReceiptCount] = await Promise.all([
    prisma.paymentIntent.count(),
    prisma.paymentReceipt.count(),
  ]);

  return NextResponse.json({
    ok: true,
    paymentIntentCount,
    paymentReceiptCount,
  });
}
