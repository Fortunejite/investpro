-- CreateEnum
CREATE TYPE "TradeSignalPlan" AS ENUM ('monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "TradeSignalAction" AS ENUM ('Buy', 'Sell');

-- CreateEnum
CREATE TYPE "TradeSignalStatus" AS ENUM ('published');

-- CreateEnum
CREATE TYPE "TradeSignalDeliveryStatus" AS ENUM ('queued', 'sent', 'failed');

-- CreateTable
CREATE TABLE "trade_signals" (
    "id" SERIAL NOT NULL,
    "action" "TradeSignalAction" NOT NULL,
    "currency" TEXT NOT NULL,
    "entryPrice" DECIMAL(18,8) NOT NULL,
    "tp1" DECIMAL(18,8) NOT NULL,
    "tp2" DECIMAL(18,8),
    "sl" DECIMAL(18,8) NOT NULL,
    "status" "TradeSignalStatus" NOT NULL DEFAULT 'published',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_signal_deliveries" (
    "id" TEXT NOT NULL,
    "signalId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "status" "TradeSignalDeliveryStatus" NOT NULL,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_signal_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_signal_subscriptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "plan" "TradeSignalPlan" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "trade_signal_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trade_signal_subscriptions_userId_key" ON "trade_signal_subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "trade_signal_deliveries" ADD CONSTRAINT "trade_signal_deliveries_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "trade_signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_signal_deliveries" ADD CONSTRAINT "trade_signal_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_signal_subscriptions" ADD CONSTRAINT "trade_signal_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
