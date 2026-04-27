ALTER TABLE `leads` ADD `smsOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `smsOptInAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `smsOptInMethod` enum('verbal_consent','form_submission','reply_start','manual');