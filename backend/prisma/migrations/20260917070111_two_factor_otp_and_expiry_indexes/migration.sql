-- CreateTable
CREATE TABLE "two_factor_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factor_otps_user_id_idx" ON "two_factor_otps"("user_id");

-- CreateIndex
CREATE INDEX "two_factor_otps_expires_at_idx" ON "two_factor_otps"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_otps_expires_at_idx" ON "password_reset_otps"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "two_factor_otps" ADD CONSTRAINT "two_factor_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
