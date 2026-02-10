/*
  Warnings:

  - The values [BUY,SELL] on the enum `PositionSide` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `asset` on the `Positions` table. All the data in the column will be lost.
  - You are about to drop the column `collateral` on the `Positions` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceMarginPct` on the `Positions` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Positions` table. All the data in the column will be lost.
  - Added the required column `coinId` to the `Positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `margin` to the `Positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PositionSide_new" AS ENUM ('long', 'short');
ALTER TABLE "Positions" ALTER COLUMN "side" TYPE "PositionSide_new" USING ("side"::text::"PositionSide_new");
ALTER TYPE "PositionSide" RENAME TO "PositionSide_old";
ALTER TYPE "PositionSide_new" RENAME TO "PositionSide";
DROP TYPE "public"."PositionSide_old";
COMMIT;

-- AlterTable
ALTER TABLE "Positions" DROP COLUMN "asset",
DROP COLUMN "collateral",
DROP COLUMN "maintenanceMarginPct",
DROP COLUMN "qty",
ADD COLUMN     "coinId" TEXT NOT NULL,
ADD COLUMN     "margin" DECIMAL(18,8) NOT NULL,
ADD COLUMN     "size" DECIMAL(18,8) NOT NULL;
