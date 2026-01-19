/*
  Warnings:

  - Made the column `endedAt` on table `trade_signal_subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'withdrawal_cancellation';
ALTER TYPE "TransactionType" ADD VALUE 'withdrawal_rejected';
ALTER TYPE "TransactionType" ADD VALUE 'signal_subscription';

-- AlterTable
ALTER TABLE "trade_signal_subscriptions" ALTER COLUMN "endedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "actionId" DROP NOT NULL;
