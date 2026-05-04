-- Migration 0049: Schema recovery
-- Idempotently applies all DDL from 0043-0048 that may not have run.
-- Uses CREATE TABLE IF NOT EXISTS and SET/PREPARE/EXECUTE for column adds.

-- ═══════════════════════════════════════════════════════
-- TABLES FROM 0043
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `customerId` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `category` enum('billing','technical','website_change','general','other') NOT NULL DEFAULT 'general',
  `customerRating` int,
  `ratingToken` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `support_ticket_replies` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `ticketId` int NOT NULL,
  `authorId` int NOT NULL,
  `authorRole` enum('customer','admin') NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `rep_messages` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `repId` int NOT NULL,
  `senderRole` enum('rep','admin') NOT NULL,
  `body` text NOT NULL,
  `readAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint

-- product_catalog: create with ALL columns (includes 0048 additions)
CREATE TABLE IF NOT EXISTS `product_catalog` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `productKey` varchar(64) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` enum('package','addon','one_time') NOT NULL DEFAULT 'package',
  `basePrice` decimal(10,2) NOT NULL,
  `discountPercent` int NOT NULL DEFAULT 0,
  `discountDuration` enum('once','repeating','forever') NOT NULL DEFAULT 'once',
  `stripePriceId` varchar(128),
  `stripeProductId` varchar(100) DEFAULT NULL,
  `stripeDiscountPriceId` varchar(100) DEFAULT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `subject` varchar(255) NOT NULL,
  `audience` enum('all_customers','active_contracts','all_reps','all_leads') NOT NULL,
  `body` text NOT NULL,
  `recipientCount` int NOT NULL DEFAULT 0,
  `status` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
  `sentAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0043 (users, leads, contracts)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='needsStripeConnect')>0, 'SELECT 1', 'ALTER TABLE users ADD COLUMN needsStripeConnect boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- leads.source enum — only modify if website_popup is not already present
SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='source' AND COLUMN_TYPE LIKE '%website_popup%')>0, 'SELECT 1', 'ALTER TABLE leads MODIFY COLUMN source enum(''ai_sourced'',''website_form'',''referral'',''manual'',''website_popup'') NOT NULL DEFAULT ''ai_sourced''');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contracts' AND COLUMN_NAME='contractSignedUserAgent')>0, 'SELECT 1', 'ALTER TABLE contracts ADD COLUMN contractSignedUserAgent varchar(500)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contracts' AND COLUMN_NAME='pdfUrl')>0, 'SELECT 1', 'ALTER TABLE contracts ADD COLUMN pdfUrl varchar(512)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0044 (support_tickets, commissions)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='support_tickets' AND COLUMN_NAME='customerRating')>0, 'SELECT 1', 'ALTER TABLE support_tickets ADD COLUMN customerRating int');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='support_tickets' AND COLUMN_NAME='ratingToken')>0, 'SELECT 1', 'ALTER TABLE support_tickets ADD COLUMN ratingToken varchar(64)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='commissions' AND COLUMN_NAME='rateApplied')>0, 'SELECT 1', 'ALTER TABLE commissions ADD COLUMN rateApplied decimal(5,2)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- TABLES FROM 0045
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `scoring_model` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `modelVersion` varchar(64) NOT NULL,
  `weights` json NOT NULL,
  `trainingSize` int NOT NULL DEFAULT 0,
  `accuracy` decimal(5,4),
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0045 (leads)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='emailVerified')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN emailVerified boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='intelligenceCard')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN intelligenceCard json');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='checkoutSentAt')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN checkoutSentAt timestamp');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='checkoutUrl')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN checkoutUrl varchar(512)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='selfClosed')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN selfClosed boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='excludedReason')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN excludedReason varchar(100)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- TABLES FROM 0046
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `coaching_insights` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `feedbackId` int NOT NULL,
  `repId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `lessonContent` text NOT NULL,
  `ci_category` enum('objection_handling','closing','rapport','discovery','product_knowledge','tone','follow_up','listening','urgency','personalization') NOT NULL,
  `ci_status` enum('pending_review','published','rejected') NOT NULL DEFAULT 'pending_review',
  `publishedAt` timestamp,
  `publishedBy` int,
  `ci_createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `rep_availability` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `repId` int NOT NULL,
  `dayOfWeek` int NOT NULL,
  `startTime` varchar(5) NOT NULL,
  `endTime` varchar(5) NOT NULL,
  `isAvailable` boolean NOT NULL DEFAULT true,
  `timezone` varchar(64) NOT NULL DEFAULT 'America/Chicago',
  `ra_createdAt` timestamp NOT NULL DEFAULT (now()),
  `ra_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `settingKey` varchar(128) NOT NULL,
  `settingValue` text NOT NULL,
  `description` text,
  `ss_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int,
  UNIQUE KEY `system_settings_key_unique` (`settingKey`)
);
--> statement-breakpoint

-- Seed default system settings (INSERT IGNORE = no-op if already present)
INSERT IGNORE INTO `system_settings` (`settingKey`, `settingValue`, `description`) VALUES
  ('lead_engine_active', 'true', 'Master switch for the entire lead generation engine'),
  ('job_scraper_active', 'true', 'Enable/disable the Google Maps scraping job'),
  ('job_scorer_active', 'true', 'Enable/disable the website scoring job'),
  ('job_enrichment_active', 'true', 'Enable/disable the business enrichment job'),
  ('job_outreach_active', 'true', 'Enable/disable the automated outreach job'),
  ('job_auto_feed_active', 'true', 'Enable/disable the auto-feed reps job'),
  ('job_reengagement_active', 'true', 'Enable/disable the cold lead re-engagement job'),
  ('daily_sms_cap', '50', 'Maximum SMS messages per rep per day'),
  ('daily_email_cap', '200', 'Maximum emails per rep per day'),
  ('daily_call_cap', '100', 'Maximum calls per rep per day'),
  ('outreach_start_hour', '8', 'Earliest hour for outreach (local time, 0-23)'),
  ('outreach_end_hour', '21', 'Latest hour for outreach (local time, 0-23)');
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0046 (reps, ai_coaching_feedback)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reps' AND COLUMN_NAME='assignedPhoneNumber')>0, 'SELECT 1', 'ALTER TABLE reps ADD COLUMN assignedPhoneNumber varchar(32)');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reps' AND COLUMN_NAME='voicemailMessage')>0, 'SELECT 1', 'ALTER TABLE reps ADD COLUMN voicemailMessage text');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reps' AND COLUMN_NAME='lastTrainingCompletedAt')>0, 'SELECT 1', 'ALTER TABLE reps ADD COLUMN lastTrainingCompletedAt timestamp');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reps' AND COLUMN_NAME='trainingRequiredToday')>0, 'SELECT 1', 'ALTER TABLE reps ADD COLUMN trainingRequiredToday boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_coaching_feedback' AND COLUMN_NAME='promotableToAcademy')>0, 'SELECT 1', 'ALTER TABLE ai_coaching_feedback ADD COLUMN promotableToAcademy boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_coaching_feedback' AND COLUMN_NAME='promotionReason')>0, 'SELECT 1', 'ALTER TABLE ai_coaching_feedback ADD COLUMN promotionReason text');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_coaching_feedback' AND COLUMN_NAME='promotedToAcademy')>0, 'SELECT 1', 'ALTER TABLE ai_coaching_feedback ADD COLUMN promotedToAcademy boolean NOT NULL DEFAULT false');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_coaching_feedback' AND COLUMN_NAME='promotedAt')>0, 'SELECT 1', 'ALTER TABLE ai_coaching_feedback ADD COLUMN promotedAt timestamp');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ai_coaching_feedback' AND COLUMN_NAME='promotedBy')>0, 'SELECT 1', 'ALTER TABLE ai_coaching_feedback ADD COLUMN promotedBy int');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- TABLES FROM 0047
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `lead_costs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `leadId` int,
  `scrapedBusinessId` int,
  `customerId` int,
  `costType` enum('scraping','enrichment','outreach_email','outreach_sms','outreach_call','ai_generation','ai_conversation','ai_coaching','ai_monthly','domain','hosting','commission','commission_recurring','phone_number') NOT NULL,
  `amountCents` int NOT NULL,
  `description` varchar(255),
  `tokensUsed` int,
  `durationSeconds` int,
  `repId` int,
  `month` varchar(7),
  `lc_createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0047 (leads, customers)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='totalCostCents')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN totalCostCents int NOT NULL DEFAULT 0');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='totalRevenueCents')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN totalRevenueCents int NOT NULL DEFAULT 0');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='lastCostUpdate')>0, 'SELECT 1', 'ALTER TABLE leads ADD COLUMN lastCostUpdate timestamp NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customers' AND COLUMN_NAME='totalLifetimeCostCents')>0, 'SELECT 1', 'ALTER TABLE customers ADD COLUMN totalLifetimeCostCents int NOT NULL DEFAULT 0');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customers' AND COLUMN_NAME='totalLifetimeRevenueCents')>0, 'SELECT 1', 'ALTER TABLE customers ADD COLUMN totalLifetimeRevenueCents int NOT NULL DEFAULT 0');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customers' AND COLUMN_NAME='lastEconomicsUpdate')>0, 'SELECT 1', 'ALTER TABLE customers ADD COLUMN lastEconomicsUpdate timestamp NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- COLUMNS FROM 0048 (product_catalog new columns, contracts)
-- These add to product_catalog IF it existed before (i.e., 0043 ran but 0048 didn't)
-- ═══════════════════════════════════════════════════════

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_catalog' AND COLUMN_NAME='discountDuration')>0, 'SELECT 1', 'ALTER TABLE product_catalog ADD COLUMN discountDuration enum(''once'',''repeating'',''forever'') NOT NULL DEFAULT ''once''');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_catalog' AND COLUMN_NAME='stripeProductId')>0, 'SELECT 1', 'ALTER TABLE product_catalog ADD COLUMN stripeProductId varchar(100) DEFAULT NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_catalog' AND COLUMN_NAME='stripeDiscountPriceId')>0, 'SELECT 1', 'ALTER TABLE product_catalog ADD COLUMN stripeDiscountPriceId varchar(100) DEFAULT NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contracts' AND COLUMN_NAME='originalPriceCents')>0, 'SELECT 1', 'ALTER TABLE contracts ADD COLUMN originalPriceCents int DEFAULT NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contracts' AND COLUMN_NAME='effectivePriceCents')>0, 'SELECT 1', 'ALTER TABLE contracts ADD COLUMN effectivePriceCents int DEFAULT NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

SET @s = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contracts' AND COLUMN_NAME='contractDiscountPercent')>0, 'SELECT 1', 'ALTER TABLE contracts ADD COLUMN contractDiscountPercent decimal(5,2) DEFAULT NULL');
--> statement-breakpoint
PREPARE r FROM @s;
--> statement-breakpoint
EXECUTE r;
--> statement-breakpoint
DEALLOCATE PREPARE r;
--> statement-breakpoint

-- ═══════════════════════════════════════════════════════
-- INDEXES FROM 0047 (idempotent — CREATE INDEX IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS `idx_lead_costs_leadId` ON `lead_costs`(`leadId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_lead_costs_customerId` ON `lead_costs`(`customerId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_lead_costs_month` ON `lead_costs`(`month`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_lead_costs_costType` ON `lead_costs`(`costType`);
