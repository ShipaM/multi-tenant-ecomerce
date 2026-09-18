-- CreateEnum
CREATE TYPE "TwoFactorOtpPurpose" AS ENUM ('ENABLE_TOGGLE', 'LOGIN');

-- AlterTable
ALTER TABLE "two_factor_otps" ADD COLUMN "purpose" "TwoFactorOtpPurpose" NOT NULL DEFAULT 'ENABLE_TOGGLE';
