-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'swap';

-- CreateTable
CREATE TABLE "swaps" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swaps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "swaps" ADD CONSTRAINT "swaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swaps" ADD CONSTRAINT "swaps_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swaps" ADD CONSTRAINT "swaps_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
