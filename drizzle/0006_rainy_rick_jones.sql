ALTER TABLE `reps` ADD `stripeConnectAccountId` varchar(128);--> statement-breakpoint
ALTER TABLE `reps` ADD `stripeConnectOnboarded` boolean DEFAULT false;