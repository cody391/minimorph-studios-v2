CREATE TABLE `brand_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_category` enum('color','font','logo','voice','template','image','guideline') NOT NULL,
	`asset_name` varchar(255) NOT NULL,
	`asset_value` text,
	`asset_description` text,
	`asset_url` varchar(512),
	`sort_order` int DEFAULT 0,
	`asset_is_active` boolean DEFAULT true,
	`ba_created_at` timestamp NOT NULL DEFAULT (now()),
	`ba_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cal_title` varchar(255) NOT NULL,
	`cal_description` text,
	`cal_post_id` int,
	`cal_campaign_id` int,
	`cal_platforms` json,
	`scheduled_date` varchar(10) NOT NULL,
	`scheduled_time` varchar(5),
	`content_type` enum('post','story','reel','video','carousel','article','poll','event') NOT NULL DEFAULT 'post',
	`cal_status` enum('idea','planned','in_progress','ready','published','skipped') NOT NULL DEFAULT 'planned',
	`cal_notes` text,
	`cal_color` varchar(7),
	`cal_created_by` int,
	`cal_created_at` timestamp NOT NULL DEFAULT (now()),
	`cal_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_calendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook','linkedin','tiktok','x','youtube','pinterest','threads') NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_id` varchar(255),
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`profile_url` varchar(512),
	`profile_image_url` varchar(512),
	`follower_count` int DEFAULT 0,
	`account_status` enum('connected','disconnected','expired','pending') NOT NULL DEFAULT 'pending',
	`connected_at` timestamp,
	`last_sync_at` timestamp,
	`sa_created_at` timestamp NOT NULL DEFAULT (now()),
	`sa_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analytics_account_id` int NOT NULL,
	`analytics_platform` enum('instagram','facebook','linkedin','tiktok','x','youtube','pinterest','threads') NOT NULL,
	`analytics_date` varchar(10) NOT NULL,
	`analytics_followers` int DEFAULT 0,
	`followers_gained` int DEFAULT 0,
	`analytics_impressions` int DEFAULT 0,
	`analytics_reach` int DEFAULT 0,
	`analytics_engagement` int DEFAULT 0,
	`engagement_rate` decimal(5,2),
	`analytics_clicks` int DEFAULT 0,
	`analytics_shares` int DEFAULT 0,
	`profile_views` int DEFAULT 0,
	`website_clicks` int DEFAULT 0,
	`san_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_name` varchar(255) NOT NULL,
	`campaign_description` text,
	`campaign_goal` enum('brand_awareness','lead_generation','engagement','traffic','recruitment','product_launch','event_promotion','customer_retention') NOT NULL DEFAULT 'brand_awareness',
	`campaign_platforms` json,
	`campaign_start_date` timestamp,
	`campaign_end_date` timestamp,
	`campaign_budget` decimal(10,2),
	`campaign_status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`target_audience` text,
	`total_posts` int DEFAULT 0,
	`total_engagement` int DEFAULT 0,
	`sc_created_at` timestamp NOT NULL DEFAULT (now()),
	`sc_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_content_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lib_title` varchar(255) NOT NULL,
	`lib_content` text NOT NULL,
	`lib_platform` enum('instagram','facebook','linkedin','tiktok','x','all') NOT NULL DEFAULT 'all',
	`lib_category` enum('brand_awareness','testimonial','service_highlight','industry_tip','behind_the_scenes','recruitment','promotion','educational') NOT NULL DEFAULT 'brand_awareness',
	`lib_media_urls` json,
	`lib_hashtags` json,
	`lib_is_approved` boolean DEFAULT false,
	`times_shared` int DEFAULT 0,
	`scl_created_at` timestamp NOT NULL DEFAULT (now()),
	`scl_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_content_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sp_campaign_id` int,
	`sp_platform` enum('instagram','facebook','linkedin','tiktok','x','youtube','pinterest','threads') NOT NULL,
	`sp_account_id` int,
	`post_content` text NOT NULL,
	`media_urls` json,
	`media_type` enum('none','image','video','carousel','story','reel') DEFAULT 'none',
	`post_hashtags` json,
	`sp_scheduled_at` timestamp,
	`sp_published_at` timestamp,
	`post_url` varchar(512),
	`post_status` enum('draft','scheduled','publishing','published','failed','archived') NOT NULL DEFAULT 'draft',
	`failure_reason` text,
	`post_likes` int DEFAULT 0,
	`post_comments` int DEFAULT 0,
	`post_shares` int DEFAULT 0,
	`post_impressions` int DEFAULT 0,
	`post_reach` int DEFAULT 0,
	`post_clicks` int DEFAULT 0,
	`post_saves` int DEFAULT 0,
	`ai_generated` boolean DEFAULT false,
	`ai_prompt` text,
	`sp_created_by` int,
	`sp_created_at` timestamp NOT NULL DEFAULT (now()),
	`sp_updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
