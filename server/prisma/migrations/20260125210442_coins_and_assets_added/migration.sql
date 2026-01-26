/*
  Warnings:

  - You are about to drop the column `chain` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `assets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,coinId]` on the table `assets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `coinId` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "assets_userId_chain_key";

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "chain",
DROP COLUMN "label",
ADD COLUMN     "coinId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "coins" (
    "id" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coins_symbol_key" ON "coins"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "assets_userId_coinId_key" ON "assets"("userId", "coinId");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
