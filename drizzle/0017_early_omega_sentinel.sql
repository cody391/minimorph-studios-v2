CREATE TABLE `email_unsubscribes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`unsubscribed_at` timestamp DEFAULT (now()),
	`source` varchar(50) DEFAULT 'email_link',
	CONSTRAINT `email_unsubscribes_id` PRIMARY KEY(`id`)
);
