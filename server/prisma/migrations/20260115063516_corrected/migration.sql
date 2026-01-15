/*
  Warnings:

  - You are about to drop the column `walletAccountId` on the `deposits` table. All the data in the column will be lost.
  - You are about to drop the column `walletAccountId` on the `investments` table. All the data in the column will be lost.
  - You are about to drop the column `walletAccountId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `walletAccountId` on the `withdrawals` table. All the data in the column will be lost.
  - You are about to drop the `wallet_accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountId` to the `deposits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chain` to the `deposits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perUsdRate` to the `deposits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `investments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `withdrawals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chain` to the `withdrawals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perUsdRate` to the `withdrawals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "deposits" DROP CONSTRAINT "deposits_walletAccountId_fkey";

-- DropForeignKey
ALTER TABLE "investments" DROP CONSTRAINT "investments_walletAccountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_walletAccountId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_accounts" DROP CONSTRAINT "wallet_accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_walletAccountId_fkey";

-- AlterTable
ALTER TABLE "deposits" DROP COLUMN "walletAccountId",
ADD COLUMN     "accountId" INTEGER NOT NULL,
ADD COLUMN     "chain" "Chain" NOT NULL,
ADD COLUMN     "perUsdRate" DECIMAL(18,8) NOT NULL;

-- AlterTable
ALTER TABLE "investments" DROP COLUMN "walletAccountId",
ADD COLUMN     "accountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "walletAccountId",
ADD COLUMN     "accountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "walletAccountId",
ADD COLUMN     "accountId" INTEGER NOT NULL,
ADD COLUMN     "chain" "Chain" NOT NULL,
ADD COLUMN     "perUsdRate" DECIMAL(18,8) NOT NULL;

-- DropTable
DROP TABLE "wallet_accounts";

-- CreateTable
CREATE TABLE "accounts" (
    "id" INTEGER NOT NULL,
    "availableBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastDepositAt" TIMESTAMP(3),
    "lastWithdrawalAt" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "chain" "Chain" NOT NULL,
    "label" TEXT,
    "availableBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_key" ON "accounts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_userId_chain_key" ON "assets"("userId", "chain");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
