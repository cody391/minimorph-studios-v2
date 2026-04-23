CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`channel` enum('email','sms') NOT NULL DEFAULT 'email',
	`direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
	`content` text NOT NULL,
	`aiDecision` enum('answer_question','send_info','push_for_close','schedule_call','assign_to_rep','assign_to_owner','mark_not_interested','continue_nurture'),
	`aiConfidence` decimal(5,2),
	`aiReasoning` text,
	`handedOffToRepId` int,
	`handedOffToOwner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enterprise_prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(32),
	`website` varchar(512),
	`industry` varchar(128),
	`estimatedEmployees` int,
	`estimatedRevenue` varchar(64),
	`linkedinUrl` varchar(512),
	`googlePlaceId` varchar(255),
	`automationOpportunities` json,
	`aiAnalysisReport` text,
	`estimatedSavings` varchar(64),
	`status` enum('identified','analyzed','report_sent','onboarding','in_progress','closed_won','closed_lost') NOT NULL DEFAULT 'identified',
	`ownerNotes` text,
	`onboardingResponses` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enterprise_prospects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_gen_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(128) NOT NULL,
	`configValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_gen_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_gen_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `outreach_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sequenceType` enum('cold_email','cold_sms','warm_email','warm_sms','follow_up') NOT NULL DEFAULT 'cold_email',
	`stepNumber` int NOT NULL DEFAULT 1,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('scheduled','sent','delivered','opened','replied','bounced','cancelled') NOT NULL DEFAULT 'scheduled',
	`subject` varchar(255),
	`body` text,
	`channel` enum('email','sms') NOT NULL DEFAULT 'email',
	`aiGenerated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outreach_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_service_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`areaName` varchar(255) NOT NULL,
	`lat` decimal(10,7) NOT NULL,
	`lng` decimal(10,7) NOT NULL,
	`radiusKm` int NOT NULL DEFAULT 25,
	`isPrimary` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_service_areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetArea` varchar(255) NOT NULL,
	`targetLat` decimal(10,7),
	`targetLng` decimal(10,7),
	`radiusKm` int NOT NULL DEFAULT 25,
	`businessTypes` json,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`totalFound` int NOT NULL DEFAULT 0,
	`totalQualified` int NOT NULL DEFAULT 0,
	`forRepId` int,
	`errorMessage` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scrape_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraped_businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scrapeJobId` int NOT NULL,
	`googlePlaceId` varchar(255) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`address` varchar(512),
	`phone` varchar(32),
	`website` varchar(512),
	`rating` decimal(3,1),
	`reviewCount` int DEFAULT 0,
	`businessTypes` json,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`hasWebsite` boolean NOT NULL DEFAULT false,
	`websiteScore` int,
	`websiteIssues` json,
	`qualified` boolean NOT NULL DEFAULT false,
	`convertedToLeadId` int,
	`status` enum('scraped','scoring','scored','enriching','enriched','qualified','disqualified','converted') NOT NULL DEFAULT 'scraped',
	`enrichmentData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scraped_businesses_id` PRIMARY KEY(`id`)
);
