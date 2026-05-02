-- Migration 0043: Platform wiring — new tables + column additions

-- Add needsStripeConnect to users
ALTER TABLE `users` ADD COLUMN `needsStripeConnect` boolean NOT NULL DEFAULT false;

-- Add website_popup to leads.source enum
ALTER TABLE `leads` MODIFY COLUMN `source` enum('ai_sourced','website_form','referral','manual','website_popup') NOT NULL DEFAULT 'ai_sourced';

-- Add pdfUrl and contractSignedUserAgent to contracts
ALTER TABLE `contracts` ADD COLUMN `contractSignedUserAgent` varchar(500);
ALTER TABLE `contracts` ADD COLUMN `pdfUrl` varchar(512);

-- Support tickets (customer→admin)
CREATE TABLE `support_tickets` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `customerId` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `category` enum('billing','technical','website_change','general','other') NOT NULL DEFAULT 'general',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

-- Support ticket replies
CREATE TABLE `support_ticket_replies` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `ticketId` int NOT NULL,
  `authorId` int NOT NULL,
  `authorRole` enum('customer','admin') NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

-- Rep↔Admin messages
CREATE TABLE `rep_messages` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `repId` int NOT NULL,
  `senderRole` enum('rep','admin') NOT NULL,
  `body` text NOT NULL,
  `readAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

-- Product catalog
CREATE TABLE `product_catalog` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `productKey` varchar(64) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` enum('package','addon','one_time') NOT NULL DEFAULT 'package',
  `basePrice` decimal(10,2) NOT NULL,
  `discountPercent` int NOT NULL DEFAULT 0,
  `stripePriceId` varchar(128),
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

-- Broadcasts
CREATE TABLE `broadcasts` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `subject` varchar(255) NOT NULL,
  `audience` enum('all_customers','active_contracts','all_reps','all_leads') NOT NULL,
  `body` text NOT NULL,
  `recipientCount` int NOT NULL DEFAULT 0,
  `status` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
  `sentAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
