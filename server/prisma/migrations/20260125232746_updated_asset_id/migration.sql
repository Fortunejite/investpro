/*
  Warnings:

  - The values [swap] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `assets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `assets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `fromAssetId` on the `swaps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toAssetId` on the `swaps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('deposit', 'withdrawal', 'withdrawal_cancellation', 'withdrawal_rejected', 'investment', 'profit_payout', 'signal_subscription');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "swaps" DROP CONSTRAINT "swaps_fromAssetId_fkey";

-- DropForeignKey
ALTER TABLE "swaps" DROP CONSTRAINT "swaps_toAssetId_fkey";

-- AlterTable
ALTER TABLE "assets" DROP CONSTRAINT "assets_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "swaps" DROP COLUMN "fromAssetId",
ADD COLUMN     "fromAssetId" INTEGER NOT NULL,
DROP COLUMN "toAssetId",
ADD COLUMN     "toAssetId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "swaps" ADD CONSTRAINT "swaps_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swaps" ADD CONSTRAINT "swaps_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
