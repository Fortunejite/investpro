/*
  Warnings:

  - Added the required column `img` to the `coins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coins" ADD COLUMN     "img" TEXT NOT NULL;
