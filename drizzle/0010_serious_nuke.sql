CREATE TABLE `ai_coaching_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`communicationType` enum('email','sms','call') NOT NULL,
	`referenceId` int NOT NULL,
	`overallScore` int,
	`strengths` json,
	`improvements` json,
	`detailedFeedback` text,
	`toneAnalysis` enum('professional','friendly','aggressive','passive','confident','uncertain'),
	`sentimentScore` int,
	`keyTakeaways` json,
	`suggestedFollowUp` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_coaching_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`leadId` int,
	`customerId` int,
	`direction` enum('outbound','inbound') NOT NULL,
	`fromNumber` varchar(20) NOT NULL,
	`toNumber` varchar(20) NOT NULL,
	`twilioCallSid` varchar(64),
	`status` enum('initiated','ringing','in_progress','completed','busy','no_answer','failed','canceled') NOT NULL DEFAULT 'initiated',
	`duration` int,
	`recordingUrl` text,
	`recordingSid` varchar(64),
	`transcription` text,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`leadId` int,
	`customerId` int,
	`direction` enum('outbound','inbound') NOT NULL,
	`fromNumber` varchar(20) NOT NULL,
	`toNumber` varchar(20) NOT NULL,
	`body` text NOT NULL,
	`twilioSid` varchar(64),
	`status` enum('queued','sent','delivered','failed','received') NOT NULL DEFAULT 'queued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('best_practice','common_mistake','technique','objection_handling','closing_strategy') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`exampleSnippets` json,
	`insightCommType` enum('email','sms','call','all') NOT NULL DEFAULT 'all',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_insights_id` PRIMARY KEY(`id`)
);
