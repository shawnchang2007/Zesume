-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('CUSTOM_TEMPLATE_PASS');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('RESUME_GENERATION', 'CUSTOM_TEMPLATE_PARSE', 'PROFILE_IMPORT');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PROCESSING', 'READY', 'LOCKED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "GenerationSource" AS ENUM ('UPLOAD', 'PROFILE', 'COMBINED');

-- CreateEnum
CREATE TYPE "CareerItemType" AS ENUM ('EDUCATION', 'EMPLOYMENT', 'INTERNSHIP', 'PROJECT', 'RESEARCH', 'AWARD', 'ACTIVITY', 'COMPETITION', 'CERTIFICATION', 'COURSEWORK');

-- DropIndex
DROP INDEX "resume_generations_userId_idx";

-- DropIndex
DROP INDEX "resume_generations_createdAt_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "preferredLanguage" TEXT,
ADD COLUMN     "preferredTone" TEXT,
ADD COLUMN     "resumeLength" TEXT,
ADD COLUMN     "school" TEXT,
ADD COLUMN     "spellingStyle" TEXT,
ADD COLUMN     "targetLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "resume_generations" ADD COLUMN     "customTemplateId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileConflicts" JSONB,
ADD COLUMN     "profileFieldsUsed" JSONB,
ADD COLUMN     "source" "GenerationSource" NOT NULL DEFAULT 'UPLOAD';

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntitlementType" NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "remainingQuantity" INTEGER NOT NULL DEFAULT 1,
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UsageType" NOT NULL,
    "generationId" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "parsedSchema" JSONB,
    "previewText" TEXT,
    "status" "TemplateStatus" NOT NULL,
    "createdWithPass" BOOLEAN NOT NULL DEFAULT false,
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CareerItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "rawContent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "career_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_item_bullets" (
    "id" TEXT NOT NULL,
    "careerItemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "targetTemplate" TEXT,
    "tone" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_item_bullets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_item_skills" (
    "id" TEXT NOT NULL,
    "careerItemId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "career_item_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_item_tags" (
    "id" TEXT NOT NULL,
    "careerItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "career_item_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_import_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parsedData" JSONB NOT NULL,
    "warnings" JSONB,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_import_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_providerSubscriptionId_key" ON "subscriptions"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_providerCustomerId_idx" ON "subscriptions"("providerCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_providerPaymentId_key" ON "entitlements"("providerPaymentId");

-- CreateIndex
CREATE INDEX "entitlements_userId_type_status_idx" ON "entitlements"("userId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "usage_events_generationId_key" ON "usage_events"("generationId");

-- CreateIndex
CREATE INDEX "usage_events_userId_type_createdAt_idx" ON "usage_events"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "custom_templates_userId_status_idx" ON "custom_templates"("userId", "status");

-- CreateIndex
CREATE INDEX "career_items_userId_type_deletedAt_idx" ON "career_items"("userId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "career_item_bullets_careerItemId_displayOrder_idx" ON "career_item_bullets"("careerItemId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalizedName_key" ON "skills"("normalizedName");

-- CreateIndex
CREATE INDEX "career_item_skills_skillId_idx" ON "career_item_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "career_item_skills_careerItemId_skillId_key" ON "career_item_skills"("careerItemId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "career_item_tags_tagId_idx" ON "career_item_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "career_item_tags_careerItemId_tagId_key" ON "career_item_tags"("careerItemId", "tagId");

-- CreateIndex
CREATE INDEX "resume_import_drafts_userId_status_expiresAt_idx" ON "resume_import_drafts"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "resume_generations_userId_createdAt_idx" ON "resume_generations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "resume_generations_userId_deletedAt_idx" ON "resume_generations"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "resume_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_templates" ADD CONSTRAINT "custom_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_generations" ADD CONSTRAINT "resume_generations_customTemplateId_fkey" FOREIGN KEY ("customTemplateId") REFERENCES "custom_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_items" ADD CONSTRAINT "career_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_bullets" ADD CONSTRAINT "career_item_bullets_careerItemId_fkey" FOREIGN KEY ("careerItemId") REFERENCES "career_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_skills" ADD CONSTRAINT "career_item_skills_careerItemId_fkey" FOREIGN KEY ("careerItemId") REFERENCES "career_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_skills" ADD CONSTRAINT "career_item_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_tags" ADD CONSTRAINT "career_item_tags_careerItemId_fkey" FOREIGN KEY ("careerItemId") REFERENCES "career_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_tags" ADD CONSTRAINT "career_item_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_import_drafts" ADD CONSTRAINT "resume_import_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
