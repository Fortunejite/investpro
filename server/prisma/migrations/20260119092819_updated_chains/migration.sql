/*
  Warnings:

  - The values [polygon] on the enum `Chain` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Chain_new" AS ENUM ('eth', 'bsc', 'btc', 'sol');
ALTER TABLE "assets" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TABLE "deposits" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TABLE "withdrawals" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TYPE "Chain" RENAME TO "Chain_old";
ALTER TYPE "Chain_new" RENAME TO "Chain";
DROP TYPE "public"."Chain_old";
COMMIT;
