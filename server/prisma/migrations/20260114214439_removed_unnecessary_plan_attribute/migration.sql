/*
  Warnings:

  - You are about to drop the column `maxReturnPercent` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `minReturnPercent` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "maxReturnPercent",
DROP COLUMN "minReturnPercent";
