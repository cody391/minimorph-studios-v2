-- Migration 0048: Stripe product sync columns
-- product_catalog: add stripeProductId, stripeDiscountPriceId, discountDuration
-- contracts: add originalPriceCents, effectivePriceCents, contractDiscountPercent

ALTER TABLE `product_catalog`
  ADD COLUMN `stripeProductId` varchar(100) DEFAULT NULL,
  ADD COLUMN `stripeDiscountPriceId` varchar(100) DEFAULT NULL,
  ADD COLUMN `discountDuration` enum('once','repeating','forever') NOT NULL DEFAULT 'once';

ALTER TABLE `contracts`
  ADD COLUMN `originalPriceCents` int DEFAULT NULL,
  ADD COLUMN `effectivePriceCents` int DEFAULT NULL,
  ADD COLUMN `contractDiscountPercent` decimal(5,2) DEFAULT NULL;
