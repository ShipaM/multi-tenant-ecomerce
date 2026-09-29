-- AlterTable
ALTER TABLE "password_reset_otps" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;
