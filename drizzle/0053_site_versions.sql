CREATE TABLE `site_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `versionNumber` int NOT NULL,
  `htmlSnapshot` longtext NOT NULL,
  `changeRequest` text,
  `createdBy` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_site_versions_projectId` (`projectId`)
);
