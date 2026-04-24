CREATE TABLE `role_play_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rp_rep_id` int NOT NULL,
	`scenario_type` enum('cold_call','discovery_call','objection_handling','closing','follow_up','upsell','angry_customer','price_negotiation') NOT NULL,
	`prospect_persona` text NOT NULL,
	`rp_messages` json,
	`rp_status` enum('active','completed','scored') NOT NULL DEFAULT 'active',
	`rp_score` int,
	`rp_feedback` text,
	`rp_strengths` json,
	`rp_improvements` json,
	`rp_related_module_id` varchar(64),
	`message_count` int DEFAULT 0,
	`duration_seconds` int,
	`rp_created_at` timestamp NOT NULL DEFAULT (now()),
	`rp_completed_at` timestamp,
	CONSTRAINT `role_play_sessions_id` PRIMARY KEY(`id`)
);
