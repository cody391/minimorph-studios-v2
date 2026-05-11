-- Migration 0050: Rep paperwork submissions
-- Adds rep_paperwork_submissions table for MiniMorph native e-sign persistence.
-- Stores one row per rep per form type; upserted on each re-sign.
-- Does NOT store full SSN. signatureData is fetched admin-only on demand.

CREATE TABLE IF NOT EXISTS `rep_paperwork_submissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `repId` int NOT NULL,
  `userId` int NOT NULL,
  `formType` enum('w9_tax','hr_employment','payroll_setup','rep_agreement') NOT NULL,
  `formTitle` varchar(255) NOT NULL,
  `formVersion` varchar(16) NOT NULL DEFAULT '1.0',
  `formDataJson` json NOT NULL,
  `signatureType` enum('drawn','typed') NOT NULL,
  `signatureData` longtext NOT NULL,
  `signerName` varchar(255) NOT NULL,
  `signedAt` timestamp NOT NULL DEFAULT (now()),
  `signedIpAddress` varchar(64),
  `signedUserAgent` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_rep_paperwork_repId_formType` (`repId`, `formType`)
);
