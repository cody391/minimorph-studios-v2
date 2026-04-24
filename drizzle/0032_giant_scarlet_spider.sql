ALTER TABLE `onboarding_projects` ADD `needsCustomQuote` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD `reviewFlags` json;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD `complexityScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD `adminReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD `adminReviewNotes` text;