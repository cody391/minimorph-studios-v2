ALTER TABLE `leads`
  ADD COLUMN `emailVerified` boolean NOT NULL DEFAULT false,
  ADD COLUMN `intelligenceCard` json,
  ADD COLUMN `checkoutSentAt` timestamp,
  ADD COLUMN `checkoutUrl` varchar(512),
  ADD COLUMN `selfClosed` boolean NOT NULL DEFAULT false,
  ADD COLUMN `excludedReason` varchar(100);
--> statement-breakpoint
CREATE TABLE `scoring_model` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `modelVersion` varchar(64) NOT NULL,
  `weights` json NOT NULL,
  `trainingSize` int NOT NULL DEFAULT 0,
  `accuracy` decimal(5,4),
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
