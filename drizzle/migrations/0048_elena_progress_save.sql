-- Migration 0048: Elena onboarding progress persistence — never lose customer progress

ALTER TABLE `onboarding_projects`
  ADD COLUMN `elenaConversationHistory` json NULL,
  ADD COLUMN `lastSavedAt` timestamp NULL,
  ADD COLUMN `currentStep` int NOT NULL DEFAULT 1;
