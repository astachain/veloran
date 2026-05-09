-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "email" TEXT,
    "solanaAddress" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priceUsdc" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
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

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "readerAddress" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTier" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "monthlyPrice" INTEGER,
    "yearlyPrice" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "subscriberCreatorId" TEXT,
    "subscriberAddress" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unlock" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "readerCreatorId" TEXT,
    "readerAddress" TEXT NOT NULL,
    "readerType" TEXT NOT NULL,
    "amountUsdc" INTEGER NOT NULL,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_privyUserId_key" ON "Creator"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_solanaAddress_key" ON "Creator"("solanaAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_nonce_key" ON "PaymentIntent"("nonce");

-- CreateIndex
CREATE INDEX "PaymentIntent_postId_expiresAt_idx" ON "PaymentIntent"("postId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_txSignature_key" ON "PaymentReceipt"("txSignature");

-- CreateIndex
CREATE INDEX "PaymentReceipt_intentId_idx" ON "PaymentReceipt"("intentId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_postId_readerAddress_idx" ON "PaymentReceipt"("postId", "readerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_creatorId_key" ON "SubscriptionTier"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_txSignature_key" ON "Subscription"("txSignature");

-- CreateIndex
CREATE INDEX "Subscription_creatorId_subscriberAddress_expiresAt_idx" ON "Subscription"("creatorId", "subscriberAddress", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Unlock_txSignature_key" ON "Unlock"("txSignature");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTier" ADD CONSTRAINT "SubscriptionTier_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberCreatorId_fkey" FOREIGN KEY ("subscriberCreatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unlock" ADD CONSTRAINT "Unlock_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unlock" ADD CONSTRAINT "Unlock_readerCreatorId_fkey" FOREIGN KEY ("readerCreatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

