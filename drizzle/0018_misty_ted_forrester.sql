CREATE TABLE `academy_certifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`certification_type` enum('module','full') NOT NULL,
	`module_id` varchar(64),
	`certified_at` timestamp NOT NULL DEFAULT (now()),
	`score` int NOT NULL,
	CONSTRAINT `academy_certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`module_id` varchar(64) NOT NULL,
	`lesson_index` int NOT NULL DEFAULT 0,
	`lessons_completed` int NOT NULL DEFAULT 0,
	`total_lessons` int NOT NULL,
	`quiz_score` int,
	`quiz_attempts` int NOT NULL DEFAULT 0,
	`quiz_passed` boolean NOT NULL DEFAULT false,
	`time_spent_minutes` int NOT NULL DEFAULT 0,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`last_accessed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`module_id` varchar(64) NOT NULL,
	`answers` json NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL,
	`time_spent_seconds` int NOT NULL DEFAULT 0,
	`attempted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_quiz_attempts_id` PRIMARY KEY(`id`)
);
