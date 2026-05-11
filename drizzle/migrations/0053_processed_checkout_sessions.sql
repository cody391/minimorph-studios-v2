-- Migration 0053: Webhook idempotency guard
-- Adds processed_checkout_sessions table so checkout-session-scoped side
-- effects (e.g. coupon usedCount increments) can be recorded exactly once,
-- even if Stripe retries checkout.session.completed.
-- The unique key on (stripeSessionId, purpose) enables atomic INSERT IGNORE
-- deduplication at the MySQL level.

CREATE TABLE IF NOT EXISTS `processed_checkout_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stripeSessionId` varchar(255) NOT NULL,
  `purpose` varchar(64) NOT NULL DEFAULT 'coupon_usedCount',
  `processedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_purpose` (`stripeSessionId`, `purpose`)
);
