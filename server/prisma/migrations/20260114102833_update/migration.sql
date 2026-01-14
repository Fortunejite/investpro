/*
  Warnings:

  - The values [completed] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "public"."deposits" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "deposits" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "deposits" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
