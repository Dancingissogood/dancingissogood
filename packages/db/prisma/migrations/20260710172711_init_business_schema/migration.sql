-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('RESERVED', 'ATTENDED', 'CANCELED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "accessDays" INTEGER NOT NULL,
    "accessStarts" TEXT NOT NULL,
    "accessEnds" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passProductId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "passStatus" "PassStatus",
    "amountTotalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructorName" TEXT,
    "locationName" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "passPurchaseId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkUserId_key" ON "UserProfile"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_stripeCustomerId_key" ON "UserProfile"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "UserProfile_email_idx" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PassProduct_slug_key" ON "PassProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PassProduct_stripePriceId_key" ON "PassProduct"("stripePriceId");

-- CreateIndex
CREATE INDEX "PassProduct_active_idx" ON "PassProduct"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PassPurchase_stripeCheckoutSessionId_key" ON "PassPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PassPurchase_stripePaymentIntentId_key" ON "PassPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PassPurchase_stripeSubscriptionId_key" ON "PassPurchase"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "PassPurchase_userId_status_idx" ON "PassPurchase"("userId", "status");

-- CreateIndex
CREATE INDEX "PassPurchase_passProductId_idx" ON "PassPurchase"("passProductId");

-- CreateIndex
CREATE INDEX "PassPurchase_paidAt_idx" ON "PassPurchase"("paidAt");

-- CreateIndex
CREATE INDEX "ClassSession_startsAt_idx" ON "ClassSession"("startsAt");

-- CreateIndex
CREATE INDEX "ClassRegistration_classSessionId_status_idx" ON "ClassRegistration"("classSessionId", "status");

-- CreateIndex
CREATE INDEX "ClassRegistration_passPurchaseId_idx" ON "ClassRegistration"("passPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegistration_userId_classSessionId_key" ON "ClassRegistration"("userId", "classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_stripeEventId_key" ON "PaymentEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_eventType_idx" ON "PaymentEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaymentEvent_processedAt_idx" ON "PaymentEvent"("processedAt");

-- AddForeignKey
ALTER TABLE "PassPurchase" ADD CONSTRAINT "PassPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassPurchase" ADD CONSTRAINT "PassPurchase_passProductId_fkey" FOREIGN KEY ("passProductId") REFERENCES "PassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistration" ADD CONSTRAINT "ClassRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistration" ADD CONSTRAINT "ClassRegistration_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistration" ADD CONSTRAINT "ClassRegistration_passPurchaseId_fkey" FOREIGN KEY ("passPurchaseId") REFERENCES "PassPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
