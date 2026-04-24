CREATE TABLE `x_engagement_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action_type` enum('follow','unfollow','like','reply','retweet') NOT NULL,
	`target_user_id` varchar(64),
	`target_username` varchar(128),
	`target_tweet_id` varchar(64),
	`target_tweet_text` text,
	`reply_text` text,
	`engagement_status` enum('pending_approval','approved','executed','failed','rejected') NOT NULL DEFAULT 'executed',
	`engagement_failure_reason` text,
	`engagement_category` enum('rep_recruitment','lead_gen','brand_awareness','authority','general') NOT NULL DEFAULT 'general',
	`xel_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `x_engagement_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `x_follow_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`x_user_id` varchar(64) NOT NULL,
	`x_username` varchar(128) NOT NULL,
	`x_name` varchar(255),
	`x_description` text,
	`x_followers_count` int,
	`followed_at` timestamp NOT NULL DEFAULT (now()),
	`followed_back` boolean DEFAULT false,
	`unfollowed_at` timestamp,
	`follow_category` enum('rep_recruitment','lead_gen','brand_awareness','authority','general') NOT NULL DEFAULT 'general',
	CONSTRAINT `x_follow_tracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `x_growth_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(128) NOT NULL,
	`config_value` text NOT NULL,
	`xgc_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `x_growth_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `x_growth_config_config_key_unique` UNIQUE(`config_key`)
);
--> statement-breakpoint
CREATE TABLE `x_growth_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target_type` enum('keyword','hashtag','account','community') NOT NULL,
	`target_value` varchar(255) NOT NULL,
	`gt_category` enum('rep_recruitment','lead_gen','brand_awareness','authority') NOT NULL,
	`target_priority` int DEFAULT 5,
	`target_is_active` boolean DEFAULT true,
	`xgt_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `x_growth_targets_id` PRIMARY KEY(`id`)
);
