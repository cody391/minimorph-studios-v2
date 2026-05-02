ALTER TABLE `support_tickets` ADD `customerRating` int;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `ratingToken` varchar(64);--> statement-breakpoint
ALTER TABLE `commissions` ADD `rateApplied` decimal(5,2);
