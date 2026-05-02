ALTER TABLE `onboarding_projects` ADD COLUMN `previewReadyAt` timestamp;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `revisionsRemaining` int DEFAULT 3;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `nurturingActive` tinyint(1) NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `anniversaryDay` int;--> statement-breakpoint
ALTER TABLE `contracts` ADD COLUMN `contractEndDate` timestamp;
