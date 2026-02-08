-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('open', 'closed', 'liquidated');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "Positions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "side" "PositionSide" NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'open',
    "leverage" INTEGER NOT NULL,
    "collateral" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "notional" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "entryPrice" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "qty" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "closePrice" DECIMAL(18,8) DEFAULT 0,
    "pnl" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "maintenanceMarginPct" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "openAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Positions_pkey" PRIMARY KEY ("id")
);
