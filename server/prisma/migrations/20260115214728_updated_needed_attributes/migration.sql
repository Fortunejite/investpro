/*
  Warnings:

  - A unique constraint covering the columns `[telegramUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "trade_signal_deliveries" ALTER COLUMN "status" SET DEFAULT 'queued';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramUserId_key" ON "users"("telegramUserId");
