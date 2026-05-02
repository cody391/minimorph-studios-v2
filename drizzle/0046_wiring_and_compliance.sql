-- Part 1: Per-rep Twilio phone + Part 5: Training gate + Part 10: Voicemail
ALTER TABLE `reps`
  ADD COLUMN `assignedPhoneNumber` varchar(32),
  ADD COLUMN `voicemailMessage` text,
  ADD COLUMN `lastTrainingCompletedAt` timestamp,
  ADD COLUMN `trainingRequiredToday` boolean NOT NULL DEFAULT false;
--> statement-breakpoint

-- Part 3/4: Coaching → Academy promotion pipeline fields
ALTER TABLE `ai_coaching_feedback`
  ADD COLUMN `promotableToAcademy` boolean NOT NULL DEFAULT false,
  ADD COLUMN `promotionReason` text,
  ADD COLUMN `promotedToAcademy` boolean NOT NULL DEFAULT false,
  ADD COLUMN `promotedAt` timestamp,
  ADD COLUMN `promotedBy` int;
--> statement-breakpoint

-- Part 4: Admin-curated coaching lessons
CREATE TABLE `coaching_insights` (
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

-- Part 6: Rep availability calendar
CREATE TABLE `rep_availability` (
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

-- Part 7: Global system settings with lead engine flags
CREATE TABLE `system_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `settingKey` varchar(128) NOT NULL,
  `settingValue` text NOT NULL,
  `description` text,
  `ss_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int,
  UNIQUE KEY `system_settings_key_unique` (`settingKey`)
);
--> statement-breakpoint

-- Seed default system settings
INSERT INTO `system_settings` (`settingKey`, `settingValue`, `description`) VALUES
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
