CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`notifCategory` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`pushEnabled` boolean NOT NULL DEFAULT true,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`ticketCategory` enum('technical','billing','lead_issue','training','feature_request','other') NOT NULL DEFAULT 'other',
	`ticketPriority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`ticketStatus` enum('open','ai_reviewed','pending_approval','approved','rejected','resolved','closed') NOT NULL DEFAULT 'open',
	`aiAnalysis` text,
	`aiSolution` text,
	`aiConfidence` decimal(3,2),
	`ownerApproval` enum('pending','approved','rejected'),
	`ownerNotes` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `smsOptedOut` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `smsOptOutAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `smsFirstMessageSent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reps` ADD `profilePhotoUrl` varchar(512);