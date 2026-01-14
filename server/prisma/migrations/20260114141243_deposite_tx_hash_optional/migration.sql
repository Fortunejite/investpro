/*
  Warnings:

  - Made the column `actionId` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "deposits" ALTER COLUMN "txHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "actionId" SET NOT NULL,
ALTER COLUMN "txHash" DROP NOT NULL;
