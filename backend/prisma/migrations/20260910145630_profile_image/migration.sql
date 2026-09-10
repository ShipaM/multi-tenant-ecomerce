-- AlterTable
ALTER TABLE "user_sessions" ALTER COLUMN "ip_address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_image" TEXT;
