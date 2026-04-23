CREATE TABLE `rep_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`type` enum('lead_assigned','lead_claimed','commission_approved','commission_paid','training_reminder','deal_closed','badge_earned','level_up','general') NOT NULL DEFAULT 'general',
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_notifications_id` PRIMARY KEY(`id`)
);
