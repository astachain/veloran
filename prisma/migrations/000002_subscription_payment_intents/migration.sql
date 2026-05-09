-- CreateTable
CREATE TABLE "SubscriptionPaymentIntent" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "subscriberCreatorId" TEXT,
    "subscriberAddress" TEXT,
    "plan" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "nonce" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPaymentIntent_nonce_key" ON "SubscriptionPaymentIntent"("nonce");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentIntent_creatorId_expiresAt_idx" ON "SubscriptionPaymentIntent"("creatorId", "expiresAt");

