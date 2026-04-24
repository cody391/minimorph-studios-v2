CREATE TABLE `team_feed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int,
	`type` enum('announcement','deal_closed','certification','tier_promotion','milestone','tip','shoutout') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`is_pinned` boolean NOT NULL DEFAULT false,
	`likes` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_feed_id` PRIMARY KEY(`id`)
);
