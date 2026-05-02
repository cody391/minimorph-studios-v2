-- Migration 0047: Lifetime cost and revenue tracking system

-- Add economics columns to leads table
ALTER TABLE `leads`
  ADD COLUMN `totalCostCents` int NOT NULL DEFAULT 0,
  ADD COLUMN `totalRevenueCents` int NOT NULL DEFAULT 0,
  ADD COLUMN `lastCostUpdate` timestamp NULL;

-- Add economics columns to customers table
ALTER TABLE `customers`
  ADD COLUMN `totalLifetimeCostCents` int NOT NULL DEFAULT 0,
  ADD COLUMN `totalLifetimeRevenueCents` int NOT NULL DEFAULT 0,
  ADD COLUMN `lastEconomicsUpdate` timestamp NULL;

-- Create lead_costs table for per-transaction cost tracking
CREATE TABLE `lead_costs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `leadId` int,
  `scrapedBusinessId` int,
  `customerId` int,
  `costType` enum(
    'scraping','enrichment','outreach_email','outreach_sms','outreach_call',
    'ai_generation','ai_conversation','ai_coaching','ai_monthly',
    'domain','hosting','commission','commission_recurring','phone_number'
  ) NOT NULL,
  `amountCents` int NOT NULL,
  `description` varchar(255),
  `tokensUsed` int,
  `durationSeconds` int,
  `repId` int,
  `month` varchar(7),
  `lc_createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `idx_lead_costs_leadId` ON `lead_costs`(`leadId`);
CREATE INDEX `idx_lead_costs_customerId` ON `lead_costs`(`customerId`);
CREATE INDEX `idx_lead_costs_month` ON `lead_costs`(`month`);
CREATE INDEX `idx_lead_costs_costType` ON `lead_costs`(`costType`);
