CREATE TABLE `coaching_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`feedback_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`review_category` enum('objection_handling','closing','rapport','discovery','product_knowledge','tone','follow_up','listening','urgency','personalization') NOT NULL,
	`related_module_id` varchar(64),
	`review_priority` enum('critical','important','suggested') NOT NULL DEFAULT 'important',
	`review_status` enum('pending','completed','skipped') NOT NULL DEFAULT 'pending',
	`quiz_question` json,
	`quiz_answer` int,
	`quiz_passed` boolean,
	`review_completed_at` timestamp,
	`expires_at` timestamp,
	`review_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`check_in_date` varchar(10) NOT NULL,
	`reviews_required` int NOT NULL DEFAULT 0,
	`reviews_completed` int NOT NULL DEFAULT 0,
	`quizzes_required` int NOT NULL DEFAULT 0,
	`quizzes_completed` int NOT NULL DEFAULT 0,
	`is_cleared` boolean NOT NULL DEFAULT false,
	`cleared_at` timestamp,
	`checkin_created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_check_ins_id` PRIMARY KEY(`id`)
);
