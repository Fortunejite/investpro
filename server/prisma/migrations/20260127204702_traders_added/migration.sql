-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'trader';

-- CreateTable
CREATE TABLE "trading_profiles" (
    "id" INTEGER NOT NULL,
    "bio" TEXT,
    "profitSharePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalProfit" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "winRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "successfulTrades" INTEGER NOT NULL DEFAULT 0,
    "minCapital" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trader_followers" (
    "id" SERIAL NOT NULL,
    "traderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trader_followers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trader_followers_traderId_userId_key" ON "trader_followers"("traderId", "userId");

-- AddForeignKey
ALTER TABLE "trading_profiles" ADD CONSTRAINT "trading_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trader_followers" ADD CONSTRAINT "trader_followers_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "trading_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
