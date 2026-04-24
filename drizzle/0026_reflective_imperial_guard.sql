CREATE TABLE `rep_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`activity_type` enum('call_made','call_received','email_sent','email_received','meeting_booked','meeting_completed','follow_up_sent','proposal_sent','deal_closed','deal_lost','lead_accepted','lead_rejected','lead_timeout','login','training_completed','quiz_passed') NOT NULL,
	`lead_id` int,
	`customer_id` int,
	`contract_id` int,
	`notes` text,
	`duration_seconds` int,
	`outcome` varchar(128),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_lead_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`score_at_assignment` decimal(5,2) NOT NULL,
	`tier_at_assignment` enum('bronze','silver','gold','platinum') NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	`accepted_at` timestamp,
	`timeout_at` timestamp,
	`status` enum('assigned','accepted','timeout','rejected','completed','lost') NOT NULL DEFAULT 'assigned',
	`outcome` varchar(128),
	`reassigned_to` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_lead_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_performance_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`overall_score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`activity_score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`close_rate_score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`client_satisfaction_score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`values_compliance_score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`calls_made` int NOT NULL DEFAULT 0,
	`follow_ups_sent` int NOT NULL DEFAULT 0,
	`meetings_booked` int NOT NULL DEFAULT 0,
	`deals_closed` int NOT NULL DEFAULT 0,
	`leads_assigned` int NOT NULL DEFAULT 0,
	`leads_converted` int NOT NULL DEFAULT 0,
	`period_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_performance_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_strikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`severity` enum('warning','strike','instant_deactivation') NOT NULL,
	`category` enum('values_violation','performance','professionalism','fraud','confidentiality_breach','client_harm','misrepresentation','inactivity') NOT NULL,
	`description` text NOT NULL,
	`evidence` text,
	`source` enum('ai_monitor','client_feedback','admin_manual','system_auto') NOT NULL DEFAULT 'system_auto',
	`status` enum('pending_review','confirmed','dismissed','appealed') NOT NULL DEFAULT 'pending_review',
	`resolved_by` int,
	`resolved_at` timestamp,
	`resolution` text,
	`required_action` varchar(255),
	`action_completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_strikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rep_id` int NOT NULL,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`commission_rate` decimal(4,2) NOT NULL DEFAULT '10.00',
	`monthly_revenue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`months_active` int NOT NULL DEFAULT 0,
	`residual_decay_rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`last_active_at` timestamp,
	`promoted_at` timestamp,
	`previous_tier` enum('bronze','silver','gold','platinum'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_tiers_id` PRIMARY KEY(`id`)
);
