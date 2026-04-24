CREATE TABLE `rep_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`gate1_score` decimal(5,2) NOT NULL,
	`gate2_score` decimal(5,2) NOT NULL,
	`total_score` decimal(5,2) NOT NULL,
	`assessment_status` enum('passed','borderline','failed') NOT NULL,
	`answers` json NOT NULL,
	`free_text_answer` text,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`reviewed_by` int,
	`review_notes` text,
	`admin_override` enum('approved','rejected'),
	CONSTRAINT `rep_assessments_id` PRIMARY KEY(`id`)
);
