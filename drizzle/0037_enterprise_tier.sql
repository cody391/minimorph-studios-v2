ALTER TABLE `contracts` MODIFY COLUMN `packageTier` enum('starter','growth','premium','enterprise') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `packageTier` enum('starter','growth','premium','enterprise') NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_projects` MODIFY COLUMN `packageTier` enum('starter','growth','premium','enterprise') NOT NULL;
