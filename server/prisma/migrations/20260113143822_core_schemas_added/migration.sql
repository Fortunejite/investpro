/*
  Warnings:

  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "userStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('eth', 'bsc', 'polygon', 'sol');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('daily', 'weekly', 'monthly', 'end_of_term');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('active', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "status" "userStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "wallet_accounts" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "chain" "Chain" NOT NULL,
    "label" TEXT,
    "availableBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastDepositAt" TIMESTAMP(3),
    "lastWithdrawalAt" TIMESTAMP(3),

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "roiPercent" INTEGER NOT NULL,
    "payoutType" "PayoutType" NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "profit" DECIMAL(18,8),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accounts_userId_chain_key" ON "wallet_accounts"("userId", "chain");

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
