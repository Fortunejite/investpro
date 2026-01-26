/*
  Warnings:

  - The primary key for the `coins` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_coinId_fkey";

-- AlterTable
ALTER TABLE "assets" ALTER COLUMN "coinId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "coins" DROP CONSTRAINT "coins_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "coins_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
