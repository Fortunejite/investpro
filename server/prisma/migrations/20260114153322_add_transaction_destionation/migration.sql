/*
  Warnings:

  - You are about to drop the column `destination_address` on the `withdrawals` table. All the data in the column will be lost.
  - Added the required column `destinationAddress` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationAddress` to the `withdrawals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "destinationAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "destination_address",
ADD COLUMN     "destinationAddress" TEXT NOT NULL;
