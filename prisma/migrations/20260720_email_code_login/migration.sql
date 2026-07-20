-- CreateTable
CREATE TABLE "email_login_codes" (
    "id" TEXT NOT NULL,
    "identifierHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_login_codes_identifierHash_createdAt_idx" ON "email_login_codes"("identifierHash", "createdAt");

-- CreateIndex
CREATE INDEX "email_login_codes_expiresAt_idx" ON "email_login_codes"("expiresAt");
