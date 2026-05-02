ALTER TABLE `onboarding_projects` ADD COLUMN `cloudflareProjectName` varchar(200);--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `autoRenew` tinyint(1) NOT NULL DEFAULT 1;
