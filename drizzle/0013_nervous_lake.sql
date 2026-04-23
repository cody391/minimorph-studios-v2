ALTER TABLE `commissions` MODIFY COLUMN `type` enum('initial_sale','renewal','upsell','referral_bonus','recurring_monthly') NOT NULL DEFAULT 'initial_sale';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `commissions` ADD `selfSourced` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `selfSourced` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `discountPercent` int DEFAULT 0 NOT NULL;