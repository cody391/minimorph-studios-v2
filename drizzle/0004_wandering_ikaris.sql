CREATE TABLE `ai_chat_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int,
	`projectId` int,
	`context` enum('onboarding','portal') NOT NULL,
	`role` enum('system','user','assistant') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(8,2) NOT NULL,
	`setupFee` decimal(8,2) DEFAULT '0.00',
	`category` enum('ai_agent','widget','service','integration') NOT NULL DEFAULT 'widget',
	`features` json,
	`icon` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_catalog_id` PRIMARY KEY(`id`),
	CONSTRAINT `widget_catalog_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `upsell_opportunities` MODIFY COLUMN `type` enum('tier_upgrade','add_pages','add_feature','add_service','ai_widget') NOT NULL DEFAULT 'tier_upgrade';--> statement-breakpoint
ALTER TABLE `onboarding_projects` ADD `maxRevisions` int DEFAULT 3 NOT NULL;