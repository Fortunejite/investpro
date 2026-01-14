/*
  Warnings:

  - Made the column `profit` on table `investments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "investments" ALTER COLUMN "profit" SET NOT NULL;
