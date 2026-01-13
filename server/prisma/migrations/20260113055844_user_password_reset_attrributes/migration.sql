-- AlterTable
ALTER TABLE "users" ADD COLUMN     "forgetPasswordToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
