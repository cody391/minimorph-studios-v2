CREATE TABLE `customer_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredEmail` varchar(320) NOT NULL,
	`referredName` varchar(255),
	`status` enum('invited','signed_up','converted') NOT NULL DEFAULT 'invited',
	`rewardGiven` boolean NOT NULL DEFAULT false,
	`convertedCustomerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nps_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`score` int,
	`feedback` text,
	`milestone` enum('30_day','6_month','annual') NOT NULL,
	`status` enum('sent','completed','expired') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nps_surveys_id` PRIMARY KEY(`id`)
);
