-- Manual production migration for existing Veloran Postgres databases.
-- Run only after backing up the database.
-- This repo currently has no Prisma migration baseline, so do NOT blindly run
-- `prisma migrate deploy` against an existing DB until Phase 4 creates one.

CREATE TABLE IF NOT EXISTS "PaymentIntent" (
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
);

CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
  "id" TEXT NOT NULL,
  "intentId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "readerAddress" TEXT NOT NULL,
  "amountUsdc" INTEGER NOT NULL,
  "txSignature" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_nonce_key" ON "PaymentIntent"("nonce");
CREATE INDEX IF NOT EXISTS "PaymentIntent_postId_expiresAt_idx" ON "PaymentIntent"("postId", "expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReceipt_txSignature_key" ON "PaymentReceipt"("txSignature");
CREATE INDEX IF NOT EXISTS "PaymentReceipt_intentId_idx" ON "PaymentReceipt"("intentId");
CREATE INDEX IF NOT EXISTS "PaymentReceipt_postId_readerAddress_idx" ON "PaymentReceipt"("postId", "readerAddress");

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT "PaymentIntent_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentReceipt"
  ADD CONSTRAINT "PaymentReceipt_intentId_fkey"
  FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
