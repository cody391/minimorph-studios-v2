CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`contractId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` enum('initial_sale','renewal','upsell') NOT NULL DEFAULT 'initial_sale',
	`status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`businessName` varchar(255),
	`message` text,
	`convertedToLeadId` int,
	`status` enum('new','reviewed','converted','archived') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`repId` int NOT NULL,
	`packageTier` enum('starter','growth','premium') NOT NULL,
	`monthlyPrice` decimal(8,2) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','expiring_soon','expired','renewed','cancelled') NOT NULL DEFAULT 'active',
	`renewalStatus` enum('not_started','nurturing','proposed','accepted','declined') NOT NULL DEFAULT 'not_started',
	`websitePages` int NOT NULL DEFAULT 5,
	`features` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`leadId` int,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`industry` varchar(128),
	`website` varchar(512),
	`healthScore` int NOT NULL DEFAULT 100,
	`status` enum('active','at_risk','churned') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`industry` varchar(128),
	`website` varchar(512),
	`source` enum('ai_sourced','website_form','referral','manual') NOT NULL DEFAULT 'ai_sourced',
	`temperature` enum('cold','warm','hot') NOT NULL DEFAULT 'cold',
	`qualificationScore` int NOT NULL DEFAULT 0,
	`stage` enum('new','enriched','warming','warm','assigned','contacted','proposal_sent','negotiating','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`assignedRepId` int,
	`notes` text,
	`enrichmentData` json,
	`lastTouchAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nurture_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`type` enum('check_in','support_request','update_request','feedback','upsell_attempt','renewal_outreach','report_delivery') NOT NULL,
	`channel` enum('email','sms','in_app','phone') NOT NULL DEFAULT 'email',
	`subject` varchar(255),
	`content` text,
	`status` enum('scheduled','sent','delivered','opened','responded','resolved') NOT NULL DEFAULT 'scheduled',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nurture_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`reportMonth` varchar(7) NOT NULL,
	`pageViews` int DEFAULT 0,
	`uniqueVisitors` int DEFAULT 0,
	`bounceRate` decimal(5,2),
	`avgSessionDuration` int DEFAULT 0,
	`topPages` json,
	`conversionRate` decimal(5,2),
	`recommendations` text,
	`status` enum('draft','generated','delivered') NOT NULL DEFAULT 'draft',
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`status` enum('applied','onboarding','training','certified','active','suspended','inactive') NOT NULL DEFAULT 'applied',
	`trainingProgress` int NOT NULL DEFAULT 0,
	`certifiedAt` timestamp,
	`performanceScore` decimal(5,2) DEFAULT '0.00',
	`totalDeals` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(12,2) DEFAULT '0.00',
	`bio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upsell_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`type` enum('tier_upgrade','add_pages','add_feature','add_service') NOT NULL DEFAULT 'tier_upgrade',
	`title` varchar(255) NOT NULL,
	`description` text,
	`estimatedValue` decimal(10,2),
	`status` enum('identified','proposed','accepted','declined','completed') NOT NULL DEFAULT 'identified',
	`proposedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `upsell_opportunities_id` PRIMARY KEY(`id`)
);
