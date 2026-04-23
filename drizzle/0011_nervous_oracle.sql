ALTER TABLE `rep_sent_emails` ADD `resendMessageId` varchar(255);--> statement-breakpoint
ALTER TABLE `rep_sent_emails` ADD `openedAt` timestamp;--> statement-breakpoint
ALTER TABLE `rep_sent_emails` ADD `clickedAt` timestamp;--> statement-breakpoint
ALTER TABLE `rep_sent_emails` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `rep_sent_emails` ADD `bouncedAt` timestamp;