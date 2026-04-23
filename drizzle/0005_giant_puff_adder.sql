CREATE TABLE `rep_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`type` enum('call','email','meeting','proposal','follow_up','note','deal_closed') NOT NULL,
	`leadId` int,
	`customerId` int,
	`subject` varchar(255),
	`notes` text,
	`outcome` enum('connected','voicemail','no_answer','scheduled','sent','completed','cancelled'),
	`followUpAt` timestamp,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`photoUrl` varchar(1024),
	`availability` enum('full_time','part_time') NOT NULL DEFAULT 'full_time',
	`hoursPerWeek` int NOT NULL DEFAULT 40,
	`salesExperience` enum('none','1_2_years','3_5_years','5_plus_years') NOT NULL DEFAULT 'none',
	`previousIndustries` json,
	`motivation` text,
	`linkedinUrl` varchar(512),
	`referredBy` varchar(255),
	`agreedToTerms` boolean NOT NULL DEFAULT false,
	`agreedToTaxInfo` boolean NOT NULL DEFAULT false,
	`stripeConnectAccountId` varchar(128),
	`stripeConnectOnboarded` boolean NOT NULL DEFAULT false,
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('intro','follow_up','proposal','close','check_in','referral') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`variables` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `rep_email_templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rep_gamification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`level` enum('rookie','closer','ace','elite','legend') NOT NULL DEFAULT 'rookie',
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`badges` json,
	`monthlyDeals` int NOT NULL DEFAULT 0,
	`monthlyResetAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_gamification_id` PRIMARY KEY(`id`),
	CONSTRAINT `rep_gamification_repId_unique` UNIQUE(`repId`)
);
--> statement-breakpoint
CREATE TABLE `rep_quiz_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL DEFAULT false,
	`answers` json,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_quiz_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_sent_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`templateId` int,
	`leadId` int,
	`customerId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`status` enum('sent','delivered','opened','clicked','bounced') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_sent_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_training_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`estimatedMinutes` int NOT NULL DEFAULT 15,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_training_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `rep_training_modules_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rep_training_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`moduleId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_training_progress_id` PRIMARY KEY(`id`)
);
