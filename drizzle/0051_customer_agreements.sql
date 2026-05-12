-- Migration 0051: Customer service agreement acceptance
-- Stores pre-checkout legal acceptance from customers before Stripe.
-- One row per checkout attempt (not upserted — history preserved).
-- Linked to contract/project/order after webhook fires.

CREATE TABLE IF NOT EXISTS `customer_agreements` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `userId` int NOT NULL,
  `projectId` int NOT NULL,
  `signerName` varchar(255) NOT NULL,
  `termsVersion` varchar(16) NOT NULL DEFAULT '1.0',
  `packageSnapshot` json NOT NULL,
  `acceptedAt` timestamp NOT NULL DEFAULT (now()),
  `ipAddress` varchar(64),
  `userAgent` varchar(500),
  `checkoutSessionId` varchar(255),
  `contractId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer_agreements_userId` (`userId`),
  INDEX `idx_customer_agreements_projectId` (`projectId`)
);
