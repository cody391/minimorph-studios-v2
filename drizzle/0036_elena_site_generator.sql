ALTER TABLE `onboarding_projects` ADD COLUMN `generationStatus` enum('idle','generating','complete','failed') DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `generationLog` text;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `generatedSiteHtml` longtext;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `generatedSiteUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `lastChangeRequest` text;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD COLUMN `changeHistory` json;
