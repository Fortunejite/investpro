/*
  Warnings:

  - The values [completed] on the enum `InvestmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `duration` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxAmount` on the `plans` table. All the data in the column will be lost.
  - Added the required column `durationInDays` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxReturnPercent` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minReturnPercent` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvestmentStatus_new" AS ENUM ('active', 'inactive', 'expired', 'cancelled');
ALTER TABLE "public"."investments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "investments" ALTER COLUMN "status" TYPE "InvestmentStatus_new" USING ("status"::text::"InvestmentStatus_new");
ALTER TYPE "InvestmentStatus" RENAME TO "InvestmentStatus_old";
ALTER TYPE "InvestmentStatus_new" RENAME TO "InvestmentStatus";
DROP TYPE "public"."InvestmentStatus_old";
ALTER TABLE "investments" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "duration",
DROP COLUMN "maxAmount",
ADD COLUMN     "durationInDays" INTEGER NOT NULL,
ADD COLUMN     "maxReturnPercent" INTEGER NOT NULL,
ADD COLUMN     "minReturnPercent" INTEGER NOT NULL;
