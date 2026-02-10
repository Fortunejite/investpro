/*
  Warnings:

  - You are about to drop the `Positions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Positions";

-- CreateTable
CREATE TABLE "positions" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "coinId" TEXT NOT NULL,
    "side" "PositionSide" NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'open',
    "leverage" INTEGER NOT NULL,
    "margin" DECIMAL(18,8) NOT NULL,
    "notional" DECIMAL(18,8) NOT NULL,
    "entryPrice" DECIMAL(18,8) NOT NULL,
    "size" DECIMAL(18,8) NOT NULL,
    "closePrice" DECIMAL(18,8),
    "pnl" DECIMAL(18,8),
    "originalPositionId" UUID,
    "openAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_originalPositionId_fkey" FOREIGN KEY ("originalPositionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
