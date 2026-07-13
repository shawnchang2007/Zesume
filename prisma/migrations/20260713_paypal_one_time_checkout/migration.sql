ALTER TABLE "subscriptions"
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "amountCents" INTEGER,
ADD COLUMN "currency" TEXT;

CREATE UNIQUE INDEX "subscriptions_providerPaymentId_key"
ON "subscriptions"("providerPaymentId");

CREATE TABLE "billing_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_provider_configs_provider_environment_key"
ON "billing_provider_configs"("provider", "environment");
