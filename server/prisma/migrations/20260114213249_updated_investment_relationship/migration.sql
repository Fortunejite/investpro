/*
  Warnings:

  - You are about to drop the column `userId` on the `investments` table. All the data in the column will be lost.
  - Added the required column `walletAccountId` to the `investments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "investments" DROP CONSTRAINT "investments_userId_fkey";

-- AlterTable
ALTER TABLE "investments" DROP COLUMN "userId",
ADD COLUMN     "walletAccountId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_walletAccountId_fkey" FOREIGN KEY ("walletAccountId") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
