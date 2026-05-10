-- Migration 0052: Onboarding project attribution bridge
-- Adds leadId and acquisitionSource to onboarding_projects so AI-drip leads
-- can be durably linked to their Elena session before checkout.
-- Both columns are nullable — no backfill required.

ALTER TABLE `onboarding_projects` ADD COLUMN IF NOT EXISTS `leadId` int DEFAULT NULL;
ALTER TABLE `onboarding_projects` ADD COLUMN IF NOT EXISTS `acquisitionSource` varchar(64) DEFAULT NULL;
