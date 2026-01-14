-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'rejected');

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'pending';
