CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`contractId` int,
	`reportMonth` varchar(7) NOT NULL,
	`competitiveReport` text,
	`isRenewalMonth` boolean NOT NULL DEFAULT false,
	`emailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
