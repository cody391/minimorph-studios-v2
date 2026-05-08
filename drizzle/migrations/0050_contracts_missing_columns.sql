ALTER TABLE `contracts` ADD COLUMN `contractText` longtext;
ALTER TABLE `contracts` ADD COLUMN `contractSignedAt` timestamp NULL;
ALTER TABLE `contracts` ADD COLUMN `contractSignedIp` varchar(64);
ALTER TABLE `contracts` ADD COLUMN `nurturingActive` boolean NOT NULL DEFAULT false;
ALTER TABLE `contracts` ADD COLUMN `anniversaryDay` int;
ALTER TABLE `contracts` ADD COLUMN `contractEndDate` timestamp NULL;
ALTER TABLE `contracts` ADD COLUMN `autoRenew` boolean NOT NULL DEFAULT true;
