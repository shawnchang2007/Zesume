-- Extend Career Memory with user-facing categories and explicit memory controls.
ALTER TYPE "CareerItemType" ADD VALUE IF NOT EXISTS 'SKILL';
ALTER TYPE "CareerItemType" ADD VALUE IF NOT EXISTS 'VOLUNTEERING';

ALTER TABLE "career_items"
ADD COLUMN "optimizedDescription" TEXT,
ADD COLUMN "memoryEnabled" BOOLEAN NOT NULL DEFAULT true;
