-- Migration 0051: Attribution schema foundation
-- Adds attribution/routing fields to leads, customers, contracts, commissions, coupons.
-- All columns are nullable or have safe defaults — no backfill required.

-- leads
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `acquisitionChannel` varchar(128) DEFAULT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `enrichmentStatus` varchar(32) NOT NULL DEFAULT 'pending';
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `needsHumanCloser` boolean NOT NULL DEFAULT false;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `escalationReason` text DEFAULT NULL;
ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `elenaHandoffAt` timestamp NULL DEFAULT NULL;

-- customers
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `acquisitionSource` varchar(128) DEFAULT NULL;

-- contracts
ALTER TABLE `contracts` ADD COLUMN IF NOT EXISTS `salesSource` varchar(64) DEFAULT NULL;
ALTER TABLE `contracts` ADD COLUMN IF NOT EXISTS `couponCode` varchar(64) DEFAULT NULL;
ALTER TABLE `contracts` ADD COLUMN IF NOT EXISTS `campaignName` varchar(128) DEFAULT NULL;
ALTER TABLE `contracts` ADD COLUMN IF NOT EXISTS `leadId` int DEFAULT NULL;

-- commissions
ALTER TABLE `commissions` ADD COLUMN IF NOT EXISTS `basisAmountCents` int DEFAULT NULL;
ALTER TABLE `commissions` ADD COLUMN IF NOT EXISTS `requiresPayment` boolean NOT NULL DEFAULT true;

-- coupons
ALTER TABLE `coupons` ADD COLUMN IF NOT EXISTS `duration` varchar(16) NOT NULL DEFAULT 'once';
ALTER TABLE `coupons` ADD COLUMN IF NOT EXISTS `durationMonths` int DEFAULT NULL;
ALTER TABLE `coupons` ADD COLUMN IF NOT EXISTS `packageRestriction` varchar(64) NOT NULL DEFAULT 'all';
ALTER TABLE `coupons` ADD COLUMN IF NOT EXISTS `campaignName` varchar(128) DEFAULT NULL;
