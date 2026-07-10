-- AlterTable
ALTER TABLE "PassPurchase" ADD COLUMN     "purchaserEmail" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PassPurchase_purchaserEmail_idx" ON "PassPurchase"("purchaserEmail");

-- CreateIndex
CREATE INDEX "PassPurchase_stripeCustomerId_idx" ON "PassPurchase"("stripeCustomerId");
