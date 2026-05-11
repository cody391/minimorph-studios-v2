-- Migration 0054: Lead compliance schema foundation
-- Adds three fields to the leads table required for CAN-SPAM unsubscribe
-- handling (emailOptedOut, optOutToken) and TCPA local-time SMS gating (timezone).
-- No outreach behavior is changed in this migration.
-- The unique key on optOutToken allows NULL values (MySQL semantics) and
-- ensures each issued token maps to exactly one lead.

ALTER TABLE `leads`
  ADD COLUMN `emailOptedOut` boolean NOT NULL DEFAULT false,
  ADD COLUMN `optOutToken` varchar(64) DEFAULT NULL,
  ADD COLUMN `timezone` varchar(64) DEFAULT NULL,
  ADD UNIQUE KEY `uq_leads_optOutToken` (`optOutToken`);
