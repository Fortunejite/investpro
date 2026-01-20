/*
  Warnings:

  - Added the required column `amount` to the `trade_signal_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trade_signal_subscriptions" ADD COLUMN     "amount" DECIMAL(18,8) NOT NULL;
