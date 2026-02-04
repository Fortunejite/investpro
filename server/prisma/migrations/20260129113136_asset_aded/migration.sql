/*
  Warnings:

  - Added the required column `asset` to the `Positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Positions" ADD COLUMN     "asset" TEXT NOT NULL,
ALTER COLUMN "collateral" DROP DEFAULT,
ALTER COLUMN "notional" DROP DEFAULT,
ALTER COLUMN "entryPrice" DROP DEFAULT,
ALTER COLUMN "qty" DROP DEFAULT,
ALTER COLUMN "closePrice" DROP DEFAULT,
ALTER COLUMN "pnl" DROP NOT NULL,
ALTER COLUMN "pnl" DROP DEFAULT,
ALTER COLUMN "maintenanceMarginPct" DROP NOT NULL,
ALTER COLUMN "maintenanceMarginPct" DROP DEFAULT;
