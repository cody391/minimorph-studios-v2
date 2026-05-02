ALTER TABLE `onboarding_projects` ADD COLUMN `domainName` varchar(255);--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `domainRegistered` tinyint(1) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `hostingSetup` tinyint(1) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `sslSetup` tinyint(1) DEFAULT 0;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `contractText` longtext;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `contractSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `contractSignedIp` varchar(64);
