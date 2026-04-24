CREATE TABLE `rep_onboarding_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`rep_id` int,
	`legal_first_name` varchar(128),
	`legal_last_name` varchar(128),
	`date_of_birth` varchar(10),
	`ssn_last4` varchar(4),
	`id_type` varchar(64),
	`id_last4` varchar(4),
	`street_address` varchar(255),
	`city` varchar(128),
	`state` varchar(64),
	`zip_code` varchar(16),
	`country` varchar(64) DEFAULT 'US',
	`nda_signed_at` timestamp,
	`nda_ip_address` varchar(64),
	`nda_version` varchar(16) DEFAULT '1.0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_onboarding_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rep_assessments` ADD `started_at` timestamp;--> statement-breakpoint
ALTER TABLE `rep_assessments` ADD `time_limit_seconds` int DEFAULT 1200;--> statement-breakpoint
ALTER TABLE `rep_assessments` ADD `attempt_number` int DEFAULT 1 NOT NULL;