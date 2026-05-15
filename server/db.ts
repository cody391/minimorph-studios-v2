import { eq, desc, and, or, sql, gte, lte, inArray, ne, isNull, avg } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  reps,
  InsertRep,
  leads,
  InsertLead,
  customers,
  InsertCustomer,
  leadCosts,
  InsertLeadCost,
  contracts,
  InsertContract,
  commissions,
  InsertCommission,
  nurtureLogs,
  InsertNurtureLog,
  reports,
  InsertReport,
  upsellOpportunities,
  InsertUpsellOpportunity,
  contactSubmissions,
  InsertContactSubmission,
  orders,
  InsertOrder,
  onboardingProjects,
  InsertOnboardingProject,
  projectAssets,
  aiChatLogs,
  InsertAiChatLog,
  widgetCatalog,
  InsertWidgetCatalogItem,
  InsertProjectAsset,
  repTrainingModules,
  InsertRepTrainingModule,
  repTrainingProgress,
  InsertRepTrainingProgress,
  repQuizResults,
  InsertRepQuizResult,
  repActivityLogs,
  InsertRepActivityLog,
  repGamification,
  InsertRepGamification,
  repEmailTemplates,
  InsertRepEmailTemplate,
  repSentEmails,
  InsertRepSentEmail,
  repApplications,
  InsertRepApplication,
  repNotifications,
  InsertRepNotification,
  smsMessages,
  InsertSmsMessage,
  callLogs,
  InsertCallLog,
  aiCoachingFeedback,
  InsertAiCoachingFeedback,
  trainingInsights,
  InsertTrainingInsight,
  repSupportTickets,
  InsertRepSupportTicket,
  repNotificationPreferences,
  InsertRepNotificationPreference,
  pushSubscriptions,
  InsertPushSubscription,
  repTiers,
  supportTickets,
  InsertSupportTicket,
  supportTicketReplies,
  InsertSupportTicketReply,
  repMessages,
  InsertRepMessage,
  productCatalog,
  InsertProductCatalogItem,
  broadcasts,
  InsertBroadcast,
  systemSettings,
  customerAgreements,
  InsertCustomerAgreement,
  siteVersions,
  InsertSiteVersion,
  websiteBlueprints,
  InsertWebsiteBlueprint,
  siteBuildReports,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

/* ═══════════════════════════════════════════════════════
   SCHEMA REPAIR — Idempotent DDL recovery
   Runs at startup to apply any DDL that the migration
   tracker missed (e.g. due to __drizzle_migrations state
   corruption). Uses raw mysql2, independent of drizzle.
   ═══════════════════════════════════════════════════════ */
export async function repairSchema(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  let conn: mysql.Connection | undefined;
  try {
    conn = await mysql.createConnection(dbUrl);

    // Run SQL — swallows expected idempotency errors
    const safe = async (sqlStr: string) => {
      try {
        await conn!.execute(sqlStr);
      } catch (err: any) {
        if (err.errno === 1060) return; // ER_DUP_FIELDNAME: column already exists
        if (err.errno === 1061) return; // ER_DUP_KEYNAME: index already exists
        if (err.errno === 1054) return; // ER_BAD_FIELD_ERROR in CHECK constraint
        console.warn(`[SchemaRepair] ${err.message.substring(0, 120)}`);
      }
    };

    // ── Tables from 0043 ──────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`support_tickets\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`customerId\` int NOT NULL, \`subject\` varchar(255) NOT NULL, \`body\` text NOT NULL,
      \`status\` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
      \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
      \`category\` enum('billing','technical','website_change','general','other') NOT NULL DEFAULT 'general',
      \`customerRating\` int, \`ratingToken\` varchar(64),
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`support_ticket_replies\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`ticketId\` int NOT NULL, \`authorId\` int NOT NULL,
      \`authorRole\` enum('customer','admin') NOT NULL, \`body\` text NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`rep_messages\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`repId\` int NOT NULL, \`senderRole\` enum('rep','admin') NOT NULL,
      \`body\` text NOT NULL, \`readAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    // product_catalog: create with ALL columns (including 0049 additions)
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`product_catalog\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`productKey\` varchar(64) NOT NULL UNIQUE, \`name\` varchar(255) NOT NULL,
      \`description\` text,
      \`longDescription\` text DEFAULT NULL,
      \`isFree\` boolean NOT NULL DEFAULT false,
      \`pitchTriggers\` json DEFAULT NULL,
      \`pitchScript\` text DEFAULT NULL,
      \`howItWorks\` text DEFAULT NULL,
      \`roiExample\` text DEFAULT NULL,
      \`category\` enum('package','addon','one_time') NOT NULL DEFAULT 'package',
      \`basePrice\` decimal(10,2) NOT NULL,
      \`discountPercent\` int NOT NULL DEFAULT 0,
      \`discountDuration\` enum('once','repeating','forever') NOT NULL DEFAULT 'once',
      \`stripePriceId\` varchar(128),
      \`stripeProductId\` varchar(100) DEFAULT NULL,
      \`stripeDiscountPriceId\` varchar(100) DEFAULT NULL,
      \`active\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`broadcasts\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`subject\` varchar(255) NOT NULL,
      \`audience\` enum('all_customers','active_contracts','all_reps','all_leads') NOT NULL,
      \`body\` text NOT NULL, \`recipientCount\` int NOT NULL DEFAULT 0,
      \`status\` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
      \`sentAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Columns from 0043 ─────────────────────────────────────────────
    await safe("ALTER TABLE `users` ADD COLUMN `needsStripeConnect` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractSignedUserAgent` varchar(500)");
    await safe("ALTER TABLE `contracts` ADD COLUMN `pdfUrl` varchar(512)");

    // ── Tables from 0045 ──────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`scoring_model\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`modelVersion\` varchar(64) NOT NULL, \`weights\` json NOT NULL,
      \`trainingSize\` int NOT NULL DEFAULT 0, \`accuracy\` decimal(5,4),
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Columns from 0044 ─────────────────────────────────────────────
    await safe("ALTER TABLE `support_tickets` ADD COLUMN `customerRating` int");
    await safe("ALTER TABLE `support_tickets` ADD COLUMN `ratingToken` varchar(64)");
    await safe("ALTER TABLE `commissions` ADD COLUMN `rateApplied` decimal(5,2)");

    // ── Columns from 0045 ─────────────────────────────────────────────
    await safe("ALTER TABLE `leads` ADD COLUMN `emailVerified` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `leads` ADD COLUMN `intelligenceCard` json");
    await safe("ALTER TABLE `leads` ADD COLUMN `checkoutSentAt` timestamp");
    await safe("ALTER TABLE `leads` ADD COLUMN `checkoutUrl` varchar(512)");
    await safe("ALTER TABLE `leads` ADD COLUMN `selfClosed` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `leads` ADD COLUMN `excludedReason` varchar(100)");

    // ── Tables from 0046 ──────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`coaching_insights\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`feedbackId\` int NOT NULL, \`repId\` int NOT NULL,
      \`title\` varchar(255) NOT NULL, \`lessonContent\` text NOT NULL,
      \`ci_category\` enum('objection_handling','closing','rapport','discovery','product_knowledge','tone','follow_up','listening','urgency','personalization') NOT NULL,
      \`ci_status\` enum('pending_review','published','rejected') NOT NULL DEFAULT 'pending_review',
      \`publishedAt\` timestamp, \`publishedBy\` int,
      \`ci_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`rep_availability\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`repId\` int NOT NULL, \`dayOfWeek\` int NOT NULL,
      \`startTime\` varchar(5) NOT NULL, \`endTime\` varchar(5) NOT NULL,
      \`isAvailable\` boolean NOT NULL DEFAULT true,
      \`timezone\` varchar(64) NOT NULL DEFAULT 'America/Chicago',
      \`ra_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`ra_updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`settingKey\` varchar(128) NOT NULL, \`settingValue\` text NOT NULL,
      \`description\` text,
      \`ss_updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`updatedBy\` int,
      UNIQUE KEY \`system_settings_key_unique\` (\`settingKey\`)
    )`);
    await conn.execute(`INSERT IGNORE INTO \`system_settings\` (\`settingKey\`, \`settingValue\`, \`description\`) VALUES
      ('lead_engine_active','false','Master switch for the entire lead generation engine'),
      ('job_scraper_active','false','Enable/disable the Google Maps scraping job'),
      ('job_scorer_active','true','Enable/disable the website scoring job'),
      ('job_enrichment_active','true','Enable/disable the business enrichment job'),
      ('job_outreach_active','false','Enable/disable the automated outreach job'),
      ('job_auto_feed_active','false','Enable/disable the auto-feed reps job'),
      ('job_reengagement_active','false','Enable/disable the cold lead re-engagement job'),
      ('daily_sms_cap','50','Maximum SMS messages per rep per day'),
      ('daily_email_cap','200','Maximum emails per rep per day'),
      ('daily_call_cap','100','Maximum calls per rep per day'),
      ('outreach_start_hour','8','Earliest hour for outreach (local time, 0-23)'),
      ('outreach_end_hour','21','Latest hour for outreach (local time, 0-23)'),
      ('auto_deploy_enabled','false','Automatically deploy site to Cloudflare Pages after generation, bypassing admin QA review')`);

    // ── Columns from 0046 ─────────────────────────────────────────────
    await safe("ALTER TABLE `reps` ADD COLUMN `assignedPhoneNumber` varchar(32)");
    await safe("ALTER TABLE `reps` ADD COLUMN `voicemailMessage` text");
    await safe("ALTER TABLE `reps` ADD COLUMN `lastTrainingCompletedAt` timestamp");
    await safe("ALTER TABLE `reps` ADD COLUMN `trainingRequiredToday` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `ai_coaching_feedback` ADD COLUMN `promotableToAcademy` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `ai_coaching_feedback` ADD COLUMN `promotionReason` text");
    await safe("ALTER TABLE `ai_coaching_feedback` ADD COLUMN `promotedToAcademy` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `ai_coaching_feedback` ADD COLUMN `promotedAt` timestamp");
    await safe("ALTER TABLE `ai_coaching_feedback` ADD COLUMN `promotedBy` int");

    // ── Tables from 0047 ──────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`lead_costs\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`leadId\` int, \`scrapedBusinessId\` int, \`customerId\` int,
      \`costType\` enum('scraping','enrichment','outreach_email','outreach_sms','outreach_call','ai_generation','ai_conversation','ai_coaching','ai_monthly','domain','hosting','commission','commission_recurring','phone_number') NOT NULL,
      \`amountCents\` int NOT NULL, \`description\` varchar(255),
      \`tokensUsed\` int, \`durationSeconds\` int, \`repId\` int, \`month\` varchar(7),
      \`lc_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await safe("CREATE INDEX `idx_lead_costs_leadId` ON `lead_costs`(`leadId`)");
    await safe("CREATE INDEX `idx_lead_costs_customerId` ON `lead_costs`(`customerId`)");
    await safe("CREATE INDEX `idx_lead_costs_month` ON `lead_costs`(`month`)");
    await safe("CREATE INDEX `idx_lead_costs_costType` ON `lead_costs`(`costType`)");

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`coupons\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`code\` varchar(64) NOT NULL UNIQUE,
      \`description\` varchar(255) DEFAULT NULL,
      \`discountType\` enum('percent','free') NOT NULL,
      \`discountValue\` int DEFAULT NULL,
      \`maxUses\` int DEFAULT NULL,
      \`usedCount\` int NOT NULL DEFAULT 0,
      \`expiresAt\` timestamp NULL DEFAULT NULL,
      \`stripePromotionCodeId\` varchar(128) DEFAULT NULL,
      \`stripeCouponId\` varchar(128) DEFAULT NULL,
      \`active\` tinyint(1) NOT NULL DEFAULT 1,
      \`cp_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`cp_updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // ── Missing tables: password_reset_tokens + monthly_reports ──────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`password_reset_tokens\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`userId\` INT NOT NULL,
      \`token\` VARCHAR(128) NOT NULL,
      \`expiresAt\` TIMESTAMP NOT NULL,
      \`usedAt\` TIMESTAMP NULL,
      \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE KEY \`uq_token\` (\`token\`),
      KEY \`idx_userId\` (\`userId\`)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`monthly_reports\` (
      \`id\` INT AUTO_INCREMENT NOT NULL,
      \`customerId\` INT NOT NULL,
      \`contractId\` INT,
      \`reportMonth\` VARCHAR(7) NOT NULL,
      \`competitiveReport\` TEXT,
      \`isRenewalMonth\` BOOLEAN NOT NULL DEFAULT false,
      \`emailSentAt\` TIMESTAMP NULL,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT (now()),
      CONSTRAINT \`monthly_reports_id\` PRIMARY KEY(\`id\`)
    )`);

    // ── Columns from 0047 ─────────────────────────────────────────────
    await safe("ALTER TABLE `leads` ADD COLUMN `totalCostCents` int NOT NULL DEFAULT 0");
    await safe("ALTER TABLE `leads` ADD COLUMN `totalRevenueCents` int NOT NULL DEFAULT 0");
    await safe("ALTER TABLE `leads` ADD COLUMN `lastCostUpdate` timestamp NULL");
    await safe("ALTER TABLE `customers` ADD COLUMN `totalLifetimeCostCents` int NOT NULL DEFAULT 0");
    await safe("ALTER TABLE `customers` ADD COLUMN `totalLifetimeRevenueCents` int NOT NULL DEFAULT 0");
    await safe("ALTER TABLE `customers` ADD COLUMN `lastEconomicsUpdate` timestamp NULL");

    // ── Columns from previous 0048 batch ──────────────────────────────
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `discountDuration` enum('once','repeating','forever') NOT NULL DEFAULT 'once'");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `stripeProductId` varchar(100) DEFAULT NULL");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `stripeDiscountPriceId` varchar(100) DEFAULT NULL");

    // ── Columns from 0049 (product_catalog Phase 1) ───────────────────────
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `longDescription` text DEFAULT NULL");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `isFree` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `pitchTriggers` json DEFAULT NULL");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `pitchScript` text DEFAULT NULL");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `howItWorks` text DEFAULT NULL");
    await safe("ALTER TABLE `product_catalog` ADD COLUMN `roiExample` text DEFAULT NULL");

    // ── Columns from 0050 (nurture tracking on customers) ─────────────────
    await safe("ALTER TABLE `customers` ADD COLUMN `nurtureMonth` int NOT NULL DEFAULT 0");
    await safe("ALTER TABLE `customers` ADD COLUMN `lastNurtureEmailAt` timestamp NULL");
    await safe("ALTER TABLE `customers` ADD COLUMN `nurtureAddonsSent` json DEFAULT NULL");

    // ── Columns from Agent 3 (addon orchestrator results) ─────────────────
    await safe("ALTER TABLE `customers` ADD COLUMN `addonSetupResults` json DEFAULT NULL");
    await safe("ALTER TABLE `customers` ADD COLUMN `addonSetupCompletedAt` timestamp NULL");
    await safe("ALTER TABLE `customers` ADD COLUMN `bookingHours` json DEFAULT NULL");

    // ── Launch checklist table ────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`launch_checklist\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`customerId\` int NOT NULL,
      \`addonKey\` varchar(64) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text,
      \`instructions\` text,
      \`actionUrl\` varchar(512),
      \`actionLabel\` varchar(128),
      \`status\` varchar(32) NOT NULL DEFAULT 'pending',
      \`completedAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await safe("ALTER TABLE `launch_checklist` ADD COLUMN `completedBy` varchar(128) NULL");
    await safe("ALTER TABLE `launch_checklist` ADD COLUMN `completionNote` text NULL");
    await safe("ALTER TABLE `launch_checklist` ADD COLUMN `evidenceUrl` varchar(512) NULL");
    await safe("ALTER TABLE `launch_checklist` ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await safe("ALTER TABLE `contracts` ADD COLUMN `originalPriceCents` int DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `effectivePriceCents` int DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractDiscountPercent` decimal(5,2) DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractText` longtext");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractSignedAt` timestamp NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractSignedIp` varchar(64)");
    await safe("ALTER TABLE `contracts` ADD COLUMN `nurturingActive` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `contracts` ADD COLUMN `anniversaryDay` int");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractEndDate` timestamp NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `autoRenew` boolean NOT NULL DEFAULT true");

    // ── Columns from 0048 (Elena progress save) ────────────────────────
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `elenaConversationHistory` json NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `lastSavedAt` timestamp NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `currentStep` int NOT NULL DEFAULT 1");

    // ── Self-service project tracking ─────────────────────────────────────
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `userId` int NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `source` varchar(50) NULL DEFAULT 'rep_closed'");

    // ── Missing onboarding_projects columns (added to schema but never migrated) ──
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `domainName` varchar(255) NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `domainRegistered` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `hostingSetup` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `sslSetup` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `generationStatus` enum('idle','generating','complete','failed') NULL DEFAULT 'idle'");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `generationLog` text NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `generatedSiteHtml` longtext NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `generatedSiteUrl` varchar(512) NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `cloudflareProjectName` varchar(200) NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `lastChangeRequest` text NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `changeHistory` json NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `lastCompetitiveReport` text NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `lastCompetitiveReportDate` timestamp NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `previewReadyAt` timestamp NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `approvedAt` timestamp NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `revisionsRemaining` int NULL DEFAULT 3");

    // ── Remove enterprise from packageTier enums across all tables ────────
    await safe("ALTER TABLE `orders` MODIFY COLUMN `packageTier` enum('starter','growth','premium') NOT NULL");
    await safe("ALTER TABLE `contracts` MODIFY COLUMN `packageTier` enum('starter','growth','premium') NOT NULL");
    await safe("ALTER TABLE `onboarding_projects` MODIFY COLUMN `packageTier` enum('starter','growth','premium') NOT NULL");

    // Customer data purge was a one-time production cleanup and must never run during normal startup.
    // Removed from repairSchema to prevent accidental customer data loss if system_settings flags are missing.
    // If a future purge is needed, create an explicit manual script with backup + confirmation.

    // ── Clean up orphaned test rep records left by v2 account purge ──────
    // The v2 purge deleted test user accounts. The reps linked to those
    // accounts (Chelsea McKinley, Cody test reps) are now orphaned. Delete them.
    try {
      const [flagRows] = await conn.execute<any[]>(
        "SELECT settingValue FROM `system_settings` WHERE settingKey = 'cleanup_orphaned_test_reps_v1' LIMIT 1"
      );
      if (!(flagRows as any[])[0]) {
        const [orphanedReps] = await conn.execute<any[]>(
          "SELECT r.id AS repId, r.email, r.fullName FROM `reps` r LEFT JOIN `users` u ON r.userId = u.id WHERE u.id IS NULL"
        );
        console.log("[SchemaRepair] Orphaned test reps to remove:", JSON.stringify(orphanedReps));

        for (const rep of orphanedReps as any[]) {
          await conn.execute("DELETE FROM `reps` WHERE id = ?", [rep.repId]);
          console.log(`[SchemaRepair] Removed orphaned rep record: ${rep.fullName} (${rep.email})`);
        }

        await conn.execute(
          "INSERT IGNORE INTO `system_settings` (settingKey, settingValue, description) VALUES ('cleanup_orphaned_test_reps_v1', 'true', 'Delete orphaned test rep records after user purge')"
        );
        console.log("[SchemaRepair] Orphaned rep cleanup complete");
      }
    } catch (e: any) {
      console.log(`[SchemaRepair] Orphaned rep cleanup skipped: ${e.message.substring(0, 80)}`);
    }

    // Hardcoded admin password reset removed. bootstrapAdminUser() handles admin password sync from ADMIN_PASSWORD env var.

    // ── Agent 4 tables ────────────────────────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`site_build_reports\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`customerId\` int NOT NULL,
      \`projectId\` int NOT NULL,
      \`status\` varchar(32) NOT NULL DEFAULT 'building',
      \`qaScore\` int DEFAULT NULL,
      \`qaAttempts\` int NOT NULL DEFAULT 0,
      \`scoreContent\` int DEFAULT NULL,
      \`scoreSeo\` int DEFAULT NULL,
      \`scoreTechnical\` int DEFAULT NULL,
      \`scoreSecurity\` int DEFAULT NULL,
      \`scoreDesign\` int DEFAULT NULL,
      \`scoreRegulatory\` int DEFAULT NULL,
      \`scoreCopyright\` int DEFAULT NULL,
      \`issuesFound\` json DEFAULT NULL,
      \`issuesAutoFixed\` json DEFAULT NULL,
      \`issuesPersistent\` json DEFAULT NULL,
      \`issuesEscalated\` json DEFAULT NULL,
      \`buildLog\` json DEFAULT NULL,
      \`buildStartedAt\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`buildCompletedAt\` timestamp NULL,
      \`qaStartedAt\` timestamp NULL,
      \`qaCompletedAt\` timestamp NULL,
      \`commissionedAt\` timestamp NULL,
      \`sbr_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`sbr_updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`regulatory_rules\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`industry\` varchar(64) NOT NULL,
      \`agency\` varchar(128) NOT NULL,
      \`ruleKey\` varchar(128) NOT NULL,
      \`ruleDescription\` text NOT NULL,
      \`checkPrompt\` text NOT NULL,
      \`severity\` varchar(16) NOT NULL DEFAULT 'warning',
      \`autoFixable\` boolean NOT NULL DEFAULT false,
      \`autoFixAction\` text DEFAULT NULL,
      \`appliesTo\` varchar(512) DEFAULT 'all',
      \`active\` boolean NOT NULL DEFAULT true,
      \`rr_createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ── Clean up stale product keys from old catalog versions ─────────────
    await safe(`DELETE FROM \`product_catalog\` WHERE \`productKey\` IN ('content_addon', 'seo_addon', 'priority_support_old', 'extra_revision_block_old')`);
    // Reset v3 flag so catalog re-seeds on next startup with correct pitch scripts
    await safe(`DELETE FROM \`system_settings\` WHERE \`settingKey\` = 'product_catalog_v3'`);
    // Reset regulatory rules flags so expanded ruleset re-seeds on every deploy
    await safe(`DELETE FROM \`system_settings\` WHERE \`settingKey\` IN ('regulatory_rules_v1', 'regulatory_rules_v2')`);

    // ── Columns from 0051 (attribution schema) ────────────────────────
    await safe("ALTER TABLE `leads` ADD COLUMN `acquisitionChannel` varchar(128) DEFAULT NULL");
    await safe("ALTER TABLE `leads` ADD COLUMN `enrichmentStatus` varchar(32) NOT NULL DEFAULT 'pending'");
    await safe("ALTER TABLE `leads` ADD COLUMN `needsHumanCloser` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `leads` ADD COLUMN `escalationReason` text DEFAULT NULL");
    await safe("ALTER TABLE `leads` ADD COLUMN `elenaHandoffAt` timestamp NULL DEFAULT NULL");
    await safe("ALTER TABLE `customers` ADD COLUMN `acquisitionSource` varchar(128) DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `salesSource` varchar(64) DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `couponCode` varchar(64) DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `campaignName` varchar(128) DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `leadId` int DEFAULT NULL");
    await safe("ALTER TABLE `commissions` ADD COLUMN `basisAmountCents` int DEFAULT NULL");
    await safe("ALTER TABLE `commissions` ADD COLUMN `requiresPayment` boolean NOT NULL DEFAULT true");
    await safe("ALTER TABLE `coupons` ADD COLUMN `duration` varchar(16) NOT NULL DEFAULT 'once'");
    await safe("ALTER TABLE `coupons` ADD COLUMN `durationMonths` int DEFAULT NULL");
    await safe("ALTER TABLE `coupons` ADD COLUMN `packageRestriction` varchar(64) NOT NULL DEFAULT 'all'");
    await safe("ALTER TABLE `coupons` ADD COLUMN `campaignName` varchar(128) DEFAULT NULL");

    // ── Columns from attribution migration (onboarding_projects) ───────────
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `leadId` int DEFAULT NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `acquisitionSource` varchar(64) DEFAULT NULL");

    // ── 0052_admin_gates: stage enum + admin approval columns ──────────────
    // MODIFY COLUMN for enum is idempotent — MySQL accepts same value silently
    await safe("ALTER TABLE `onboarding_projects` MODIFY COLUMN `stage` ENUM('intake','questionnaire','assets_upload','design','pending_admin_review','review','revisions','final_approval','launch','complete') NOT NULL DEFAULT 'intake'");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `adminPreviewApprovedAt` TIMESTAMP NULL DEFAULT NULL");
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `adminLaunchApprovedAt` TIMESTAMP NULL DEFAULT NULL");

    // ── 0056: paymentConfirmedAt — separate payment tracking from final site approval ──
    // approvedAt = customer approved completed website preview (required for launch)
    // paymentConfirmedAt = Stripe checkout completed (required for generation in self-service flow)
    await safe("ALTER TABLE `onboarding_projects` ADD COLUMN `paymentConfirmedAt` TIMESTAMP NULL DEFAULT NULL");

    // ── 0056b: one-time data fix — project #21 had approvedAt written by the old webhook
    // (handleCheckoutCompleted set approvedAt instead of paymentConfirmedAt). Transfer
    // the timestamp to paymentConfirmedAt and clear approvedAt. Idempotent: after first
    // run paymentConfirmedAt IS NOT NULL so WHERE clause never matches again.
    await safe("UPDATE `onboarding_projects` SET `paymentConfirmedAt` = `approvedAt`, `approvedAt` = NULL WHERE `id` = 21 AND `approvedAt` IS NOT NULL AND `paymentConfirmedAt` IS NULL");

    // ── Table from 0053 (webhook idempotency guard) ───────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`processed_checkout_sessions\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`stripeSessionId\` varchar(255) NOT NULL,
      \`purpose\` varchar(64) NOT NULL DEFAULT 'coupon_usedCount',
      \`processedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_session_purpose\` (\`stripeSessionId\`, \`purpose\`)
    )`);

    // ── Columns from 0054 (lead compliance: unsubscribe + timezone) ───────
    await safe("ALTER TABLE `leads` ADD COLUMN `emailOptedOut` boolean NOT NULL DEFAULT false");
    await safe("ALTER TABLE `leads` ADD COLUMN `optOutToken` varchar(64) DEFAULT NULL");
    await safe("ALTER TABLE `leads` ADD COLUMN `timezone` varchar(64) DEFAULT NULL");
    await safe("ALTER TABLE `leads` ADD UNIQUE KEY `uq_leads_optOutToken` (`optOutToken`)");

    // ── 0051: customer_agreements — pre-checkout legal acceptance ────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`customer_agreements\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`userId\` int NOT NULL,
      \`projectId\` int NOT NULL,
      \`signerName\` varchar(255) NOT NULL,
      \`termsVersion\` varchar(16) NOT NULL DEFAULT '1.0',
      \`packageSnapshot\` json NOT NULL,
      \`acceptedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`ipAddress\` varchar(64),
      \`userAgent\` varchar(500),
      \`checkoutSessionId\` varchar(255),
      \`contractId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_customer_agreements_userId\` (\`userId\`),
      INDEX \`idx_customer_agreements_projectId\` (\`projectId\`)
    )`);

    // ── 0055: website_blueprints — customer-approved site brief ────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`website_blueprints\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`projectId\` int NOT NULL,
      \`userId\` int DEFAULT NULL,
      \`status\` enum('draft','customer_review','approved','revision_requested','stale') NOT NULL DEFAULT 'draft',
      \`versionNumber\` int NOT NULL DEFAULT 1,
      \`blueprintJson\` json NOT NULL,
      \`approvedAt\` timestamp NULL DEFAULT NULL,
      \`approvedByUserId\` int DEFAULT NULL,
      \`approvalIpAddress\` varchar(64) DEFAULT NULL,
      \`approvalUserAgent\` varchar(500) DEFAULT NULL,
      \`revisionRequestedAt\` timestamp NULL DEFAULT NULL,
      \`revisionNotes\` text DEFAULT NULL,
      \`presentedAt\` timestamp NULL DEFAULT NULL,
      \`createdBy\` enum('elena','admin','system') NOT NULL DEFAULT 'elena',
      \`lockedForGeneration\` boolean NOT NULL DEFAULT false,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_website_blueprints_projectId\` (\`projectId\`)
    )`);
    // Add blueprint_review to onboarding_projects.stage enum (idempotent MODIFY)
    await safe("ALTER TABLE `onboarding_projects` MODIFY COLUMN `stage` ENUM('intake','questionnaire','blueprint_review','assets_upload','design','pending_admin_review','review','revisions','final_approval','launch','complete') NOT NULL DEFAULT 'intake'");

    // ── Phase 3: project_assets quality gate columns ─────────────────────────
    await safe("ALTER TABLE `project_assets` ADD COLUMN `uploadedByUserId` int DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `source` enum('customer','admin','stock','ai_support_visual','system') NOT NULL DEFAULT 'customer'");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `intendedUse` enum('hero','gallery','about','services','team','product','background','testimonial','logo','not_sure') DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `qualityStatus` enum('pending_review','approved','needs_rescue','rejected','replaced') NOT NULL DEFAULT 'pending_review'");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `qualityScore` int DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `qualityNotes` text DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `rescueNotes` text DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `rejectionReason` text DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `approvedAt` timestamp NULL DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `approvedByUserId` int DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `rejectedAt` timestamp NULL DEFAULT NULL");
    await safe("ALTER TABLE `project_assets` ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    // ── 0053_site_versions: HTML snapshot before each revision ───────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`site_versions\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`projectId\` int NOT NULL,
      \`versionNumber\` int NOT NULL,
      \`htmlSnapshot\` longtext NOT NULL,
      \`changeRequest\` text,
      \`createdBy\` varchar(128),
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_site_versions_projectId\` (\`projectId\`)
    )`);

    // ── rep_paperwork_submissions (0050) ──────────────────────────────────
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`rep_paperwork_submissions\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`repId\` int NOT NULL,
      \`userId\` int NOT NULL,
      \`formType\` enum('w9_tax','hr_employment','payroll_setup','rep_agreement') NOT NULL,
      \`formTitle\` varchar(255) NOT NULL,
      \`formVersion\` varchar(16) NOT NULL DEFAULT '1.0',
      \`formDataJson\` json NOT NULL,
      \`signatureType\` enum('drawn','typed') NOT NULL,
      \`signatureData\` longtext NOT NULL,
      \`signerName\` varchar(255) NOT NULL,
      \`signedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`signedIpAddress\` varchar(64),
      \`signedUserAgent\` varchar(500),
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uq_rep_paperwork_repId_formType\` (\`repId\`, \`formType\`)
    )`);

    // ── 0057: B7 Admin Blueprint Gate — admin must approve before generation ──
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintReviewStatus` enum('pending','approved','needs_changes','blocked') NOT NULL DEFAULT 'pending'");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintApprovedAt` timestamp NULL DEFAULT NULL");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintApprovedBy` int DEFAULT NULL");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintApprovalNotes` text DEFAULT NULL");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintReturnedAt` timestamp NULL DEFAULT NULL");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintReturnReason` text DEFAULT NULL");
    await safe("ALTER TABLE `website_blueprints` ADD COLUMN `adminBlueprintReviewFlags` json DEFAULT NULL");

    console.log("[SchemaRepair] Schema repair complete");
  } catch (err) {
    console.error("[SchemaRepair] Fatal error:", err);
    // Non-fatal — server continues
  } finally {
    await conn?.end();
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ═══════════════════════════════════════════════════════
   USERS
   ═══════════════════════════════════════════════════════ */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.passwordHash !== undefined) { values.passwordHash = user.passwordHash; updateSet.passwordHash = user.passwordHash; }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId || (ENV.adminEmail && user.email === ENV.adminEmail)) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ═══════════════════════════════════════════════════════
   REPS
   ═══════════════════════════════════════════════════════ */
export async function createRep(data: InsertRep) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reps).values(data);
  return { id: result[0].insertId };
}

export async function getRepById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reps).where(eq(reps.id, id)).limit(1);
  return result[0];
}

export async function getRepByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reps).where(eq(reps.userId, userId)).limit(1);
  return result[0];
}

export async function listReps(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(reps).where(eq(reps.status, statusFilter as any)).orderBy(desc(reps.createdAt));
  }
  return db.select().from(reps).orderBy(desc(reps.createdAt));
}

export async function updateRep(id: number, data: Partial<InsertRep>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(reps).set(data).where(eq(reps.id, id));
}

/* ═══════════════════════════════════════════════════════
   LEADS
   ═══════════════════════════════════════════════════════ */
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return { id: result[0].insertId };
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function listLeads(filters?: { stage?: string; temperature?: string; assignedRepId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.stage) conditions.push(eq(leads.stage, filters.stage as any));
  if (filters?.temperature) conditions.push(eq(leads.temperature, filters.temperature as any));
  if (filters?.assignedRepId) conditions.push(eq(leads.assignedRepId, filters.assignedRepId));
  if (conditions.length > 0) {
    return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

/* ═══════════════════════════════════════════════════════
   CUSTOMERS
   ═══════════════════════════════════════════════════════ */
export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(customers).values(data);
  return { id: result[0].insertId };
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function listCustomers(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(customers).where(eq(customers.status, statusFilter as any)).orderBy(desc(customers.createdAt));
  }
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER AGREEMENTS — pre-checkout legal acceptance
   ═══════════════════════════════════════════════════════ */
export async function createCustomerAgreement(data: InsertCustomerAgreement) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(customerAgreements).values(data);
  return { id: result[0].insertId };
}

export async function getCustomerAgreementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customerAgreements).where(eq(customerAgreements.id, id)).limit(1);
  return result[0];
}

export async function updateCustomerAgreement(id: number, data: Partial<InsertCustomerAgreement>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customerAgreements).set(data).where(eq(customerAgreements.id, id));
}

export async function listCustomerAgreementsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerAgreements).where(eq(customerAgreements.projectId, projectId)).orderBy(desc(customerAgreements.createdAt));
}

/* ═══════════════════════════════════════════════════════
   CONTRACTS
   ═══════════════════════════════════════════════════════ */
export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contracts).values(data);
  return { id: result[0].insertId };
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function listContractsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.customerId, customerId)).orderBy(desc(contracts.createdAt));
}

export async function listContractsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.repId, repId)).orderBy(desc(contracts.createdAt));
}

export async function listContracts(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(contracts).where(eq(contracts.status, statusFilter as any)).orderBy(desc(contracts.createdAt));
  }
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

/* ═══════════════════════════════════════════════════════
   COMMISSIONS
   ═══════════════════════════════════════════════════════ */
export async function createCommission(data: InsertCommission) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(commissions).values(data);
  return { id: result[0].insertId };
}

export async function listCommissionsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).where(eq(commissions.repId, repId)).orderBy(desc(commissions.createdAt));
}

export async function listCommissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).orderBy(desc(commissions.createdAt));
}

export async function updateCommission(id: number, data: Partial<InsertCommission>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(commissions).set(data).where(eq(commissions.id, id));
}

// Get active commissions by contract (for recurring payouts)
export async function getActiveCommissionsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions)
    .where(and(eq(commissions.contractId, contractId), ne(commissions.status, "cancelled")))
    .orderBy(desc(commissions.createdAt));
}

// Cancel all pending/approved commissions for a contract (when customer stops paying)
export async function cancelCommissionsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(commissions)
    .set({ status: "cancelled" })
    .where(and(
      eq(commissions.contractId, contractId),
      ne(commissions.status, "paid"),
      ne(commissions.status, "cancelled"),
    ));
}

/* ═══════════════════════════════════════════════════════
   NURTURE LOGS
   ═══════════════════════════════════════════════════════ */
export async function createNurtureLog(data: InsertNurtureLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(nurtureLogs).values(data);
  return { id: result[0].insertId };
}

export async function listNurtureLogsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nurtureLogs).where(eq(nurtureLogs.customerId, customerId)).orderBy(desc(nurtureLogs.createdAt));
}

export async function listAllNurtureLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nurtureLogs).orderBy(desc(nurtureLogs.createdAt)).limit(200);
}
export async function updateNurtureLog(id: number, data: Partial<InsertNurtureLog>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(nurtureLogs).set(data).where(eq(nurtureLogs.id, id));
}

/* ═══════════════════════════════════════════════════════
   REPORTS
   ═══════════════════════════════════════════════════════ */
export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reports).values(data);
  return { id: result[0].insertId };
}

export async function listReportsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.customerId, customerId)).orderBy(desc(reports.createdAt));
}

export async function listAllReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt)).limit(200);
}
export async function updateReport(id: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(reports).set(data).where(eq(reports.id, id));
}

/* ═══════════════════════════════════════════════════════
   UPSELL OPPORTUNITIES
   ═══════════════════════════════════════════════════════ */
export async function createUpsellOpportunity(data: InsertUpsellOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(upsellOpportunities).values(data);
  return { id: result[0].insertId };
}

export async function listUpsellsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upsellOpportunities).where(eq(upsellOpportunities.customerId, customerId)).orderBy(desc(upsellOpportunities.createdAt));
}

export async function listUpsells(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(upsellOpportunities).where(eq(upsellOpportunities.status, statusFilter as any)).orderBy(desc(upsellOpportunities.createdAt));
  }
  return db.select().from(upsellOpportunities).orderBy(desc(upsellOpportunities.createdAt));
}

export async function updateUpsellOpportunity(id: number, data: Partial<InsertUpsellOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(upsellOpportunities).set(data).where(eq(upsellOpportunities.id, id));
}

/* ═══════════════════════════════════════════════════════
   CONTACT SUBMISSIONS
   ═══════════════════════════════════════════════════════ */
export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contactSubmissions).values(data);
  return { id: result[0].insertId };
}

export async function listContactSubmissions(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(contactSubmissions).where(eq(contactSubmissions.status, statusFilter as any)).orderBy(desc(contactSubmissions.createdAt));
  }
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function updateContactSubmission(id: number, data: Partial<InsertContactSubmission>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contactSubmissions).set(data).where(eq(contactSubmissions.id, id));
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD STATS (aggregated queries)
   ═══════════════════════════════════════════════════════ */
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [repCount] = await db.select({ count: sql<number>`count(*)` }).from(reps);
  const [activeRepCount] = await db.select({ count: sql<number>`count(*)` }).from(reps).where(inArray(reps.status, ["active", "certified"]));
  const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [hotLeadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.temperature, "hot"));
  const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
  const [activeContractCount] = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.status, "active"));
  const [totalRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(monthlyPrice), 0)` }).from(contracts).where(eq(contracts.status, "active"));
  const [pendingCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(commissions).where(eq(commissions.status, "pending"));

  return {
    totalReps: repCount.count,
    activeReps: activeRepCount.count,
    totalLeads: leadCount.count,
    hotLeads: hotLeadCount.count,
    totalCustomers: customerCount.count,
    activeContracts: activeContractCount.count,
    monthlyRevenue: totalRevenue.total,
    pendingCommissions: pendingCommissions.total,
  };
}

/* ═══════════════════════════════════════════════════════
   ORDERS — Stripe payment tracking
   ═══════════════════════════════════════════════════════ */
export async function createOrder(data: {
  userId: number;
  stripeCheckoutSessionId?: string;
  packageTier: "starter" | "growth" | "premium";
  amount: number;
  customerEmail?: string;
  customerName?: string;
  businessName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values({
    userId: data.userId,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
    packageTier: data.packageTier,
    amount: data.amount,
    status: "pending",
    currency: "usd",
    customerEmail: data.customerEmail || null,
    customerName: data.customerName || null,
    businessName: data.businessName || null,
  });
  return { id: result[0].insertId };
}

export async function listOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function listAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderBySessionId(sessionId: string, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data as any).where(eq(orders.stripeCheckoutSessionId, sessionId));
}

/* ═══════════════════════════════════════════════════════
   ONBOARDING PROJECTS
   ═══════════════════════════════════════════════════════ */
export async function createOnboardingProject(data: InsertOnboardingProject) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(onboardingProjects).values(data);
  return { id: result[0].insertId };
}

export async function getOnboardingProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardingProjects).where(eq(onboardingProjects.id, id)).limit(1);
  return result[0];
}

export async function getOnboardingProjectByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardingProjects).where(eq(onboardingProjects.customerId, customerId)).orderBy(desc(onboardingProjects.createdAt)).limit(1);
  return result[0];
}

export async function getOnboardingProjectByBusinessName(businessName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardingProjects).where(eq(onboardingProjects.businessName, businessName)).orderBy(desc(onboardingProjects.createdAt)).limit(1);
  return result[0];
}

export async function listOnboardingProjects(stageFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (stageFilter) {
    return db.select().from(onboardingProjects).where(eq(onboardingProjects.stage, stageFilter as any)).orderBy(desc(onboardingProjects.createdAt));
  }
  return db.select().from(onboardingProjects).orderBy(desc(onboardingProjects.createdAt));
}

export async function updateOnboardingProject(id: number, data: Partial<InsertOnboardingProject>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(onboardingProjects).set(data).where(eq(onboardingProjects.id, id));
}

/* ═══════════════════════════════════════════════════════
   SITE VERSIONS — HTML snapshots before revisions
   ═══════════════════════════════════════════════════════ */
export async function createSiteVersion(data: InsertSiteVersion) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(siteVersions).values(data);
  return { id: result[0].insertId };
}

export async function listSiteVersions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(siteVersions)
    .where(eq(siteVersions.projectId, projectId))
    .orderBy(desc(siteVersions.versionNumber));
}

export async function getNextSiteVersionNumber(projectId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db
    .select({ maxVer: sql<number>`COALESCE(MAX(${siteVersions.versionNumber}), 0)` })
    .from(siteVersions)
    .where(eq(siteVersions.projectId, projectId));
  return (result[0]?.maxVer ?? 0) + 1;
}

/* ═══════════════════════════════════════════════════════
   WEBSITE BLUEPRINTS — Customer-approved site briefs
   ═══════════════════════════════════════════════════════ */
export async function createBlueprint(data: InsertWebsiteBlueprint) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(websiteBlueprints).values(data);
  return { id: result[0].insertId };
}

export async function getBlueprintByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(websiteBlueprints)
    .where(eq(websiteBlueprints.projectId, projectId))
    .orderBy(desc(websiteBlueprints.versionNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function listBlueprintsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(websiteBlueprints)
    .where(eq(websiteBlueprints.projectId, projectId))
    .orderBy(desc(websiteBlueprints.versionNumber));
}

export async function updateBlueprint(id: number, data: Partial<InsertWebsiteBlueprint>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(websiteBlueprints).set(data).where(eq(websiteBlueprints.id, id));
}

export async function listBlueprintsAdmin(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(websiteBlueprints)
    .orderBy(desc(websiteBlueprints.createdAt))
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   PROJECT ASSETS
   ═══════════════════════════════════════════════════════ */
export async function createProjectAsset(data: InsertProjectAsset) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(projectAssets).values(data);
  return { id: result[0].insertId };
}

export async function listProjectAssets(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectAssets).where(eq(projectAssets.projectId, projectId)).orderBy(desc(projectAssets.createdAt));
}

export async function updateProjectAsset(id: number, data: Partial<InsertProjectAsset>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(projectAssets).set(data).where(eq(projectAssets.id, id));
}

export async function getProjectAssetById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(projectAssets).where(eq(projectAssets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listApprovedProjectAssets(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(projectAssets)
    .where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.qualityStatus as any, "approved")))
    .orderBy(desc(projectAssets.createdAt));
}

export async function deleteProjectAsset(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(projectAssets).where(eq(projectAssets.id, id));
}

/* ═══════════════════════════════════════════════════════
   AI CHAT LOGS
   ═══════════════════════════════════════════════════════ */
export async function createAiChatLog(data: InsertAiChatLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(aiChatLogs).values(data);
  return { id: result[0].insertId };
}
export async function listAiChatLogs(opts: { context: "onboarding" | "portal"; userId?: number; projectId?: number; customerId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiChatLogs.context, opts.context)];
  if (opts.userId) conditions.push(eq(aiChatLogs.userId, opts.userId));
  if (opts.projectId) conditions.push(eq(aiChatLogs.projectId, opts.projectId));
  if (opts.customerId) conditions.push(eq(aiChatLogs.customerId, opts.customerId));
  return db.select().from(aiChatLogs).where(and(...conditions)).orderBy(aiChatLogs.createdAt);
}

/* ═══════════════════════════════════════════════════════
   WIDGET CATALOG
   ═══════════════════════════════════════════════════════ */
export async function createWidgetCatalogItem(data: InsertWidgetCatalogItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(widgetCatalog).values(data);
  return { id: result[0].insertId };
}
export async function listWidgetCatalog(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(widgetCatalog).where(eq(widgetCatalog.isActive, true)).orderBy(widgetCatalog.sortOrder);
  }
  return db.select().from(widgetCatalog).orderBy(widgetCatalog.sortOrder);
}
export async function getWidgetBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(widgetCatalog).where(eq(widgetCatalog.slug, slug)).limit(1);
  return result[0];
}
export async function updateWidgetCatalogItem(id: number, data: Partial<InsertWidgetCatalogItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(widgetCatalog).set(data).where(eq(widgetCatalog.id, id));
}
export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result[0];
}

export async function getCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.userId, userId as any)).limit(1);
  return result[0];
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER CARD PACKET — B-Card Gate admin helper
   Returns the complete lifetime customer card for a given
   customer/user/project, covering identity, source, lead,
   rep attribution, contracts, agreements, projects,
   blueprints, build reports, and communication summary.
   ═══════════════════════════════════════════════════════ */
export async function getCustomerCardPacket(opts: {
  customerId?: number;
  userId?: number;
  projectId?: number;
  email?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  // Resolve customer
  let customer: any = null;
  if (opts.customerId) {
    [customer] = await db.select().from(customers).where(eq(customers.id, opts.customerId)).limit(1);
  } else if (opts.userId) {
    [customer] = await db.select().from(customers).where(eq(customers.userId, opts.userId as any)).limit(1);
  } else if (opts.email) {
    [customer] = await db.select().from(customers).where(eq(customers.email, opts.email)).limit(1);
  } else if (opts.projectId) {
    const [proj] = await db.select({ customerId: onboardingProjects.customerId })
      .from(onboardingProjects).where(eq(onboardingProjects.id, opts.projectId)).limit(1);
    if (proj?.customerId) {
      [customer] = await db.select().from(customers).where(eq(customers.id, proj.customerId)).limit(1);
    }
  }
  if (!customer) return null;

  // Lead (origination)
  const lead = customer.leadId
    ? (await db.select().from(leads).where(eq(leads.id, customer.leadId)).limit(1))[0] ?? null
    : null;

  // Contracts
  const customerContracts = await db.select().from(contracts)
    .where(eq(contracts.customerId, customer.id)).orderBy(desc(contracts.createdAt));

  // Onboarding projects
  const projects = await db.select().from(onboardingProjects)
    .where(eq(onboardingProjects.customerId, customer.id)).orderBy(desc(onboardingProjects.createdAt));

  // Agreements (per project)
  const agreementsByProject: Record<number, any[]> = {};
  for (const proj of projects) {
    agreementsByProject[proj.id] = await db.select().from(customerAgreements)
      .where(eq(customerAgreements.projectId, proj.id)).orderBy(desc(customerAgreements.createdAt));
  }

  // Blueprints (per project)
  const blueprintsByProject: Record<number, any> = {};
  for (const proj of projects) {
    const [bp] = await db.select({
      id: websiteBlueprints.id,
      status: websiteBlueprints.status,
      versionNumber: websiteBlueprints.versionNumber,
      approvedAt: websiteBlueprints.approvedAt,
      adminBlueprintReviewStatus: websiteBlueprints.adminBlueprintReviewStatus,
      createdAt: websiteBlueprints.createdAt,
    }).from(websiteBlueprints).where(eq(websiteBlueprints.projectId, proj.id)).limit(1);
    if (bp) blueprintsByProject[proj.id] = bp;
  }

  // Build reports (per project)
  const buildReportsByProject: Record<number, any[]> = {};
  for (const proj of projects) {
    buildReportsByProject[proj.id] = await db.select().from(siteBuildReports)
      .where(eq(siteBuildReports.projectId, proj.id)).orderBy(desc(siteBuildReports.createdAt));
  }

  // Support tickets
  const tickets = await db.select().from(supportTickets)
    .where(eq(supportTickets.customerId, customer.id)).orderBy(desc(supportTickets.createdAt));

  // Lead costs (acquisition cost records)
  const leadCostSummary = { totalCostCents: customer.totalLifetimeCostCents ?? 0, totalRevenueCents: customer.totalLifetimeRevenueCents ?? 0 };

  // Contract agreements status
  const hasAcceptedAgreement = Object.values(agreementsByProject)
    .some(list => list.some((a: any) => a.acceptedAt));

  return {
    identity: {
      customerId: customer.id,
      userId: customer.userId,
      businessName: customer.businessName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      healthScore: customer.healthScore,
    },
    source: {
      acquisitionSource: customer.acquisitionSource,
      leadId: customer.leadId,
      leadSource: lead?.source ?? null,
      leadChannel: lead?.acquisitionChannel ?? null,
      leadCreatedAt: lead?.createdAt ?? null,
      leadStage: lead?.stage ?? null,
      repId: lead?.assignedRepId ?? null,
    },
    costs: leadCostSummary,
    contracts: customerContracts.map((c: any) => ({
      id: c.id,
      packageTier: c.packageTier,
      monthlyPrice: c.monthlyPrice,
      status: c.status,
      stripeSubscriptionId: c.stripeSubscriptionId,
      contractSignedAt: c.contractSignedAt,
      startDate: c.startDate,
      endDate: c.endDate,
      renewalStatus: c.renewalStatus,
    })),
    agreementStatus: {
      hasAcceptedAgreement,
      totalAgreements: Object.values(agreementsByProject).reduce((s, l) => s + l.length, 0),
    },
    projects: projects.map((p: any) => ({
      id: p.id,
      businessName: p.businessName,
      packageTier: p.packageTier,
      stage: p.stage,
      generationStatus: p.generationStatus,
      paymentConfirmedAt: p.paymentConfirmedAt,
      adminPreviewApprovedAt: p.adminPreviewApprovedAt,
      launchedAt: p.launchedAt,
      createdAt: p.createdAt,
      agreements: agreementsByProject[p.id] ?? [],
      blueprint: blueprintsByProject[p.id] ?? null,
      buildReports: buildReportsByProject[p.id] ?? [],
    })),
    supportTickets: tickets.map((t: any) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
    })),
    lifecycleStatus: customer.status,
    createdAt: customer.createdAt,
  };
}

/* ═══════════════════════════════════════════════════════
   REP TRAINING MODULES
   ═══════════════════════════════════════════════════════ */
export async function listTrainingModules(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(repTrainingModules).where(eq(repTrainingModules.isActive, true)).orderBy(repTrainingModules.sortOrder);
  }
  return db.select().from(repTrainingModules).orderBy(repTrainingModules.sortOrder);
}
export async function getTrainingModule(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repTrainingModules).where(eq(repTrainingModules.id, id)).limit(1);
  return result[0];
}
export async function createTrainingModule(data: InsertRepTrainingModule) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repTrainingModules).values(data);
  return { id: result[0].insertId };
}
export async function updateTrainingModule(id: number, data: Partial<InsertRepTrainingModule>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repTrainingModules).set(data).where(eq(repTrainingModules.id, id));
}
/* ═══════════════════════════════════════════════════════
   REP TRAINING PROGRESS
   ═══════════════════════════════════════════════════════ */
export async function getRepTrainingProgress(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repTrainingProgress).where(eq(repTrainingProgress.repId, repId));
}
export async function upsertTrainingProgress(repId: number, moduleId: number, status: "not_started" | "in_progress" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(repTrainingProgress)
    .where(and(eq(repTrainingProgress.repId, repId), eq(repTrainingProgress.moduleId, moduleId))).limit(1);
  if (existing.length > 0) {
    await db.update(repTrainingProgress)
      .set({ status, completedAt: status === "completed" ? new Date() : null })
      .where(eq(repTrainingProgress.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(repTrainingProgress).values({
      repId, moduleId, status, completedAt: status === "completed" ? new Date() : undefined,
    });
    return result[0].insertId;
  }
}
/* ═══════════════════════════════════════════════════════
   REP QUIZ RESULTS
   ═══════════════════════════════════════════════════════ */
export async function createQuizResult(data: InsertRepQuizResult) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repQuizResults).values(data);
  return { id: result[0].insertId };
}
export async function getRepQuizResults(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repQuizResults).where(eq(repQuizResults.repId, repId)).orderBy(desc(repQuizResults.createdAt));
}
/* ═══════════════════════════════════════════════════════
   REP ACTIVITY LOGS
   ═══════════════════════════════════════════════════════ */
export async function createActivityLog(data: InsertRepActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repActivityLogs).values(data);
  return { id: result[0].insertId };
}
export async function listRepActivities(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repActivityLogs).where(eq(repActivityLogs.repId, repId)).orderBy(desc(repActivityLogs.createdAt)).limit(limit);
}
export async function getRepActivityStats(repId: number) {
  const db = await getDb();
  if (!db) return { totalActivities: 0, todayActivities: 0, totalPoints: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [total] = await db.select({ count: sql<number>`count(*)`, points: sql<number>`COALESCE(sum(pointsEarned), 0)` })
    .from(repActivityLogs).where(eq(repActivityLogs.repId, repId));
  const [todayCount] = await db.select({ count: sql<number>`count(*)` })
    .from(repActivityLogs).where(and(eq(repActivityLogs.repId, repId), gte(repActivityLogs.createdAt, today)));
  return { totalActivities: total?.count || 0, todayActivities: todayCount?.count || 0, totalPoints: total?.points || 0 };
}
export async function getRepFollowUps(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repActivityLogs)
    .where(and(eq(repActivityLogs.repId, repId), sql`followUpAt IS NOT NULL AND followUpAt >= NOW()`))
    .orderBy(repActivityLogs.followUpAt).limit(20);
}
/* ═══════════════════════════════════════════════════════
   REP GAMIFICATION
   ═══════════════════════════════════════════════════════ */
export async function getRepGamification(repId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repGamification).where(eq(repGamification.repId, repId)).limit(1);
  return result[0];
}
export async function upsertRepGamification(repId: number, data: Partial<InsertRepGamification>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(repGamification).where(eq(repGamification.repId, repId)).limit(1);
  if (existing.length > 0) {
    await db.update(repGamification).set(data).where(eq(repGamification.repId, repId));
    return existing[0].id;
  } else {
    const result = await db.insert(repGamification).values({ repId, ...data } as any);
    return result[0].insertId;
  }
}
export async function getLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    repId: repGamification.repId,
    totalPoints: repGamification.totalPoints,
    level: repTiers.tier, // accountability tier (bronze/silver/gold/platinum)
    currentStreak: repGamification.currentStreak,
    monthlyDeals: repGamification.monthlyDeals,
    repName: reps.fullName,
    profilePhotoUrl: reps.profilePhotoUrl,
    totalDeals: reps.totalDeals,
    totalRevenue: reps.totalRevenue,
  }).from(repGamification)
    .leftJoin(reps, eq(repGamification.repId, reps.id))
    .leftJoin(repTiers, eq(repGamification.repId, repTiers.repId))
    .orderBy(desc(repGamification.totalPoints))
    .limit(limit);
}
/* ═══════════════════════════════════════════════════════
   REP EMAIL TEMPLATES
   ═══════════════════════════════════════════════════════ */
export async function listEmailTemplates(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(repEmailTemplates).where(eq(repEmailTemplates.isActive, true)).orderBy(repEmailTemplates.sortOrder);
  }
  return db.select().from(repEmailTemplates).orderBy(repEmailTemplates.sortOrder);
}
export async function getEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repEmailTemplates).where(eq(repEmailTemplates.id, id)).limit(1);
  return result[0];
}
export async function createEmailTemplate(data: InsertRepEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repEmailTemplates).values(data);
  return { id: result[0].insertId };
}
export async function updateEmailTemplate(id: number, data: Partial<InsertRepEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repEmailTemplates).set(data).where(eq(repEmailTemplates.id, id));
}
/* ═══════════════════════════════════════════════════════
   REP SENT EMAILS
   ═══════════════════════════════════════════════════════ */
export async function createSentEmail(data: InsertRepSentEmail) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repSentEmails).values(data);
  return { id: result[0].insertId };
}
export async function listRepSentEmails(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSentEmails).where(eq(repSentEmails.repId, repId)).orderBy(desc(repSentEmails.sentAt)).limit(limit);
}
export async function updateEmailResendId(emailId: number, resendMessageId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(repSentEmails).set({ resendMessageId }).where(eq(repSentEmails.id, emailId));
}
export async function updateEmailTrackingStatus(resendMessageId: string, status: string, timestamp: Date) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, any> = { status };
  if (status === "delivered") updates.deliveredAt = timestamp;
  if (status === "opened") updates.openedAt = timestamp;
  if (status === "clicked") updates.clickedAt = timestamp;
  if (status === "bounced") updates.bouncedAt = timestamp;
  await db.update(repSentEmails).set(updates).where(eq(repSentEmails.resendMessageId, resendMessageId));
}
export async function getEmailByResendId(resendMessageId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSentEmails).where(eq(repSentEmails.resendMessageId, resendMessageId)).limit(1);
  return result[0] ?? null;
}
/* ═══════════════════════════════════════════════════════
   REP APPLICATIONS
   ═══════════════════════════════════════════════════════ */
export async function createRepApplication(data: InsertRepApplication) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repApplications).values(data);
  return { id: result[0].insertId };
}
export async function getRepApplication(repId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repApplications).where(eq(repApplications.repId, repId)).limit(1);
  return result[0];
}
export async function updateRepApplication(repId: number, data: Partial<InsertRepApplication>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repApplications).set(data).where(eq(repApplications.repId, repId));
}


/* ═══════════════════════════════════════════════════════
   REP NOTIFICATIONS
   ═══════════════════════════════════════════════════════ */
export async function createRepNotification(data: InsertRepNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repNotifications).values(data);
  return { id: result[0].insertId };
}
export async function listRepNotifications(repId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repNotifications).where(eq(repNotifications.repId, repId)).orderBy(desc(repNotifications.createdAt)).limit(limit);
}
export async function countUnreadNotifications(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(repNotifications)
    .where(and(eq(repNotifications.repId, repId), eq(repNotifications.isRead, false)));
  return result?.count || 0;
}
export async function markNotificationsRead(repId: number, ids?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (ids && ids.length > 0) {
    await db.update(repNotifications).set({ isRead: true }).where(and(eq(repNotifications.repId, repId), inArray(repNotifications.id, ids)));
  } else {
    await db.update(repNotifications).set({ isRead: true }).where(eq(repNotifications.repId, repId));
  }
}

/* ═══════════════════════════════════════════════════════
   LEADS — Rep-facing helpers
   ═══════════════════════════════════════════════════════ */
export async function listLeadsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.assignedRepId, repId)).orderBy(desc(leads.updatedAt));
}
export async function listUnassignedLeads(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  // Leads that have no rep assigned and are in claimable stages
  const { isNull } = await import("drizzle-orm");
  return db.select().from(leads)
    .where(and(
      isNull(leads.assignedRepId),
      inArray(leads.stage, ["new", "enriched", "warming", "warm"])
    ))
    .orderBy(desc(leads.qualificationScore))
    .limit(limit);
}
export async function claimLead(leadId: number, repId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Atomic claim: only succeeds if lead is currently unassigned
  const result = await db.update(leads)
    .set({ assignedRepId: repId, stage: "assigned", temperature: "warm" })
    .where(and(
      eq(leads.id, leadId),
      sql`assignedRepId IS NULL`
    ));
  return (result[0] as any).affectedRows > 0;
}
export async function countActiveLeadsByRep(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(leads)
    .where(and(
      eq(leads.assignedRepId, repId),
      inArray(leads.stage, ["assigned", "contacted", "proposal_sent", "negotiating"])
    ));
  return result?.count || 0;
}
export async function bulkTransferLeads(fromRepId: number, toRepId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.update(leads)
    .set({ assignedRepId: toRepId })
    .where(and(
      eq(leads.assignedRepId, fromRepId),
      inArray(leads.stage, ["assigned", "contacted", "proposal_sent", "negotiating"])
    ));
  return (result[0] as any).affectedRows || 0;
}

// Get a single commission by ID
export async function getCommissionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.select().from(commissions).where(eq(commissions.id, id));
  return row || null;
}

// Get a single widget catalog item by ID
export async function getWidgetCatalogItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(widgetCatalog).where(eq(widgetCatalog.id, id)).limit(1);
  return result[0];
}


/* ═══════════════════════════════════════════════════════
   SMS MESSAGES
   ═══════════════════════════════════════════════════════ */
export async function createSmsMessage(data: InsertSmsMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(smsMessages).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateSmsMessage(id: number, data: Partial<InsertSmsMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smsMessages).set(data).where(eq(smsMessages.id, id));
}

export async function listSmsThread(repId: number, phoneNumber: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smsMessages)
    .where(and(
      eq(smsMessages.repId, repId),
      or(eq(smsMessages.toNumber, phoneNumber), eq(smsMessages.fromNumber, phoneNumber))
    ))
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit);
}

export async function listRepSmsConversations(repId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all SMS for this rep, ordered by most recent first
  return db.select().from(smsMessages)
    .where(eq(smsMessages.repId, repId))
    .orderBy(desc(smsMessages.createdAt));
}

/* ═══════════════════════════════════════════════════════
   CALL LOGS
   ═══════════════════════════════════════════════════════ */
export async function createCallLog(data: InsertCallLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(callLogs).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateCallLog(id: number, data: Partial<InsertCallLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callLogs).set(data).where(eq(callLogs.id, id));
}

export async function updateCallLogByCallSid(callSid: string, data: Partial<InsertCallLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callLogs).set(data).where(eq(callLogs.twilioCallSid, callSid));
}

export async function getCallLogByCallSid(callSid: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(callLogs).where(eq(callLogs.twilioCallSid, callSid)).limit(1);
  return result[0] ?? null;
}

export async function listRepCallLogs(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callLogs)
    .where(eq(callLogs.repId, repId))
    .orderBy(desc(callLogs.createdAt))
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   AI COACHING FEEDBACK
   ═══════════════════════════════════════════════════════ */
export async function createCoachingFeedback(data: InsertAiCoachingFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiCoachingFeedback).values(data);
  return { id: result[0].insertId, ...data };
}

export async function getCoachingFeedback(communicationType: string, referenceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aiCoachingFeedback)
    .where(and(
      eq(aiCoachingFeedback.communicationType, communicationType as any),
      eq(aiCoachingFeedback.referenceId, referenceId)
    ))
    .limit(1);
  return result[0] ?? null;
}

export async function listRepCoachingFeedback(repId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiCoachingFeedback)
    .where(eq(aiCoachingFeedback.repId, repId))
    .orderBy(desc(aiCoachingFeedback.createdAt))
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   TRAINING INSIGHTS
   ═══════════════════════════════════════════════════════ */
export async function createTrainingInsight(data: InsertTrainingInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainingInsights).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateTrainingInsight(id: number, data: Partial<InsertTrainingInsight>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trainingInsights).set(data).where(eq(trainingInsights.id, id));
}

export async function listTrainingInsights(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(trainingInsights)
      .where(eq(trainingInsights.isActive, true))
      .orderBy(desc(trainingInsights.frequency));
  }
  return db.select().from(trainingInsights).orderBy(desc(trainingInsights.frequency));
}

export async function getTrainingInsightByTitle(title: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trainingInsights)
    .where(eq(trainingInsights.title, title))
    .limit(1);
  return result[0] ?? null;
}

// Update existing email to track Resend message ID
export async function updateSentEmail(id: number, data: Partial<InsertRepSentEmail>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(repSentEmails).set(data).where(eq(repSentEmails.id, id));
}

export async function getSentEmailById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSentEmails).where(eq(repSentEmails.id, id)).limit(1);
  return result[0] ?? null;
}


// ═══════════════════════════════════════════════════════
// REP PROFILE PHOTO
// ═══════════════════════════════════════════════════════
export async function updateRepProfilePhoto(repId: number, photoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reps).set({ profilePhotoUrl: photoUrl }).where(eq(reps.id, repId));
}

// ═══════════════════════════════════════════════════════
// SMS OPT-OUT
// ═══════════════════════════════════════════════════════
export async function markLeadSmsOptedOut(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ smsOptedOut: true, smsOptOutAt: new Date() }).where(eq(leads.id, leadId));
}

export async function markLeadFirstSmsSent(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ smsFirstMessageSent: true }).where(eq(leads.id, leadId));
}

export async function getLeadByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  return result[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════════════════
export async function createSupportTicket(data: InsertRepSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(repSupportTickets).values(data);
  return result[0].insertId;
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSupportTickets).where(eq(repSupportTickets.id, id)).limit(1);
  return result[0] ?? null;
}

export async function listRepSupportTickets(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSupportTickets)
    .where(eq(repSupportTickets.repId, repId))
    .orderBy(desc(repSupportTickets.createdAt));
}

export async function listAllSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSupportTickets)
    .orderBy(desc(repSupportTickets.createdAt));
}

export async function updateSupportTicket(id: number, data: Partial<InsertRepSupportTicket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(repSupportTickets).set(data).where(eq(repSupportTickets.id, id));
}

// ═══════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════
const DEFAULT_NOTIFICATION_CATEGORIES = [
  "new_lead", "coaching_feedback", "ticket_update", "commission", "training", "system"
];

export async function getRepNotificationPreferences(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repNotificationPreferences)
    .where(eq(repNotificationPreferences.repId, repId));
}

export async function upsertNotificationPreference(repId: number, category: string, enabled: boolean, pushEnabled: boolean, inAppEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if preference exists
  const existing = await db.select().from(repNotificationPreferences)
    .where(and(eq(repNotificationPreferences.repId, repId), eq(repNotificationPreferences.category, category)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(repNotificationPreferences)
      .set({ enabled, pushEnabled, inAppEnabled })
      .where(eq(repNotificationPreferences.id, existing[0].id));
  } else {
    await db.insert(repNotificationPreferences).values({ repId, category, enabled, pushEnabled, inAppEnabled });
  }
}

export async function initDefaultNotificationPreferences(repId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(repNotificationPreferences)
    .where(eq(repNotificationPreferences.repId, repId));
  if (existing.length === 0) {
    const values = DEFAULT_NOTIFICATION_CATEGORIES.map(cat => ({
      repId,
      category: cat,
      enabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    }));
    await db.insert(repNotificationPreferences).values(values);
  }
}

// ═══════════════════════════════════════════════════════
// PUSH SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════
export async function savePushSubscription(data: InsertPushSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove existing subscription for same endpoint
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint as string));
  const result = await db.insert(pushSubscriptions).values(data);
  return result[0].insertId;
}

export async function getRepPushSubscriptions(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.repId, repId));
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// ═══════════════════════════════════════════════════════
// OWNER LOOKUP
// ═══════════════════════════════════════════════════════
export async function getOwnerUser() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1);
  return result[0] ?? null;
}

// Get the most recent pending_approval ticket (for owner SMS reply matching)
export async function getMostRecentPendingTicket() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSupportTickets)
    .where(eq(repSupportTickets.status, "pending_approval"))
    .orderBy(desc(repSupportTickets.createdAt))
    .limit(1);
  return result[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// ADMIN BOOTSTRAP
// Creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars on first run.
// Safe to call on every startup — no-ops if the account already exists.
// ═══════════════════════════════════════════════════════
export async function bootstrapAdminUser(): Promise<void> {
  if (!ENV.adminEmail || !ENV.adminPassword) return;

  const db = await getDb();
  if (!db) {
    console.warn("[AdminBootstrap] Database not available — skipping admin bootstrap");
    return;
  }

  try {
    const existing = await getUserByEmail(ENV.adminEmail);

    if (existing) {
      const updates: Record<string, unknown> = { openId: existing.openId };
      let needsUpdate = false;
      if (existing.role !== "admin") {
        updates.role = "admin";
        needsUpdate = true;
        console.log("[AdminBootstrap] Updated existing user to admin role:", ENV.adminEmail);
      }
      if (ENV.adminPassword) {
        updates.passwordHash = await bcrypt.hash(ENV.adminPassword, 12);
        updates.loginMethod = "email_password";
        needsUpdate = true;
        console.log("[AdminBootstrap] Synced password for admin from ADMIN_PASSWORD env var:", ENV.adminEmail);
      }
      if (needsUpdate) await upsertUser(updates as any);
      return;
    }

    // Create the admin account
    const { randomBytes } = await import("crypto");
    const openId = "local_admin_" + randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(ENV.adminPassword, 12);

    await upsertUser({
      openId,
      email: ENV.adminEmail,
      name: ENV.adminName,
      loginMethod: "email_password",
      passwordHash,
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log("[AdminBootstrap] Admin account created:", ENV.adminEmail);
  } catch (err) {
    console.error("[AdminBootstrap] Failed to bootstrap admin user:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   SUPPORT TICKETS
   ═══════════════════════════════════════════════════════ */
export async function createCustomerSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(supportTickets).values(data);
  return result.insertId as number;
}

export async function listCustomerSupportTickets(customerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (customerId !== undefined) {
    return db.select().from(supportTickets).where(eq(supportTickets.customerId, customerId)).orderBy(desc(supportTickets.createdAt));
  }
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function getCustomerSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateCustomerSupportTicket(id: number, data: Partial<typeof supportTickets.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set(data).where(eq(supportTickets.id, id));
}

export async function createSupportTicketReply(data: InsertSupportTicketReply) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(supportTicketReplies).values(data);
  return result.insertId as number;
}

export async function listSupportTicketReplies(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTicketReplies).where(eq(supportTicketReplies.ticketId, ticketId)).orderBy(supportTicketReplies.createdAt);
}

export async function countOpenSupportTickets() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open"));
  return rows[0]?.count ?? 0;
}

/* ═══════════════════════════════════════════════════════
   REP MESSAGES
   ═══════════════════════════════════════════════════════ */
export async function createRepMessage(data: InsertRepMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(repMessages).values(data);
  return result.insertId as number;
}

export async function listRepMessages(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repMessages).where(eq(repMessages.repId, repId)).orderBy(repMessages.createdAt);
}

export async function listAllRepMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repMessages).orderBy(desc(repMessages.createdAt));
}

export async function markRepMessageRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(repMessages).set({ readAt: new Date() }).where(eq(repMessages.id, id));
}

export async function countUnreadRepMessages() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(repMessages).where(
    and(eq(repMessages.senderRole, "rep"), sql`readAt IS NULL`)
  );
  return rows[0]?.count ?? 0;
}

export async function markAllAdminMessagesReadForRep(repId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(repMessages).set({ readAt: new Date() }).where(
    and(eq(repMessages.repId, repId), eq(repMessages.senderRole, "admin"), isNull(repMessages.readAt))
  );
}

export async function countUnreadAdminMessagesForRep(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(repMessages).where(
    and(eq(repMessages.repId, repId), eq(repMessages.senderRole, "admin"), isNull(repMessages.readAt))
  );
  return Number(rows[0]?.count ?? 0);
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER SUPPORT TICKET RATINGS
   ═══════════════════════════════════════════════════════ */
export async function updateSupportTicketRating(id: number, rating: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set({ customerRating: rating, ratingToken: null }).where(eq(supportTickets.id, id));
}

export async function getSupportTicketByRatingToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.ratingToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function getAvgRatingForRep(repId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ avgRating: avg(supportTickets.customerRating), total: sql<number>`count(*)` })
    .from(supportTickets)
    .innerJoin(contracts, eq(contracts.customerId, supportTickets.customerId))
    .where(and(eq(contracts.repId, repId), sql`${supportTickets.customerRating} IS NOT NULL`));
  const row = rows[0];
  const total = Number(row?.total ?? 0);
  if (total === 0) return null;
  return { avg: Number(row.avgRating ?? 0), total };
}

/* ═══════════════════════════════════════════════════════
   PRODUCT CATALOG
   ═══════════════════════════════════════════════════════ */
export async function listProductCatalog(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(productCatalog).where(eq(productCatalog.active, true)).orderBy(productCatalog.category, productCatalog.basePrice);
  }
  return db.select().from(productCatalog).orderBy(productCatalog.category, productCatalog.basePrice);
}

export const getProductCatalog = () => listProductCatalog(true);

export async function upsertProductCatalogItem(data: InsertProductCatalogItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateSet = { ...data };
  delete (updateSet as any).productKey;
  await db.insert(productCatalog).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

export async function updateProductCatalogItem(id: number, data: Partial<typeof productCatalog.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(productCatalog).set(data).where(eq(productCatalog.id, id));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(productCatalog).where(eq(productCatalog.id, id)).limit(1);
  return results[0] ?? null;
}

export async function updateProductStripeIds(
  id: number,
  data: { stripeProductId: string; stripePriceId: string; stripeDiscountPriceId: string | null }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(productCatalog).set({
    stripeProductId: data.stripeProductId || null,
    stripePriceId: data.stripePriceId || null,
    stripeDiscountPriceId: data.stripeDiscountPriceId,
  }).where(eq(productCatalog.id, id));
}

/* ═══════════════════════════════════════════════════════
   BROADCASTS
   ═══════════════════════════════════════════════════════ */
export async function createBroadcast(data: InsertBroadcast) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(broadcasts).values(data);
  return result.insertId as number;
}

export async function listBroadcasts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
}

export async function updateBroadcast(id: number, data: Partial<typeof broadcasts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(broadcasts).set(data).where(eq(broadcasts.id, id));
}

/* ═══════════════════════════════════════════════════════
   LEAD COSTS — Lifetime economics tracking
   ═══════════════════════════════════════════════════════ */
export async function insertLeadCost(data: InsertLeadCost) {
  const db = await getDb();
  if (!db) return;
  await db.insert(leadCosts).values(data);
}

export async function getLeadCostBreakdown(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadCosts).where(eq(leadCosts.leadId, leadId)).orderBy(desc(leadCosts.createdAt));
}

export async function getCustomerCostBreakdown(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadCosts).where(eq(leadCosts.customerId, customerId)).orderBy(desc(leadCosts.createdAt));
}

export async function getMonthlyEconomicsSummary(month: string) {
  const db = await getDb();
  if (!db) return null;

  const costRows = await db.select({
    costType: leadCosts.costType,
    total: sql<number>`COALESCE(SUM(amountCents), 0)`,
  })
    .from(leadCosts)
    .where(eq(leadCosts.month, month))
    .groupBy(leadCosts.costType);

  const [revRow] = await db.select({ total: sql<number>`COALESCE(SUM(totalLifetimeRevenueCents), 0)` })
    .from(customers);

  const totalCosts = costRows.reduce((s, r) => s + Number(r.total), 0);
  const byType: Record<string, number> = {};
  for (const r of costRows) byType[r.costType] = Number(r.total);

  return { totalCostCents: totalCosts, byType, totalRevenueCents: Number(revRow?.total ?? 0) };
}

export async function getTopExpensiveLeads(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: leads.id,
    businessName: leads.businessName,
    stage: leads.stage,
    totalCostCents: leads.totalCostCents,
    totalRevenueCents: leads.totalRevenueCents,
  })
    .from(leads)
    .where(sql`totalCostCents > 0 AND stage NOT IN ('closed_won', 'closed_lost')`)
    .orderBy(desc(leads.totalCostCents))
    .limit(limit);
}

export async function getTopRoiCustomers(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: customers.id,
    businessName: customers.businessName,
    totalLifetimeCostCents: customers.totalLifetimeCostCents,
    totalLifetimeRevenueCents: customers.totalLifetimeRevenueCents,
  })
    .from(customers)
    .where(sql`totalLifetimeRevenueCents > 0`)
    .orderBy(sql`(totalLifetimeRevenueCents - totalLifetimeCostCents) DESC`)
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   PRODUCT CATALOG SEEDING
   ═══════════════════════════════════════════════════════ */
export async function seedProductCatalog() {
  const db = await getDb();
  if (!db) return;

  // Version gate — only re-seed if v3 catalog hasn't run yet
  const flagRows = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, "product_catalog_v3")).limit(1);
  if (flagRows.length > 0) {
    console.log("[ProductCatalog] v3 catalog already seeded — skipping");
    return;
  }

  type SeedItem = Omit<InsertProductCatalogItem, "id" | "createdAt" | "updatedAt" | "stripePriceId" | "stripeProductId" | "stripeDiscountPriceId" | "discountDuration">;
  const seed: SeedItem[] = [
    // ── Core packages ──────────────────────────────────────────────────────────
    { productKey: "starter", name: "Starter Website", description: "5-page professional website, mobile-responsive, SEO optimized", category: "package", basePrice: "195.00", discountPercent: 0, isFree: false, active: true },
    { productKey: "growth", name: "Growth Website", description: "10-page website with blog, lead capture forms, analytics dashboard", category: "package", basePrice: "295.00", discountPercent: 0, isFree: false, active: true },
    { productKey: "premium", name: "Premium Website", description: "15-page website with e-commerce, CRM integration, priority support", category: "package", basePrice: "395.00", discountPercent: 0, isFree: false, active: true },
    // ── eCommerce packages ─────────────────────────────────────────────────────
    { productKey: "shop_starter", name: "Shop Starter", description: "Up to 10 products, inquiry-based ordering", category: "package", basePrice: "295.00", discountPercent: 0, isFree: false, active: true },
    { productKey: "shop_growth", name: "Shop Growth", description: "Up to 25 products, all shop features", category: "package", basePrice: "395.00", discountPercent: 0, isFree: false, active: true },
    { productKey: "shop_premium", name: "Shop Premium", description: "Up to 50 products, premium template", category: "package", basePrice: "495.00", discountPercent: 0, isFree: false, active: true },
    // ── Free features included in every plan ───────────────────────────────────
    {
      productKey: "ssl_certificate", name: "SSL Certificate", description: "HTTPS encryption, auto-renewed annually at no charge",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "Issued and auto-renewed via Let's Encrypt — zero action required from you.",
      active: true,
    },
    {
      productKey: "daily_backups", name: "Daily Backups", description: "Automatic daily site backups with 30-day retention",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "Your full site is snapshotted each night. Restore to any point in 30 days in under 60 seconds.",
      active: true,
    },
    {
      productKey: "mobile_responsive", name: "Mobile-Responsive Design", description: "Flawless display across phones, tablets, and desktops",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "Every layout is designed mobile-first. We test on iOS, Android, and all major browsers before launch.",
      roiExample: "60%+ of local business traffic comes from phones. A broken mobile experience sends them straight to a competitor.",
      active: true,
    },
    {
      productKey: "seo_foundation", name: "SEO Foundation", description: "Meta tags, sitemap, schema markup, and Google Search Console setup",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "We configure title tags, meta descriptions, XML sitemap, structured data, and submit your site to Google on launch day.",
      active: true,
    },
    {
      productKey: "monthly_reports", name: "Monthly Performance Reports", description: "Traffic, rankings, and lead summary emailed every month",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "Every month you get a one-page report: page views, Google ranking changes, form submissions, and top landing pages.",
      active: true,
    },
    {
      productKey: "security_monitoring", name: "Security Monitoring", description: "24/7 malware scanning, firewall protection, and threat alerts",
      category: "addon", basePrice: "0.00", discountPercent: 0, isFree: true,
      howItWorks: "Our security layer scans for malware, blocks bad bots, and alerts us instantly if anything looks wrong.",
      active: true,
    },
    // ── Paid add-ons Elena pitches ──────────────────────────────────────────────
    {
      productKey: "review_collector", name: "Review Collector", description: "Automated Google review collection after every service",
      category: "addon", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["review", "reputation", "google", "rating", "word of mouth", "referral", "yelp", "testimonial", "reviews"]),
      pitchScript: "For a [business type] like [business name], Google reviews are everything. The Review Collector at $149/month automatically texts your customers after a job and sends them straight to your Google review page. Nothing to set up on your end — it runs completely automatically from day one. Most clients go from 10-15 reviews to 50+ within 90 days. At $149/month one extra client from better reviews pays for months. Add it?",
      howItWorks: "Completely automatic — after a service, the system texts the customer with a personalized message and a direct link to your Google review page. Nothing required from you after launch.",
      roiExample: "Going from 12 to 80 Google reviews typically moves a local business from page 2 to the top 3 in Google Maps — that's the difference between 5 calls/week and 25.",
      active: true,
    },
    {
      productKey: "booking_widget", name: "Booking Widget", description: "Online appointment scheduling embedded directly on your site",
      category: "addon", basePrice: "199.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["appointment", "booking", "schedule", "reservation", "consultation", "calendar", "availability", "book", "appointments", "scheduling"]),
      pitchScript: "Since you take appointments — the Booking Widget at $199/month is a no-brainer for [business name]. Customers book directly on your site 24/7, no phone tag. One thing to know: after we build it, you'll spend about 5 minutes in your portal setting your available hours — pick the days and times that work for you and it runs itself after that. If it books just 2 extra appointments per month from people who would've left your site, it pays for itself many times over. Want to add it?",
      howItWorks: "We build your /book page and configure it from your onboarding info. After launch you set your available hours in your portal (5 minutes). Customers pick a time, you get an SMS + email, they get a confirmation.",
      roiExample: "If you charge $150/appointment and book just 2 more per week, that's $1,200/month in extra revenue from a $199 add-on.",
      active: true,
    },
    {
      productKey: "ai_chatbot", name: "AI Chatbot", description: "24/7 AI assistant trained on your business — answers questions and captures leads",
      category: "addon", basePrice: "299.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["questions", "inquiries", "after hours", "same questions", "menu questions", "pricing questions", "faq", "chat", "24/7", "always available", "always on", "hours"]),
      pitchScript: "Something worth considering for [business name]: the AI Chatbot at $299/month. It's trained on your business — your services, hours, pricing — and answers questions 24/7. Nothing you need to do to set it up — we train it from your onboarding info and it's live on your site the day you launch. Someone lands on your site at 11pm with a question, the chatbot answers them and captures their contact info. Wake up to warm leads. Want to add it?",
      howItWorks: "Completely automatic — we train the chatbot on your FAQs, services, pricing, and hours from your onboarding info. It handles conversations on your site, captures contact info, and escalates complex requests to you via text. Nothing required from you after launch.",
      roiExample: "If the chatbot captures 4 leads/month that would have bounced, and you close 2 at $500 average — that's $1,000/month from a $299 add-on.",
      active: true,
    },
    {
      productKey: "lead_capture_bot", name: "Lead Capture Bot", description: "Proactively engages visitors and collects contact info before they bounce",
      category: "addon", basePrice: "249.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["leads", "traffic", "visitors", "bounce", "competition", "competitive", "more customers", "more clients", "generate leads", "capture leads", "funnel"]),
      pitchScript: "When someone visits your site and is about to leave without contacting you, the Lead Capture Bot at $249/month pops up with a targeted offer — free quote, free consultation, whatever fits [business name]. Nothing to set up — we configure the offer automatically based on your business type and it's live on launch day. Recovers 5-10% of visitors who would have left. At your service prices, one recovered lead per month pays for it many times over. Add it?",
      howItWorks: "Completely automatic — uses exit-intent detection and scroll depth to trigger personalized messages. Configured from your onboarding info and live on launch day. Captures name, email, and phone. Nothing required from you after launch.",
      roiExample: "200 visitors × 10% capture rate = 20 extra leads/month. Close 5 at $300 avg = $1,500/month from a $249 add-on.",
      active: true,
    },
    {
      productKey: "seo_autopilot", name: "SEO Autopilot", description: "Monthly AI-written blog posts + ongoing technical SEO optimization",
      category: "addon", basePrice: "199.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["google", "search", "rank", "seo", "found online", "organic", "traffic", "blog", "content", "competitors rank higher", "show up", "search engine", "ranking"]),
      pitchScript: "One thing I'd push hard on for [business type] in [city]: SEO Autopilot at $199/month. We write and publish 2 optimized blog posts every month targeting the exact searches your customers make. You don't need to do anything — we research, write, and publish automatically. Most clients start seeing Google ranking movement in 60-90 days. One new customer from search pays for 3 months. Worth it?",
      howItWorks: "Completely automatic — we research the top keywords your competitors rank for, write 2 blog posts/month targeting those terms, and run a technical SEO audit quarterly. Published to your site automatically. Nothing required from you after launch.",
      roiExample: "Ranking on page 1 for '[city] + [service]' typically generates 50-200 extra visits/month. At a 3% conversion rate, that's 1-6 new leads/month, ongoing and compounding.",
      active: true,
    },
    {
      productKey: "sms_alerts", name: "SMS Lead Alerts", description: "Instant SMS notification the moment a new lead submits a form",
      category: "addon", basePrice: "79.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["miss leads", "phone", "text", "sms", "fast response", "call back", "lead alerts", "instant notification", "miss calls", "miss messages", "speed", "respond fast"]),
      pitchScript: "Quick one for [business name]: SMS Lead Alerts at $79/month. The second someone fills out your contact form, you get a text with their name, number, and message. Nothing to set up — we wire it to the phone number you gave us. Responding within 5 minutes makes you 100x more likely to close that lead vs waiting even 30 minutes. For [business type] where competition is real, speed wins. Add it?",
      howItWorks: "Completely automatic — when a form is submitted, you get an instant SMS with the lead's name, phone number, and their message. Wired to the phone number from your onboarding. Nothing required from you after launch.",
      roiExample: "Responding within 5 minutes vs. 60 minutes increases conversion by 8×. That's not a marginal improvement — that's transformative.",
      active: true,
    },
    {
      productKey: "social_feed_embed", name: "Social Feed Embed", description: "Live Instagram, Facebook, or TikTok feed embedded on your site",
      category: "addon", basePrice: "49.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["instagram", "facebook", "tiktok", "social media", "social", "photos", "portfolio", "recent work", "feed", "posts", "active on social"]),
      pitchScript: "Since [business name] is active on Instagram — the Social Feed Embed at $49/month pulls your latest posts directly onto your site automatically. One thing to know: you'll need to do a quick one-click Instagram authorization in your portal after launch — takes about 30 seconds. After that your feed updates automatically every time you post. For a visual brand like yours it keeps the site alive without any extra work. Add it?",
      howItWorks: "After launch, click 'Connect Instagram' in your portal (30 seconds). Your latest posts pull onto your site automatically and update every time you post.",
      roiExample: "Visitors who see real recent work convert at 2-3× the rate of visitors who only see generic stock photos.",
      active: true,
    },
    {
      productKey: "competitor_monitoring", name: "Competitor Monitoring", description: "Monthly report tracking competitor rankings, pricing changes, and new pages",
      category: "addon", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["competitor", "competition", "competing", "local market", "other businesses", "beating competitors", "market share", "they rank higher", "losing to"]),
      pitchScript: "Do you know what your competitors are ranking for right now? Competitor Monitoring at $149/month gives you a monthly report — who's outranking you, what pages they added, what keywords they're targeting. Completely automated — shows up in your portal and your inbox every month, nothing you need to do. Most clients say it changed how they think about their positioning. Add it?",
      howItWorks: "Completely automatic — we track up to 5 competitors monthly: their top-ranking pages, keyword positions, new content, and any pricing or offer changes. Delivered as a simple monthly report to your portal and inbox. Nothing required from you after launch.",
      roiExample: "Knowing a competitor dropped their prices before you do lets you respond proactively instead of losing jobs and wondering why.",
      active: true,
    },
    {
      productKey: "event_calendar", name: "Event Calendar", description: "Interactive events calendar with RSVP and automated reminders",
      category: "addon", basePrice: "99.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["event", "events", "classes", "workshops", "upcoming", "weekly", "class schedule", "open mic", "live music", "tasting", "tour", "seminar", "recurring"]),
      pitchScript: "Since [business name] does [events/classes/tastings] — the Event Calendar at $99/month is worth adding. Your events live on your site instead of just Facebook. Better for SEO, better for your brand. One thing to know: you manage your events directly — just add them through your portal whenever you have something coming up. Takes 2 minutes per event. Visitors RSVP directly on your site. Add it?",
      howItWorks: "We create your events page. You add upcoming events through your portal whenever you have something (2 minutes per event). Visitors RSVP directly on your site and get automated reminder texts 24 hours before.",
      roiExample: "Businesses with event calendars see 30-40% higher repeat visit rates — people bookmark the page and come back regularly.",
      active: true,
    },
    {
      productKey: "menu_price_list", name: "Menu & Price List", description: "Styled, easy-to-update menu or service price list with category tabs",
      category: "addon", basePrice: "49.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["menu", "pricing page", "services list", "price list", "rate sheet", "what do you charge", "offerings", "specials", "items", "drinks", "food", "rates"]),
      pitchScript: "For [business name] — a proper Menu & Price List at $49/month is worth it. We generate your initial menu from what you've told me today, and it goes live on launch day. One thing to know: you'll want to review the prices and add any items we missed through your portal — takes about 10 minutes and you can update it anytime after that. A real HTML menu page ranks on Google. A PDF doesn't. Add it?",
      howItWorks: "We generate your menu from your onboarding info and launch it live. After launch you review and adjust prices through your portal (10 minutes). Update it anytime after that.",
      roiExample: "Displaying clear pricing reduces tire-kicker calls by 40% and pre-qualifies leads before they contact you.",
      active: true,
    },
    {
      productKey: "email_marketing_setup", name: "Email Marketing Setup", description: "Email list, welcome sequence, and monthly newsletter templates",
      category: "addon", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["email", "newsletter", "list", "promotions", "stay in touch", "customer list", "mailchimp", "follow up", "repeat customers", "loyalty", "email marketing"]),
      pitchScript: "If you have a customer list — or want to build one — email marketing is the highest ROI channel out there. Email Marketing Setup at $149/month gets you a branded signup form on your site, an automated welcome sequence, and monthly newsletter templates. One thing to know: we set everything up automatically, but you'll want to send your first newsletter yourself each month — we give you a ready-to-go template that takes about 15 minutes to customize and send. $42 back for every $1 spent on average. Worth it?",
      howItWorks: "We create your email list, signup forms, and write your welcome sequence — all automatic. Each month we give you a ready-to-go newsletter template you customize and send in about 15 minutes.",
      roiExample: "Email subscribers convert at 3-5× the rate of cold traffic. A list of 500 people = 15-25 sales per campaign at zero ad spend.",
      active: true,
    },
    {
      productKey: "live_chat", name: "Live Chat", description: "Real-time chat widget with mobile app and business hours auto-away",
      category: "addon", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["chat", "live chat", "message", "instant response", "talk to someone", "quick question", "real person", "contact", "reach you", "get in touch", "messaging"]),
      pitchScript: "Live Chat at $149/month gives you a chat widget on your site connected to your phone as texts. When someone starts a chat, you get a text and can respond from your phone. One thing to know: you'll need to download a free app to manage chats — takes about 2 minutes to set up. Then chat messages just come to you like texts. Live chat increases lead capture by 40% on service sites. One extra client per month pays for it 10x over. Add it?",
      howItWorks: "We install a chat widget on your site. You download a free app to manage conversations (2 minutes). Business hours settings let you set when you're available — offline takes a message automatically.",
      roiExample: "Live chat increases lead capture by 40% on service-based websites. Even one extra job per month pays for it several times over.",
      active: true,
    },
    {
      productKey: "online_store", name: "Online Store", description: "Full e-commerce with Stripe payments, inventory, and order management",
      category: "addon", basePrice: "199.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["sell", "shop", "products", "merchandise", "online store", "e-commerce", "ecommerce", "buy online", "purchase online", "order online", "shipping", "checkout", "inventory"]),
      pitchScript: "If you're looking to sell [products/merch] online — the Online Store at $199/month adds full ecommerce to your site. Stripe payments, inventory tracking, order management. One thing to know: you'll need to add your product photos and descriptions through your portal after launch — it's a simple form, takes about 15 minutes to get your first products live. After that you manage everything from your dashboard. Want to add it?",
      howItWorks: "We build your store and set up Stripe checkout. After launch you add your product photos and descriptions in your portal (about 15 minutes to get started). Payments go directly to your Stripe account.",
      roiExample: "Adding even a simple merch store to a gym or brewery generates $500-2,000/month in passive revenue for most businesses that try it.",
      active: true,
    },
    {
      productKey: "ai_photography", name: "AI Photography", description: "Monthly batch of AI-generated lifestyle photos custom-branded to your business",
      category: "addon", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["photos", "images", "photography", "pictures", "photoshoot", "stock photos", "generic photos", "look professional", "visual", "branding photos", "consistent look"]),
      pitchScript: "Stock photos look fake and everyone knows it. AI Photography at $149/month generates a new batch of custom lifestyle images every month that match your brand and aesthetic. Nothing to do on your end — we generate them automatically and they appear in your portal each month ready to use anywhere. Professional photography costs $1,500-3,000 for a one-time shoot. This gets you fresh content every month for less than that in a year. Add it?",
      howItWorks: "Completely automatic — every month we generate 10 images tailored to your brand colors, style, and industry. Delivered to your portal automatically. Nothing required from you after launch.",
      roiExample: "Professional photography costs $1,500-3,000 for a one-time shoot. AI Photography gets you fresh content every month for less than that in a year.",
      active: true,
    },
    {
      productKey: "priority_support", name: "Priority Support", description: "4-hour response SLA, dedicated support line, same-day changes",
      category: "addon", basePrice: "99.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["fast changes", "quick changes", "urgent", "busy", "response time", "support", "updates quickly", "important", "high volume", "critical", "same day"]),
      pitchScript: "For businesses that move fast — if you need a change made today, not next week, Priority Support gets you a 4-hour response on any update request and a dedicated line you can text. It's $99/month. For anyone running a high-volume operation where a broken form or wrong price could cost real money, this one tends to pay for itself fast.",
      howItWorks: "You get a direct support text line. Any change request — copy, images, forms — handled within 4 hours guaranteed. Evenings and weekends included.",
      roiExample: "If one missed lead from a slow response costs you $500, Priority Support has already paid for itself 5× in a single month.",
      active: true,
    },
    // ── One-time items ──────────────────────────────────────────────────────────
    {
      productKey: "logo_design", name: "Logo Design", description: "Professional logo + 3 variations, all formats for print and web",
      category: "one_time", basePrice: "499.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["logo", "no logo", "old logo", "update logo", "professional look", "brand identity", "branding"]),
      pitchScript: "If [business name] doesn't have a strong logo yet — this is the time to fix it. Logo Design is $499 one-time. We design 3 concepts, you pick your favorite. One thing to know: you'll receive the 3 concepts in your portal within 48-72 hours and pick the one you want — takes about 5 minutes. We then refine it until it's perfect. Delivered in every format you'll ever need. Worth adding?",
      howItWorks: "We deliver 3 logo concepts to your portal within 48-72 hours. You pick your favorite (5 minutes). We refine it through 2 revision rounds, then deliver all source files in every format.",
      roiExample: "A professional logo increases trust signals on your site by 32% — and you'll use it for years on everything from your truck wrap to your business cards.",
      active: true,
    },
    {
      productKey: "brand_style_guide", name: "Brand Style Guide", description: "Color palette, typography, logo rules, and visual standards document",
      category: "one_time", basePrice: "299.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["brand guide", "consistent", "style guide", "colors", "fonts", "typography", "guidelines", "team", "marketing materials", "brand standards"]),
      pitchScript: "For a brand like [business name] — a Brand Style Guide at $299 one-time is worth having. Your official colors, fonts, logo rules, and tone of voice in one document. Nothing you need to do — we generate it from your site's design and it's in your portal ready to download. Anyone working on your brand — designer, printer, social media — uses it. Keeps everything consistent. Worth adding?",
      howItWorks: "Completely automatic — we generate your brand style guide from your site's design. Your official colors, fonts, logo usage rules, and tone of voice in one document. Delivered to your portal ready to download. Nothing required from you.",
      roiExample: "Businesses with a documented brand identity maintain 3-4× better visual consistency across channels, which directly correlates to perceived professionalism and trust.",
      active: true,
    },
    {
      productKey: "extra_pages", name: "Extra Pages (5-pack)", description: "5 additional pages beyond your plan's included page count",
      category: "one_time", basePrice: "149.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["more pages", "extra pages", "another page", "team page", "portfolio", "gallery", "testimonials page", "faq page", "locations page"]),
      pitchScript: "If you need more pages than your plan includes — team bios, a full portfolio, separate location pages, a detailed FAQ — we can add a block of 5 pages for a one-time $149. No monthly fee.",
      howItWorks: "We build 5 additional pages to the same standard as your main site. Includes mobile optimization, SEO setup, and full navigation integration.",
      active: true,
    },
    {
      productKey: "copywriting", name: "Professional Copywriting", description: "Expert-written copy for all site pages by a conversion specialist",
      category: "one_time", basePrice: "199.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["copy", "writing", "text", "words", "content", "don't know what to write", "not a writer", "bad at writing", "help with content", "what to say"]),
      pitchScript: "Most people aren't copywriters — and that's totally fine. Our copywriting add-on means you answer a questionnaire about your business, and our team writes all your page copy. Headlines, service descriptions, calls to action — the words that actually convert visitors into customers. One-time $199 for the full site.",
      howItWorks: "You complete a brand and messaging questionnaire. Our copywriter writes all your page text. You review and approve. We load it into the site.",
      roiExample: "Professional copy typically increases conversion rates by 30-50% vs. self-written content — that's the difference between 5 leads/month and 7-8.",
      active: true,
    },
    {
      productKey: "video_background", name: "Video Background", description: "Cinematic auto-playing video header for a stunning first impression",
      category: "one_time", basePrice: "299.00", discountPercent: 0, isFree: false,
      pitchTriggers: JSON.stringify(["video", "cinematic", "wow factor", "impressive", "standout", "premium feel", "high end", "luxury", "visual impact", "bold", "video header"]),
      pitchScript: "If you want [business name]'s site to stop people in their tracks — a Video Background for $299 one-time makes an immediate impression. We source a cinematic looping clip that fits your brand and embed it as your homepage header. Nothing to do on your end — it's delivered and live before your site launches. Sites with video backgrounds have 2-3x lower bounce rates. One-time $299. Add it?",
      howItWorks: "Completely automatic — we source a professionally shot stock video matching your industry and brand, compress it for fast loading, and set it to autoplay and loop before launch. Falls back to a static image on mobile. Nothing required from you.",
      roiExample: "Sites with video backgrounds have 2-3× lower bounce rates — visitors see something compelling and keep scrolling instead of leaving.",
      active: true,
    },
    {
      productKey: "extra_revision_block", name: "Extra Revision Block", description: "One additional round of site revisions beyond the included 3",
      category: "one_time", basePrice: "149.00", discountPercent: 0, isFree: false,
      howItWorks: "One full round of revisions — provide a consolidated list of changes, we implement everything within 3 business days.",
      active: true,
    },
    {
      productKey: "setup_fee", name: "One-Time Setup Fee", description: "Domain setup, hosting configuration, DNS, and launch checklist",
      category: "one_time", basePrice: "149.00", discountPercent: 0, isFree: false,
      howItWorks: "Covers domain registration or transfer, DNS configuration, hosting setup, SSL certificate installation, and pre-launch QA checklist.",
      active: true,
    },
  ];

  for (const item of seed) {
    await upsertProductCatalogItem(item as InsertProductCatalogItem);
  }

  await db.insert(systemSettings).values({
    settingKey: "product_catalog_v3",
    settingValue: "true",
    description: "Product catalog v3 — 6 packages, 6 free features, 14 paid addons, 6 one-time items with pitch scripts",
  }).onDuplicateKeyUpdate({ set: { settingValue: "true" } });

  console.log("[ProductCatalog] Seeded v3 catalog:", seed.length, "products");
}

/* ═══════════════════════════════════════════════════════
   REGULATORY RULES SEED
   ═══════════════════════════════════════════════════════ */
export async function seedRegulatoryRules(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const flagRows = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, "regulatory_rules_v2")).limit(1);
  if (flagRows[0]) return; // already seeded

  const { regulatoryRules } = await import("../drizzle/schema");

  // Clear any previously seeded rules before re-seeding
  await db.delete(regulatoryRules);

  const rules: Array<{
    industry: string; agency: string; ruleKey: string; ruleDescription: string;
    checkPrompt: string; severity: string; autoFixable: boolean; autoFixAction?: string; appliesTo?: string;
  }> = [

    // ═══════════════════════════════════════════════════════════════════
    // UNIVERSAL — applies to every business website
    // ═══════════════════════════════════════════════════════════════════
    { industry: "all", agency: "FTC", ruleKey: "no_fake_reviews", severity: "critical", autoFixable: false,
      ruleDescription: "No fake or unverifiable testimonials (16 CFR Part 255)",
      checkPrompt: "Check all testimonials and reviews. Flag any with placeholder names (John D., Jane S.), no dates, suspiciously perfect language, or claims that look fabricated. FTC requires testimonials to reflect honest opinions." },
    { industry: "all", agency: "FTC", ruleKey: "accurate_pricing", severity: "warning", autoFixable: false,
      ruleDescription: "All pricing must be accurate, complete, and not misleading",
      checkPrompt: "Check all prices. Flag placeholder prices ($0, $999, $XXX), prices missing for listed services, or language implying hidden fees without disclosure. FTC prohibits deceptive pricing." },
    { industry: "all", agency: "ADA", ruleKey: "accessibility_alt_text", severity: "warning", autoFixable: true, autoFixAction: "generate_alt_text",
      ruleDescription: "All images need descriptive alt text (ADA Title III)",
      checkPrompt: "Check all img tags. Flag empty alt='', generic alt='image' or 'photo', or missing alt attributes. ADA Title III applies to business websites." },
    { industry: "all", agency: "GDPR/CCPA", ruleKey: "cookie_consent", severity: "warning", autoFixable: true, autoFixAction: "inject_cookie_banner",
      ruleDescription: "Cookie consent banner required for tracking cookies",
      checkPrompt: "Check if the site has a cookie consent or privacy notice banner. Flag if absent — required under CCPA for California businesses and GDPR for any business serving EU visitors." },
    { industry: "all", agency: "FTC", ruleKey: "privacy_policy", severity: "critical", autoFixable: true, autoFixAction: "generate_privacy_policy",
      ruleDescription: "Privacy policy required for any data collection",
      checkPrompt: "Check if the site has a privacy policy page or link. Flag if absent or if it contains placeholder text like COMPANY NAME, YOUR EMAIL, or [INSERT]. FTC Section 5 requires disclosure of data practices." },
    { industry: "all", agency: "FTC", ruleKey: "terms_of_service", severity: "warning", autoFixable: true, autoFixAction: "generate_terms",
      ruleDescription: "Terms of service or terms and conditions required",
      checkPrompt: "Check if the site has a terms of service, terms and conditions, or user agreement page. Flag if absent or contains placeholder text." },
    { industry: "all", agency: "CAN-SPAM", ruleKey: "email_signup_disclosure", severity: "warning", autoFixable: true, autoFixAction: "add_email_disclosure",
      ruleDescription: "Email signup forms need disclosure of how email will be used",
      checkPrompt: "Check all email signup or newsletter forms. Flag if they don't include text explaining how email will be used or a link to the privacy policy. CAN-SPAM Act applies." },
    { industry: "all", agency: "FTC", ruleKey: "deceptive_urgency", severity: "warning", autoFixable: false,
      ruleDescription: "No false scarcity or urgency claims",
      checkPrompt: "Check for fake urgency language: 'only 2 left', 'offer expires midnight', 'limited time' with no actual expiry date. Flag unless tied to a specific verifiable promotion." },
    { industry: "all", agency: "COPYRIGHT", ruleKey: "copyright_footer", severity: "warning", autoFixable: true, autoFixAction: "fix_copyright_year",
      ruleDescription: "Copyright notice required in footer with correct year",
      checkPrompt: "Check the footer for a copyright notice with the business name and current year. Flag if absent or if the year is more than 1 year old." },
    { industry: "all", agency: "COPYRIGHT", ruleKey: "stock_photo_attribution", severity: "critical", autoFixable: false,
      ruleDescription: "Stock photos must be properly licensed",
      checkPrompt: "Check all images. Flag any with visible watermarks, filenames containing 'gettyimages', 'shutterstock', 'istock', or obvious stock photo style without attribution or licensing." },
    { industry: "all", agency: "COPYRIGHT", ruleKey: "no_competitor_content", severity: "critical", autoFixable: false,
      ruleDescription: "No copied content from competitor or other sites",
      checkPrompt: "Check all copy for signs of plagiarism: different business name mentioned, descriptions not matching this business, generic boilerplate that looks duplicated from template sites." },
    { industry: "all", agency: "COPYRIGHT", ruleKey: "trademark_misuse", severity: "critical", autoFixable: false,
      ruleDescription: "No unauthorized use of trademarked brand names",
      checkPrompt: "Check for unauthorized trademark use: claiming official partnership without authorization, using competitor brand names to falsely imply affiliation, or misuse of registered trademarks." },
    { industry: "all", agency: "TCPA", ruleKey: "tcpa_sms_consent", severity: "critical", autoFixable: false,
      ruleDescription: "SMS/text marketing requires express written consent (TCPA)",
      checkPrompt: "If the site collects phone numbers for SMS marketing or has a text message opt-in, check for explicit TCPA consent language — must state they agree to receive automated texts, frequency, and how to opt out." },
    { industry: "all", agency: "FTC", ruleKey: "ftc_endorsement_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Sponsored content and paid endorsements must be clearly labeled",
      checkPrompt: "Check if any content appears to be sponsored, paid, or affiliate-based. Flag if there is no 'Sponsored', 'Ad', or '#ad' disclosure. FTC 16 CFR Part 255 requires material connections to be disclosed." },
    { industry: "all", agency: "CCPA", ruleKey: "ccpa_do_not_sell", severity: "warning", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California businesses must offer 'Do Not Sell My Personal Information' option",
      checkPrompt: "If business is in California and collects personal data, check for a 'Do Not Sell My Personal Information' link in the footer. Required under CCPA for businesses meeting threshold criteria." },
    { industry: "all", agency: "FTC", ruleKey: "no_misleading_before_after", severity: "warning", autoFixable: false,
      ruleDescription: "Before/after claims must be typical results, not exceptional outliers",
      checkPrompt: "Check for before/after photos or transformation claims. Flag if there is no disclaimer that results are not typical or that results vary. FTC requires typical results disclosure." },
    { industry: "all", agency: "ADA", ruleKey: "ada_contact_accessibility", severity: "warning", autoFixable: false,
      ruleDescription: "Contact information must be accessible (not just images of phone numbers)",
      checkPrompt: "Check that phone numbers and email addresses are actual text links (tel: and mailto:) rather than images or graphics. Screen readers cannot read phone numbers in images." },
    { industry: "all", agency: "FTC", ruleKey: "no_misleading_free_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Free offers must disclose any conditions or obligations",
      checkPrompt: "Check for 'free' claims. Flag any 'free' offer that requires purchase, subscription, or other obligation without clearly disclosing those conditions near the 'free' claim." },

    // ═══════════════════════════════════════════════════════════════════
    // ALCOHOL — distillery, brewery, winery, bar, spirits
    // ═══════════════════════════════════════════════════════════════════
    { industry: "alcohol", agency: "TTB", ruleKey: "age_gate_required", severity: "critical", autoFixable: true, autoFixAction: "inject_age_gate",
      ruleDescription: "Age verification gate required on website entry (TTB Industry Circular 2016-1)",
      checkPrompt: "Check if the site has an age verification gate or 21+ age confirmation on entry. Flag if absent for any alcohol brand, brewery, winery, distillery, or bar website." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_health_claims", severity: "critical", autoFixable: false,
      ruleDescription: "No health or therapeutic claims about alcohol (27 CFR 5.236)",
      checkPrompt: "Check all content for health claims about alcohol: 'good for your heart', 'healthy choice', 'medicinal', 'reduces stress', 'antioxidants', 'wellness benefits'. These violate TTB regulations." },
    { industry: "alcohol", agency: "TTB", ruleKey: "responsible_drinking", severity: "warning", autoFixable: true, autoFixAction: "add_drink_responsibly",
      ruleDescription: "Responsible drinking message recommended by TTB and required by many states",
      checkPrompt: "Check if the site includes a responsible drinking message such as 'Drink Responsibly', 'Please Drink Responsibly', or 'Enjoy Responsibly'. Flag if absent." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_minor_targeting", severity: "critical", autoFixable: false,
      ruleDescription: "No content primarily appealing to minors (TTB Industry Circular 2016-1)",
      checkPrompt: "Check all content and imagery for anything primarily appealing to minors: cartoon characters, childlike animations, candy/toy themes, school-related content, or language targeting youth." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_false_geographic_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Geographic origin claims must be accurate (27 CFR 5.36, 5.37)",
      checkPrompt: "Check geographic claims: 'bourbon' must be produced in the US, 'champagne' only from Champagne France. Flag any geographic origin claim that appears inaccurate for the product." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_association_violence_sex", severity: "warning", autoFixable: false,
      ruleDescription: "Alcohol ads cannot associate consumption with sexual success, violence, or degrading imagery",
      checkPrompt: "Check imagery and copy for content associating alcohol with sexual success, violence, or degrading portrayals of any group. TTB prohibits such associations in alcohol advertising." },
    { industry: "alcohol", agency: "TTB", ruleKey: "online_order_age_verification", severity: "critical", autoFixable: false,
      ruleDescription: "Online alcohol orders require age verification at purchase and delivery",
      checkPrompt: "If the site sells alcohol online, check if there is age verification at checkout and disclosure that delivery person will verify age. Flag if selling alcohol online without these disclosures." },
    { industry: "alcohol", agency: "DISCUS/STATE", ruleKey: "dtc_shipping_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Direct-to-consumer alcohol shipping varies by state — must disclose restrictions",
      checkPrompt: "If the site ships alcohol direct-to-consumer, check if it discloses which states are eligible for shipping. DTC alcohol shipping is illegal in many states. Flag if no shipping restriction disclosure." },
    { industry: "alcohol", agency: "MLCC", ruleKey: "michigan_price_advertising", severity: "warning", autoFixable: false, appliesTo: "MI",
      ruleDescription: "Michigan MLCC restricts certain price-off and promotional advertising",
      checkPrompt: "If business is in Michigan, check for price promotions on alcohol: 'buy one get one', 'X% off', '$X savings' on specific alcohol products. MLCC restricts many promotional price ads." },
    { industry: "alcohol", agency: "TX-TABC", ruleKey: "tx_tabc_no_happy_hour_statewide", severity: "warning", autoFixable: false, appliesTo: "TX",
      ruleDescription: "Texas TABC prohibits statewide happy hour advertising (though local is allowed)",
      checkPrompt: "If business is in Texas, check if happy hour is advertised in a way that implies a statewide promotion or uses prohibited advertising channels. TABC Sec. 108.311 applies." },
    { industry: "alcohol", agency: "NY-SLA", ruleKey: "ny_sla_no_misleading_ads", severity: "warning", autoFixable: false, appliesTo: "NY",
      ruleDescription: "New York SLA prohibits misleading advertising for licensed premises",
      checkPrompt: "If business is in New York, check for misleading claims about the establishment: false claims about awards, false claims about being the only/best/first in area. NY SLA 107-a applies." },
    { industry: "alcohol", agency: "CA-ABC", ruleKey: "ca_abc_tied_house_prohibition", severity: "warning", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California ABC prohibits manufacturer/retailer tied-house advertising",
      checkPrompt: "If business is in California, check if a manufacturer or wholesaler is advertising a specific retail store or vice versa on the same site without proper disclosure. CA ABC tied-house rules apply." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_misleading_label_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Website product descriptions must match TTB-approved label information",
      checkPrompt: "Check product descriptions for claims that would not appear on a TTB-approved label: unverified age statements, proof/ABV discrepancies, or misleading ingredient claims." },
    { industry: "alcohol", agency: "FL-DBPR", ruleKey: "fl_dbpr_alcohol_license_display", severity: "warning", autoFixable: false, appliesTo: "FL",
      ruleDescription: "Florida DBPR requires licensed alcohol businesses to display license number",
      checkPrompt: "If business is in Florida, check if the alcoholic beverage license number is displayed on the website. DBPR requires this for licensed premises." },
    { industry: "alcohol", agency: "TTB", ruleKey: "no_nutrient_content_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Nutrient content claims on alcohol require TTB approval",
      checkPrompt: "Check for nutrient content claims on alcohol: 'low calorie', 'low carb', 'light', 'reduced calories'. These require specific TTB approval — flag if present without clear factual basis." },

    // ═══════════════════════════════════════════════════════════════════
    // LEGAL — law firms, attorneys, lawyers
    // ═══════════════════════════════════════════════════════════════════
    { industry: "legal", agency: "ABA", ruleKey: "attorney_advertising", severity: "critical", autoFixable: true, autoFixAction: "add_attorney_disclaimer",
      ruleDescription: "Attorney Advertising disclaimer required (ABA Model Rule 7.2)",
      checkPrompt: "Check if this law firm website includes an 'Attorney Advertising' disclaimer. Most state bars require this prominently on all attorney advertising including websites. Flag if absent." },
    { industry: "legal", agency: "ABA", ruleKey: "no_outcome_guarantee", severity: "critical", autoFixable: false,
      ruleDescription: "No guaranteed outcome language (ABA Model Rule 7.1)",
      checkPrompt: "Check all content for guaranteed outcome language: 'we will win your case', 'guaranteed settlement', 'we never lose', '100% success rate', 'money back guarantee'. Flag as ABA 7.1 violations." },
    { industry: "legal", agency: "ABA", ruleKey: "past_results_disclaimer", severity: "critical", autoFixable: true, autoFixAction: "add_results_disclaimer",
      ruleDescription: "Past case results need disclaimer that outcomes vary (ABA Model Rule 7.1)",
      checkPrompt: "Check if case results, settlements, or verdicts are listed. If so, verify there is a disclaimer that past results do not guarantee future outcomes. Flag if case results shown without disclaimer." },
    { industry: "legal", agency: "ABA", ruleKey: "not_legal_advice", severity: "warning", autoFixable: true, autoFixAction: "add_legal_advice_disclaimer",
      ruleDescription: "Legal information content must be disclaimed as not legal advice",
      checkPrompt: "Check if the site provides legal information, articles, or FAQs. If so, verify there is a disclaimer that the content is not legal advice and does not create an attorney-client relationship." },
    { industry: "legal", agency: "STATE_BAR", ruleKey: "attorney_client_form", severity: "critical", autoFixable: true, autoFixAction: "add_attorney_client_disclaimer",
      ruleDescription: "Contact forms must disclaim that submission does not create attorney-client relationship",
      checkPrompt: "Check the contact form. Verify it includes language that submitting the form does not create an attorney-client relationship and information shared is not privileged." },
    { industry: "legal", agency: "ABA", ruleKey: "no_specialization_without_cert", severity: "warning", autoFixable: false,
      ruleDescription: "Cannot claim specialization or certification without recognized credential (ABA Rule 7.4)",
      checkPrompt: "Check if the firm claims to 'specialize' in a practice area. Under ABA Rule 7.4, this requires certification by a state-approved organization. Flag unqualified 'specializing in' or 'specialist in' claims." },
    { industry: "legal", agency: "ABA", ruleKey: "jurisdiction_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Must disclose jurisdiction(s) where attorney is licensed to practice",
      checkPrompt: "Check if the site discloses which state(s) the attorney is licensed in. ABA Model Rule 7.5 requires geographic practice limitations to be disclosed. Flag if no jurisdiction disclosure." },
    { industry: "legal", agency: "CA-STATE-BAR", ruleKey: "ca_state_bar_disclosure", severity: "critical", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California State Bar requires specific attorney advertising disclosures (CA Rules 7.1-7.5)",
      checkPrompt: "If business is in California, check for CA State Bar required disclosures: principal office location, attorney's name, and that the communication is an advertisement. CA RPC 7.2 requirements." },
    { industry: "legal", agency: "NY-RULES", ruleKey: "ny_attorney_name_address", severity: "critical", autoFixable: false, appliesTo: "NY",
      ruleDescription: "New York requires attorney name, firm name, and address in all advertising (NY Rule 7.1)",
      checkPrompt: "If business is in New York, check if every page includes the attorney's name, firm name, and office address. NY Rules of Professional Conduct 7.1(h) requires this in all attorney advertising." },
    { industry: "legal", agency: "TX-STATE-BAR", ruleKey: "tx_bar_rule_7_04", severity: "warning", autoFixable: false, appliesTo: "TX",
      ruleDescription: "Texas disciplinary Rule 7.04 requires specific disclosures in attorney advertising",
      checkPrompt: "If business is in Texas, check for required TX bar disclosures: 'Attorney advertising' labeling, principal office disclosure, and that any testimonials or endorsements are from actual clients if so labeled." },
    { industry: "legal", agency: "FL-BAR", ruleKey: "fl_bar_advertising_rules", severity: "warning", autoFixable: false, appliesTo: "FL",
      ruleDescription: "Florida Bar Rules 4-7.11 through 4-7.22 govern all attorney advertising",
      checkPrompt: "If business is in Florida, check for FL Bar required disclosures: 'Attorney Advertisement' label, prohibition on 'expert' or 'specialist' without board certification, no promises of favorable outcomes." },
    { industry: "legal", agency: "ABA", ruleKey: "referral_fee_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Referral fee arrangements must be disclosed (ABA Rule 7.2(b))",
      checkPrompt: "If the site mentions referral partners, affiliate attorneys, or references case referrals, check if referral fee arrangements are disclosed. ABA 7.2(b) requires disclosure of referral compensation." },
    { industry: "legal", agency: "ABA", ruleKey: "contingency_fee_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Contingency fee advertising must disclose client responsibility for costs if case lost",
      checkPrompt: "If the site advertises 'no fee unless we win' or contingency arrangements, check if it discloses that client may still be responsible for costs (not fees) if case is lost. ABA Rule 7.1 requirement." },
    { industry: "legal", agency: "FTC", ruleKey: "super_lawyer_verification", severity: "warning", autoFixable: false,
      ruleDescription: "Award and ranking claims must be legitimate and not misleading",
      checkPrompt: "Check for claims like 'Super Lawyer', 'Top 100 attorney', 'Best Lawyer' badges. Verify these reference actual recognized programs. Flag if they appear to be self-awarded or from pay-to-play sources." },
    { industry: "legal", agency: "ABA", ruleKey: "no_misleading_firm_name", severity: "warning", autoFixable: false,
      ruleDescription: "Firm name cannot imply governmental affiliation or be misleading (ABA Rule 7.5)",
      checkPrompt: "Check if the firm name implies government affiliation, deceased partners still practice, or contains false statements about the firm. ABA Rule 7.5 prohibits misleading firm names." },
    { industry: "legal", agency: "IL-ARDC", ruleKey: "il_ardc_disclaimer", severity: "critical", autoFixable: false, appliesTo: "IL",
      ruleDescription: "Illinois ARDC requires attorney advertising to include lawyer's Illinois license statement",
      checkPrompt: "If business is in Illinois, check for ARDC-required statement that the attorney is licensed in Illinois and the website is Attorney Advertising. IL Rule 7.2 requirements apply." },
    { industry: "legal", agency: "ABA", ruleKey: "no_comparison_without_factual_basis", severity: "warning", autoFixable: false,
      ruleDescription: "Comparative claims (best, top, #1) must have a factual basis (ABA Rule 7.1)",
      checkPrompt: "Check for comparative claims: 'best attorney', '#1 law firm', 'top rated', 'highest rated'. Flag if these appear to be unsupported self-promotion without citing a legitimate source or rating system." },
    { industry: "legal", agency: "ABA", ruleKey: "no_unjustified_expectations", severity: "warning", autoFixable: false,
      ruleDescription: "Cannot create unjustified expectations about results (ABA Rule 7.1)",
      checkPrompt: "Check all content for language that implies or creates expectations of success beyond what can realistically be promised. Flag language like 'we fight to get you maximum compensation' combined with specific outcome promises." },

    // ═══════════════════════════════════════════════════════════════════
    // MEDICAL / DENTAL — doctors, dentists, clinics, therapists, telehealth
    // ═══════════════════════════════════════════════════════════════════
    { industry: "medical", agency: "FTC", ruleKey: "no_cure_claims", severity: "critical", autoFixable: false,
      ruleDescription: "No guaranteed cure or treatment outcome claims (FTC Act Section 5)",
      checkPrompt: "Check all content for guaranteed cure claims: 'we cure', 'guaranteed recovery', 'eliminates permanently', 'cures diabetes/cancer/etc'. Flag any unqualified medical outcome guarantees." },
    { industry: "medical", agency: "HIPAA", ruleKey: "hipaa_notice", severity: "critical", autoFixable: true, autoFixAction: "add_hipaa_notice",
      ruleDescription: "HIPAA Notice of Privacy Practices required (45 CFR 164.520)",
      checkPrompt: "Check if this healthcare provider's website has a HIPAA Notice of Privacy Practices — a distinct page or link explaining how patient health information is used. Flag if absent." },
    { industry: "medical", agency: "FTC", ruleKey: "testimonial_disclaimer", severity: "critical", autoFixable: true, autoFixAction: "add_results_may_vary",
      ruleDescription: "Patient testimonials require 'results may vary' disclaimer (FTC 16 CFR 255)",
      checkPrompt: "Check all patient testimonials and before/after content. Each must have a 'results may vary' or 'individual results may vary' disclaimer. Flag if testimonials appear without this disclaimer." },
    { industry: "medical", agency: "FDA", ruleKey: "no_fda_unapproved_claims", severity: "critical", autoFixable: false,
      ruleDescription: "No claims about FDA-unapproved treatments or uses",
      checkPrompt: "Check for claims about experimental or off-label treatments presented as proven: stem cell cures, unapproved supplements as treatments, or claims about curing specific diseases without FDA approval." },
    { industry: "medical", agency: "HIPAA", ruleKey: "hipaa_contact_form_notice", severity: "critical", autoFixable: true, autoFixAction: "add_hipaa_notice",
      ruleDescription: "Contact/appointment forms collecting patient info need HIPAA notice",
      checkPrompt: "Check any appointment request or contact forms. If they collect health information or patient details, verify a HIPAA privacy notice or consent acknowledgment is present. Flag if absent." },
    { industry: "medical", agency: "STATE_MEDICAL_BOARD", ruleKey: "medical_license_display", severity: "critical", autoFixable: false,
      ruleDescription: "Physician/provider license number must be displayed (required in most states)",
      checkPrompt: "Check if the medical provider's state license number is displayed on the site. Most state medical boards require license numbers on all advertising. Flag if absent." },
    { industry: "medical", agency: "FTC", ruleKey: "no_before_after_patient_photos", severity: "warning", autoFixable: false,
      ruleDescription: "Before/after patient photos require written consent disclosure",
      checkPrompt: "Check for before/after treatment photos. If present, verify there is disclosure that patient consent was obtained. Flag if before/after photos appear without consent disclosure." },
    { industry: "medical", agency: "STATE", ruleKey: "telehealth_state_licensing", severity: "critical", autoFixable: false,
      ruleDescription: "Telehealth services must disclose which states provider is licensed in",
      checkPrompt: "If the site offers telehealth or online medical services, check if it discloses which states the provider is licensed to practice in. Practicing medicine across state lines without a license is illegal. Flag if absent." },
    { industry: "medical", agency: "FDA", ruleKey: "no_off_label_drug_promotion", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot promote prescription drugs for off-label uses (21 CFR Part 202)",
      checkPrompt: "Check if the site promotes any prescription medications for uses not approved by the FDA. Flag any specific drug promotion that suggests uses beyond FDA-approved indications." },
    { industry: "medical", agency: "FTC", ruleKey: "emergency_services_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Healthcare sites should note to call 911 for emergencies",
      checkPrompt: "Check if the healthcare site mentions that in case of emergency, patients should call 911 or go to the nearest emergency room. Flag if contact/appointment pages lack this basic safety notice." },
    { industry: "medical", agency: "FTC", ruleKey: "dental_insurance_accuracy", severity: "warning", autoFixable: false,
      ruleDescription: "Insurance participation claims must be accurate and current",
      checkPrompt: "Check if the site lists accepted insurance plans. Flag if the list appears outdated, uses placeholder text, or claims to accept insurances without the ability to verify." },
    { industry: "medical", agency: "FTC", ruleKey: "no_online_diagnosis_without_disclaimer", severity: "critical", autoFixable: false,
      ruleDescription: "Online symptom checkers and health tools require diagnosis disclaimer",
      checkPrompt: "Check if the site offers symptom checkers, health assessments, or diagnostic tools. If so, verify there is a disclaimer that results are not a diagnosis and patient should see a doctor. Flag if absent." },
    { industry: "medical", agency: "STATE", ruleKey: "mental_health_teletherapy_license", severity: "critical", autoFixable: false,
      ruleDescription: "Mental health telehealth providers must disclose state licensing",
      checkPrompt: "If the site offers teletherapy, online counseling, or mental health services remotely, check if it discloses which states the therapist is licensed in. Practicing without a license in patient's state is illegal." },
    { industry: "medical", agency: "DEA", ruleKey: "no_controlled_substance_promotion", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise prescription-only or controlled substances for online purchase without prescription",
      checkPrompt: "Check if the site promotes or appears to sell controlled substances or prescription medications that would require a DEA-licensed prescriber. Flag any such promotion as a DEA violation." },
    { industry: "medical", agency: "FTC", ruleKey: "no_guaranteed_weight_loss", severity: "critical", autoFixable: false,
      ruleDescription: "Weight loss claims must be substantiated; no guaranteed results (FTC guides)",
      checkPrompt: "Check for weight loss service or product claims: 'lose X lbs in Y weeks guaranteed', 'guaranteed results', 'permanent weight loss'. FTC requires substantiated claims and typical results disclosure." },

    // ═══════════════════════════════════════════════════════════════════
    // REAL ESTATE — agents, brokers, property managers
    // ═══════════════════════════════════════════════════════════════════
    { industry: "real_estate", agency: "HUD", ruleKey: "fair_housing", severity: "critical", autoFixable: false,
      ruleDescription: "Fair Housing Act compliance — no discriminatory language (42 USC 3604)",
      checkPrompt: "Check all content for Fair Housing Act violations: language discriminating based on race, color, national origin, religion, sex, familial status, or disability. Flag exclusionary language like 'ideal for couples', 'no children', 'Christian community'." },
    { industry: "real_estate", agency: "NAR", ruleKey: "equal_housing_logo", severity: "critical", autoFixable: true, autoFixAction: "add_equal_housing",
      ruleDescription: "Equal Housing Opportunity logo or statement required (HUD 24 CFR 110)",
      checkPrompt: "Check if the site displays the Equal Housing Opportunity logo, the equal housing slogan, or an accessibility statement. Flag if absent from any real estate professional's website." },
    { industry: "real_estate", agency: "STATE_RE_COMMISSION", ruleKey: "license_number_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "Real estate license number must be prominently displayed",
      checkPrompt: "Check if the real estate agent's or broker's state license number is displayed on the site. Most state real estate commissions require this on all advertising. Flag if absent." },
    { industry: "real_estate", agency: "NAR/MLS", ruleKey: "idx_mls_attribution", severity: "warning", autoFixable: false,
      ruleDescription: "MLS/IDX listing data requires proper attribution (MLS Rules)",
      checkPrompt: "If the site displays MLS or IDX property listings, check for required attribution: MLS logo, courtesy line, data source credit. MLS rules require proper attribution for all listing data displays." },
    { industry: "real_estate", agency: "CFPB", ruleKey: "mortgage_calc_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Mortgage calculators require 'not a commitment to lend' disclaimer (RESPA)",
      checkPrompt: "If the site has a mortgage calculator or payment estimator, check for disclaimer that results are estimates only and do not constitute a commitment to lend. CFPB requires this disclosure." },
    { industry: "real_estate", agency: "RESPA/CFPB", ruleKey: "respa_referral_disclosure", severity: "critical", autoFixable: false,
      ruleDescription: "Business referral arrangements must be disclosed (RESPA Section 8)",
      checkPrompt: "Check if the site refers clients to affiliated services (title, escrow, mortgage, insurance). If so, verify affiliated business arrangement disclosures are present. RESPA Section 8 prohibits undisclosed kickbacks." },
    { industry: "real_estate", agency: "HUD", ruleKey: "no_steering_language", severity: "critical", autoFixable: false,
      ruleDescription: "No steering language based on protected characteristics (Fair Housing Act)",
      checkPrompt: "Check for any language that could constitute steering — directing buyers/renters toward or away from neighborhoods based on race, religion, national origin, or other protected characteristics." },
    { industry: "real_estate", agency: "STATE_RE_COMMISSION", ruleKey: "broker_supervision_info", severity: "warning", autoFixable: false,
      ruleDescription: "Supervising broker information required on agent advertising in most states",
      checkPrompt: "Check if the real estate agent's site displays the supervising broker's name and license number. Most state commissions require agents' advertising to disclose their supervising broker." },
    { industry: "real_estate", agency: "CA-DRE", ruleKey: "ca_dre_license_format", severity: "critical", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California DRE requires specific license number format on all advertising",
      checkPrompt: "If business is in California, check if the DRE license number is displayed with the prefix 'DRE' or 'CalDRE#' and the correct format. CA DRE requires this format on all real estate advertising." },
    { industry: "real_estate", agency: "TX-TREC", ruleKey: "tx_trec_iabs_form", severity: "critical", autoFixable: false, appliesTo: "TX",
      ruleDescription: "Texas requires TREC Information About Brokerage Services form to be available",
      checkPrompt: "If business is in Texas, check if the site provides or links to the TREC 'Information About Brokerage Services' (IABS) form. TX TREC requires this disclosure on all real estate agent websites." },
    { industry: "real_estate", agency: "NY-DOS", ruleKey: "ny_fair_housing_disclosure", severity: "critical", autoFixable: false, appliesTo: "NY",
      ruleDescription: "New York requires specific Fair Housing Notice disclosure on all advertising",
      checkPrompt: "If business is in New York, check for the NY Division of Human Rights 'Fair Housing Notice' or equivalent disclosure. NY Real Property Law Section 443-a requires this on all real estate advertising." },
    { industry: "real_estate", agency: "FTC", ruleKey: "property_listing_accuracy", severity: "warning", autoFixable: false,
      ruleDescription: "Property listings must be accurate and not misleading (FTC Act Section 5)",
      checkPrompt: "Check property listings for obviously outdated, inaccurate, or misleading information: sold properties still listed as available, wrong square footage, features listed that aren't present. Flag suspicious discrepancies." },

    // ═══════════════════════════════════════════════════════════════════
    // FINANCIAL — investment advisors, brokers, financial planners
    // ═══════════════════════════════════════════════════════════════════
    { industry: "financial", agency: "SEC", ruleKey: "no_guaranteed_returns", severity: "critical", autoFixable: false,
      ruleDescription: "No guaranteed investment return claims (Securities Act Section 17(a))",
      checkPrompt: "Check for guaranteed return claims: 'guaranteed X% return', 'risk-free investment', 'guaranteed profit', 'can't lose money'. Flag any such claims as SEC violations." },
    { industry: "financial", agency: "FINRA", ruleKey: "past_performance_disclaimer", severity: "critical", autoFixable: true, autoFixAction: "add_past_performance_disclaimer",
      ruleDescription: "Past performance disclaimer required on all investment performance data (FINRA Rule 2210)",
      checkPrompt: "Check if any investment performance data, returns, or track record is shown. Verify 'past performance does not guarantee future results' disclaimer is present. Flag if performance data shown without disclaimer." },
    { industry: "financial", agency: "CFPB", ruleKey: "mortgage_calc_not_commitment", severity: "critical", autoFixable: false,
      ruleDescription: "Mortgage/loan calculator results must be disclaimed as not a commitment to lend (TILA/CFPB)",
      checkPrompt: "If the site has a mortgage, loan, or payment calculator, verify there is a disclaimer that these are estimates only and do not constitute a credit decision or commitment to lend. Flag if absent." },
    { industry: "financial", agency: "NMLS/CFPB", ruleKey: "nmls_license_number", severity: "critical", autoFixable: false,
      ruleDescription: "NMLS license number required for mortgage lenders, brokers, and servicers",
      checkPrompt: "Check if the site is for a mortgage lender, broker, or loan originator. If so, verify the NMLS license number is displayed (typically formatted as 'NMLS# XXXXXXX'). Flag if absent." },
    { industry: "financial", agency: "SEC", ruleKey: "sec_registration_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "SEC registration status must be accurately represented",
      checkPrompt: "Check if the site claims to be 'SEC registered' or 'registered investment advisor'. Verify the claim is accurate and includes the statement that registration does not imply a certain level of skill or training." },
    { industry: "financial", agency: "FINRA", ruleKey: "crd_number_displayed", severity: "warning", autoFixable: false,
      ruleDescription: "FINRA CRD number required for broker-dealer representatives",
      checkPrompt: "If the site is for a broker-dealer or registered representative, check if the FINRA CRD number is displayed. FINRA Rule 2210 requires this on all member advertising." },
    { industry: "financial", agency: "SEC/CFTC", ruleKey: "no_crypto_guaranteed_returns", severity: "critical", autoFixable: false,
      ruleDescription: "No guaranteed return claims for cryptocurrency investments",
      checkPrompt: "Check for guaranteed return claims on cryptocurrency, digital assets, or DeFi products: 'guaranteed APY', 'risk-free crypto returns', 'guaranteed staking rewards'. Flag as SEC/CFTC violations." },
    { industry: "financial", agency: "SEC", ruleKey: "crypto_risk_disclosure", severity: "critical", autoFixable: false,
      ruleDescription: "Cryptocurrency investments require prominent risk disclosure",
      checkPrompt: "If the site promotes cryptocurrency investments or trading, check for risk disclosures: volatility warnings, potential for total loss, regulatory uncertainty. Flag if crypto investment content lacks risk disclosure." },
    { industry: "financial", agency: "DOL/SEC", ruleKey: "fiduciary_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Must disclose fiduciary vs non-fiduciary status (SEC Reg BI, DOL Fiduciary Rule)",
      checkPrompt: "Check if the site is for a financial advisor or broker. Verify disclosure of whether they act as a fiduciary (act in client's best interest) or as a broker (suitability standard). Flag if no capacity disclosure." },
    { industry: "financial", agency: "SEC", ruleKey: "no_misleading_fee_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Advisory fees and compensation must be clearly disclosed (SEC Advisers Act)",
      checkPrompt: "Check if financial advisory fees are disclosed or if the advisor receives commissions. SEC requires investment advisors to disclose all compensation arrangements. Flag if fees/compensation are absent or vague." },
    { industry: "financial", agency: "STATE_SECURITIES", ruleKey: "state_securities_registration", severity: "critical", autoFixable: false,
      ruleDescription: "State securities registration or exemption must be disclosed",
      checkPrompt: "Check if the site offers investment products or services. Verify state securities registration or applicable exemption is disclosed. Most states require registration or exemption for securities activities." },
    { industry: "financial", agency: "CFPB", ruleKey: "payday_lending_disclosures", severity: "critical", autoFixable: false,
      ruleDescription: "Payday and short-term lenders must display APR and loan terms prominently (TILA)",
      checkPrompt: "If the site offers payday loans, short-term lending, or consumer credit, check if APR, loan terms, fees, and total cost of credit are prominently displayed. TILA requires clear credit disclosures." },

    // ═══════════════════════════════════════════════════════════════════
    // INSURANCE — insurance agents, brokers, carriers
    // ═══════════════════════════════════════════════════════════════════
    { industry: "insurance", agency: "STATE_DOI", ruleKey: "insurance_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "Insurance agent/broker license number required on all advertising",
      checkPrompt: "Check if the insurance agent's or broker's state license number is displayed. All state departments of insurance require license numbers on agent advertising. Flag if absent." },
    { industry: "insurance", agency: "FTC", ruleKey: "no_misleading_coverage_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Coverage claims must be accurate and not misleading",
      checkPrompt: "Check coverage claims: 'covers everything', 'complete protection', 'we pay all claims'. Flag overly broad coverage promises that contradict typical insurance policy exclusions." },
    { industry: "insurance", agency: "STATE_DOI", ruleKey: "no_guaranteed_approval", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise guaranteed insurance approval — underwriting applies",
      checkPrompt: "Check for 'guaranteed approval', 'no medical exam required for all', 'everyone qualifies'. Flag claims that suggest insurance approval regardless of underwriting criteria." },
    { industry: "insurance", agency: "GLBA", ruleKey: "glba_privacy_notice", severity: "critical", autoFixable: false,
      ruleDescription: "Gramm-Leach-Bliley Act requires financial privacy notice for insurance businesses",
      checkPrompt: "Check if the insurance business has a Gramm-Leach-Bliley financial privacy notice explaining how customer non-public personal information is shared. Flag if absent." },
    { industry: "insurance", agency: "STATE_DOI", ruleKey: "policy_terms_accessible", severity: "warning", autoFixable: false,
      ruleDescription: "Insurance policy terms and conditions should be accessible before purchase",
      checkPrompt: "Check if the site provides access to policy terms, conditions, or specimen policies before purchase. State DOI regulations typically require this. Flag if insurance products are advertised without accessible policy terms." },
    { industry: "insurance", agency: "FTC", ruleKey: "no_bait_and_switch_premiums", severity: "critical", autoFixable: false,
      ruleDescription: "Advertised premiums must reflect actual pricing, not bait-and-switch rates",
      checkPrompt: "Check if specific premium prices are advertised. Flag if the site advertises extremely low premiums without clear disclosure that rates are estimates based on specific criteria and may vary significantly." },
    { industry: "insurance", agency: "STATE_DOI", ruleKey: "complaint_process_disclosure", severity: "info", autoFixable: false,
      ruleDescription: "Insurance companies must inform consumers of their right to file complaints",
      checkPrompt: "Check if the insurance site discloses the state insurance department complaint process or contact information. Many state DOIs require this disclosure on agent and carrier websites." },
    { industry: "insurance", agency: "CMS", ruleKey: "medicare_supplement_compliance", severity: "critical", autoFixable: false,
      ruleDescription: "Medicare supplement advertising must comply with CMS guidelines (42 CFR 422.2260)",
      checkPrompt: "If the site advertises Medicare supplement, Medicare Advantage, or Part D plans, check for required CMS disclosures: 'Not affiliated with or endorsed by the U.S. Government or the federal Medicare program' if applicable." },

    // ═══════════════════════════════════════════════════════════════════
    // FOOD / RESTAURANT — restaurants, cafes, food trucks, catering
    // ═══════════════════════════════════════════════════════════════════
    { industry: "food", agency: "FDA", ruleKey: "allergen_disclosure", severity: "warning", autoFixable: true, autoFixAction: "add_allergen_disclaimer",
      ruleDescription: "Major food allergens must be disclosed on menus (FALCPA/FASTER Act)",
      checkPrompt: "Check the menu page. If menu items are listed, verify common allergens are disclosed (peanuts, tree nuts, milk, eggs, fish, shellfish, wheat, soy, sesame) or a general allergen disclaimer is present." },
    { industry: "food", agency: "FDA", ruleKey: "no_misleading_food_health_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Food health claims must meet FDA nutrient content and health claim definitions (21 CFR 101)",
      checkPrompt: "Check for unsubstantiated food health claims: 'superfood', 'detox', 'cleanse', 'cures', 'prevents disease', 'boosts immunity'. Flag claims that don't meet FDA health claim standards." },
    { industry: "food", agency: "FDA", ruleKey: "calorie_disclosure_chains", severity: "warning", autoFixable: false,
      ruleDescription: "Restaurants with 20+ locations must post calories on menus (FDA menu labeling rule)",
      checkPrompt: "If this is a chain restaurant with 20+ locations and menus are displayed online, check if calories are posted for standard menu items. FDA menu labeling rule requires this for chains." },
    { industry: "food", agency: "CA-OEHHA", ruleKey: "prop_65_warning", severity: "warning", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California Prop 65 warning required for restaurants with certain exposures (CA Health & Safety Code 25249.6)",
      checkPrompt: "If business is in California, check if a Prop 65 warning is posted for known carcinogens or reproductive toxins (acrylamide in fried foods, alcohol). California restaurants typically need this warning." },
    { industry: "food", agency: "USDA", ruleKey: "no_misleading_organic_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Organic claims require USDA certification (7 CFR 205)",
      checkPrompt: "Check for organic claims: 'organic ingredients', '100% organic', 'certified organic'. Verify these are backed by USDA organic certification. Flag unverified organic claims as potentially misleading." },
    { industry: "food", agency: "FDA", ruleKey: "no_false_natural_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Natural claims on food must be substantiated; FDA scrutinizes this term",
      checkPrompt: "Check for 'natural', 'all-natural', '100% natural' claims on food items. Flag if these claims appear on foods containing artificial flavors, synthetic additives, or highly processed ingredients." },
    { industry: "food", agency: "USDA/CBP", ruleKey: "country_of_origin_seafood_meat", severity: "warning", autoFixable: false,
      ruleDescription: "Country of origin labeling required for seafood and meat at retail (COOL Act)",
      checkPrompt: "If the site sells seafood or meat products online, check if country of origin is disclosed. USDA Country of Origin Labeling (COOL) requires this for covered commodities at retail." },
    { industry: "food", agency: "FDA", ruleKey: "gluten_free_standard", severity: "warning", autoFixable: false,
      ruleDescription: "Gluten-free claims must meet FDA standard of less than 20 ppm gluten (21 CFR 101.91)",
      checkPrompt: "Check for 'gluten-free' claims on menu items or food products. Flag if the claim appears without any indication of cross-contamination precautions or if the food is made in a shared facility." },
    { industry: "food", agency: "FDA", ruleKey: "no_non_gmo_without_basis", severity: "info", autoFixable: false,
      ruleDescription: "Non-GMO claims require substantiation; can be misleading if unsupported",
      checkPrompt: "Check for 'Non-GMO', 'GMO-free' claims. Flag if claims appear for products that don't have GMO counterparts (making the claim meaningless) or if certification is not mentioned." },
    { industry: "food", agency: "LOCAL_HEALTH", ruleKey: "health_permit_reference", severity: "info", autoFixable: false,
      ruleDescription: "Food service health permit should be referenced or available upon request",
      checkPrompt: "Check if the restaurant or food business mentions its health permit or food service license. While not universally required on websites, mentioning it builds consumer trust and is required in some jurisdictions." },
    { industry: "food", agency: "FDA", ruleKey: "no_misleading_fresh_claim", severity: "warning", autoFixable: false,
      ruleDescription: "Fresh claims on food must meet FDA definition (not frozen, not heat-processed)",
      checkPrompt: "Check for 'fresh' claims on food items or ingredients. Flag if 'fresh' is used for foods that are frozen, canned, or heat-processed, which would violate FDA's definition of 'fresh' under 21 CFR 101.95." },
    { industry: "food", agency: "FTC", ruleKey: "no_misleading_farm_to_table", severity: "info", autoFixable: false,
      ruleDescription: "Farm-to-table and local sourcing claims must be substantiated",
      checkPrompt: "Check for 'farm-to-table', 'locally sourced', 'direct from farm' claims. Flag if these appear to be marketing language without any substantiation — FTC can cite these as deceptive if unsubstantiated." },

    // ═══════════════════════════════════════════════════════════════════
    // CONTRACTOR — general contractors, plumbers, electricians, roofers, HVAC
    // ═══════════════════════════════════════════════════════════════════
    { industry: "contractor", agency: "STATE_CONTRACTOR_BOARD", ruleKey: "contractor_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "Contractor license number required on all advertising in most states",
      checkPrompt: "Check if the contractor's state license number is displayed on the site. Most states require this prominently on all contractor advertising. Flag if absent." },
    { industry: "contractor", agency: "FTC", ruleKey: "no_misleading_warranty", severity: "warning", autoFixable: false,
      ruleDescription: "Warranty claims must include specific terms and conditions (Magnuson-Moss Warranty Act)",
      checkPrompt: "Check warranty claims: 'lifetime warranty', 'guaranteed forever', '100% satisfaction guaranteed'. Flag any that don't include specific terms or reference to where full warranty terms can be found." },
    { industry: "contractor", agency: "FTC", ruleKey: "ftc_cooling_off_rule", severity: "warning", autoFixable: false,
      ruleDescription: "Home solicitation contracts over $25 require 3-day cancellation right (FTC 16 CFR 429)",
      checkPrompt: "If the contractor solicits business at customer's home, check if the site or contract mentions the FTC Cooling-Off Rule: customers have 3 business days to cancel contracts signed at their home." },
    { industry: "contractor", agency: "STATE", ruleKey: "insurance_bonding_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Bonded and insured status should be disclosed; many states require it",
      checkPrompt: "Check if the contractor discloses whether they are bonded and insured (liability insurance, workers' comp). Many states require this disclosure on contractor advertising. Flag if absent." },
    { industry: "contractor", agency: "CA-CSLB", ruleKey: "ca_cslb_license_display", severity: "critical", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California CSLB license number required on all contractor advertising (CA B&P Code 7030.5)",
      checkPrompt: "If business is in California, check if the CSLB license number is displayed in the format 'CSLB License #XXXXXXX'. California Business & Professions Code 7030.5 requires this on all advertising." },
    { industry: "contractor", agency: "FL-DBPR", ruleKey: "fl_contractor_license_display", severity: "critical", autoFixable: false, appliesTo: "FL",
      ruleDescription: "Florida DBPR requires contractor license number on all advertising",
      checkPrompt: "If business is in Florida, check if the state contractor license number (CGC, CCC, CRC, etc.) is displayed on the website. FL Statute 489.119 requires this on all contractor advertising." },
    { industry: "contractor", agency: "TX-TDLR", ruleKey: "tx_contractor_registration", severity: "warning", autoFixable: false, appliesTo: "TX",
      ruleDescription: "Texas TDLR registration required for certain trades and must be displayed",
      checkPrompt: "If business is in Texas, check if the TDLR license/registration number is displayed for applicable trades (electricians, HVAC, plumbers). TX Gov Code Chapter 1302 and related statutes require this." },
    { industry: "contractor", agency: "EPA", ruleKey: "epa_lead_renovation_rule", severity: "warning", autoFixable: false,
      ruleDescription: "Lead-safe renovation firms must disclose EPA RRP certification (40 CFR 745)",
      checkPrompt: "If the contractor does renovation, repair, or painting on pre-1978 homes, check if they disclose EPA Lead Renovation, Repair and Painting (RRP) Rule certification. Flag if absent for relevant services." },
    { industry: "contractor", agency: "FTC", ruleKey: "no_false_manufacturer_preferred", severity: "warning", autoFixable: false,
      ruleDescription: "Cannot claim to be manufacturer preferred or authorized without verified relationship",
      checkPrompt: "Check for 'manufacturer preferred', 'authorized dealer', 'factory certified' claims. Flag if these appear without citation of which manufacturer and without verifiable proof of the relationship." },
    { industry: "contractor", agency: "LOCAL", ruleKey: "permit_pull_notice", severity: "info", autoFixable: false,
      ruleDescription: "Should disclose that required permits will be pulled for work",
      checkPrompt: "Check if the contractor mentions pulling required building permits for projects. Not always legally required on websites, but absence of permit discussion can indicate unlicensed work practices." },
    { industry: "contractor", agency: "STATE", ruleKey: "workers_comp_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Workers' compensation coverage should be disclosed; required in many states",
      checkPrompt: "Check if the contractor discloses workers' compensation coverage for employees. Many states require this disclosure in advertising. Flag if absent for contractors with employees." },
    { industry: "contractor", agency: "FTC/EPA", ruleKey: "energy_efficiency_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Energy Star and efficiency claims must be accurate and based on certified products",
      checkPrompt: "Check for energy efficiency claims: 'Energy Star certified', '50% more efficient', 'lowest energy bills'. Flag claims that appear to use EPA Energy Star branding without certification or use unsupported efficiency percentages." },

    // ═══════════════════════════════════════════════════════════════════
    // CANNABIS — dispensaries, cannabis brands, marijuana businesses
    // ═══════════════════════════════════════════════════════════════════
    { industry: "cannabis", agency: "STATE_CANNABIS", ruleKey: "cannabis_age_gate", severity: "critical", autoFixable: true, autoFixAction: "inject_age_gate",
      ruleDescription: "Age verification gate (21+) required on all cannabis business websites",
      checkPrompt: "Check if the site has a 21+ age verification gate on entry. Flag if absent — every state with legal cannabis requires age gates on cannabis business websites." },
    { industry: "cannabis", agency: "STATE_CANNABIS", ruleKey: "no_youth_appeal_cannabis", severity: "critical", autoFixable: false,
      ruleDescription: "Cannabis advertising cannot be designed to appeal to minors",
      checkPrompt: "Check all content and imagery for anything appealing to minors: cartoon characters, bright candy-like colors, themes popular with children, mascots that appeal to youth, childlike fonts or language." },
    { industry: "cannabis", agency: "STATE_CANNABIS", ruleKey: "no_health_cure_claims_cannabis", severity: "critical", autoFixable: false,
      ruleDescription: "Cannabis sites cannot make health, cure, or therapeutic claims for cannabis",
      checkPrompt: "Check for health or therapeutic claims about cannabis: 'cures anxiety', 'treats cancer', 'reduces inflammation', 'heals', 'medical benefits'. Most state regulations prohibit health claims in cannabis advertising." },
    { industry: "cannabis", agency: "ATF/STATE", ruleKey: "no_cross_state_cannabis_commerce", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise or facilitate interstate cannabis commerce — federally illegal",
      checkPrompt: "Check if the site implies or advertises shipping cannabis across state lines or selling in states without a license. Interstate cannabis commerce is federally illegal under the Controlled Substances Act. Flag any such implication." },
    { industry: "cannabis", agency: "ATF", ruleKey: "no_federal_legality_implication", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot imply that cannabis business is federally legal",
      checkPrompt: "Check if the site implies federal legality of cannabis: 'federally legal cannabis', 'legal nationwide', or other language suggesting federal approval. Cannabis remains a Schedule I substance federally. Flag such claims." },
    { industry: "cannabis", agency: "STATE_CANNABIS", ruleKey: "licensed_dispensary_disclosure", severity: "critical", autoFixable: false,
      ruleDescription: "Cannabis license number must be prominently displayed",
      checkPrompt: "Check if the cannabis license number (dispensary, cultivator, processor, etc.) is displayed on the website. All state cannabis regulations require license numbers on advertising. Flag if absent." },
    { industry: "cannabis", agency: "CA-DCC", ruleKey: "ca_dcc_advertising_rules", severity: "critical", autoFixable: false, appliesTo: "CA",
      ruleDescription: "California DCC requires specific disclosures and prohibits certain cannabis advertising (CA BPC 26151)",
      checkPrompt: "If business is in California, check for required CA DCC disclosures: license number, health and safety warnings, age gate. Also check for prohibited content: no cartoon/mascot appeal to youth, no false health claims." },
    { industry: "cannabis", agency: "CO-MED", ruleKey: "co_med_advertising_rules", severity: "critical", autoFixable: false, appliesTo: "CO",
      ruleDescription: "Colorado MED requires cannabis advertising to only reach 21+ audiences",
      checkPrompt: "If business is in Colorado, check for CO MED compliance: license number displayed, no health claims, age verification, no placement where significant portion of audience is under 21. CO Rev Stat 44-10-203 applies." },
    { industry: "cannabis", agency: "MI-MRA", ruleKey: "mi_mra_advertising_rules", severity: "critical", autoFixable: false, appliesTo: "MI",
      ruleDescription: "Michigan MRA prohibits certain cannabis advertising practices (MRTMA Rules)",
      checkPrompt: "If business is in Michigan, check for MRA compliance: license number, no health claims, no appeal to minors, age verification. Michigan MRTMA rules prohibit false or misleading cannabis advertising." },
    { industry: "cannabis", agency: "OR-OLCC", ruleKey: "or_olcc_cannabis_advertising", severity: "warning", autoFixable: false, appliesTo: "OR",
      ruleDescription: "Oregon OLCC requires specific disclosures in cannabis advertising (OAR 845-025-7500)",
      checkPrompt: "If business is in Oregon, check for OLCC required language: 'Oregon Licensed' disclosure, prohibited health claims, no appeal to minors, required health warning for THC products." },
    { industry: "cannabis", agency: "WA-LCB", ruleKey: "wa_lcb_cannabis_advertising", severity: "critical", autoFixable: false, appliesTo: "WA",
      ruleDescription: "Washington LCB prohibits false cannabis advertising and requires warnings (WAC 314-55-155)",
      checkPrompt: "If business is in Washington, check for LCB compliance: license number, required health warnings, no health cure claims, no appeal to persons under 21. WAC 314-55-155 governs cannabis advertising." },
    { industry: "cannabis", agency: "STATE_CANNABIS", ruleKey: "thc_content_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "THC content statements must be accurate and include required warnings",
      checkPrompt: "If THC percentages or potency information is shown, check for required warnings about effects and impairment. Flag if potency information appears without safety context or required state warnings." },

    // ═══════════════════════════════════════════════════════════════════
    // SUPPLEMENTS / NUTRACEUTICALS — vitamins, dietary supplements, CBD
    // ═══════════════════════════════════════════════════════════════════
    { industry: "supplements", agency: "FDA", ruleKey: "fda_not_evaluated_disclaimer", severity: "critical", autoFixable: false,
      ruleDescription: "Structure/function claims require FDA disclaimer (21 CFR 101.93)",
      checkPrompt: "Check all product claims. Any structure/function claim ('supports immune health', 'promotes energy') must include the disclaimer: 'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.' Flag if absent." },
    { industry: "supplements", agency: "FDA", ruleKey: "no_disease_cure_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot claim supplement treats, cures, or prevents disease (21 CFR 101.93)",
      checkPrompt: "Check all product claims for disease claims: 'treats diabetes', 'prevents cancer', 'cures arthritis', 'reduces risk of heart disease'. These disease claims are not allowed for dietary supplements without FDA approval as drugs." },
    { industry: "supplements", agency: "FTC", ruleKey: "ftc_supplement_claim_substantiation", severity: "critical", autoFixable: false,
      ruleDescription: "All health claims for supplements must be substantiated by competent scientific evidence (FTC)",
      checkPrompt: "Check health claims for supplements. Flag claims that appear to lack scientific backing: 'clinically proven to...', 'scientifically validated', vague efficiency percentages. FTC requires competent and reliable scientific evidence." },
    { industry: "supplements", agency: "DEA", ruleKey: "no_anabolic_steroid_promotion", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise or sell anabolic steroids as supplements (Anabolic Steroid Control Act)",
      checkPrompt: "Check for any products described as anabolic steroids, steroid-like substances, or prohormones. These are Schedule III controlled substances. Flag any supplement described with anabolic/steroid language." },
    { industry: "supplements", agency: "FDA", ruleKey: "supplement_allergen_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Dietary supplement labels must disclose allergens (FALCPA)",
      checkPrompt: "Check supplement product pages for allergen disclosure: soy, wheat, milk, eggs, fish, shellfish, tree nuts, peanuts, sesame. Flag if products contain these allergens without disclosure." },
    { industry: "supplements", agency: "FTC", ruleKey: "money_back_guarantee_terms", severity: "warning", autoFixable: false,
      ruleDescription: "Money-back guarantees must clearly state all conditions and limitations (FTC Section 5)",
      checkPrompt: "Check money-back guarantee claims. Flag if guarantee terms are vague: 'full money back', '100% satisfaction guaranteed' without specifying timeframe, return process, or conditions." },
    { industry: "supplements", agency: "FTC", ruleKey: "third_party_testing_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Third-party testing claims must be verifiable and name the testing organization",
      checkPrompt: "Check for 'third-party tested', 'independently verified', 'lab tested' claims. Flag if the testing lab is not identified or if claims appear unverifiable. FTC requires truthful and verifiable substantiation claims." },
    { industry: "supplements", agency: "FDA", ruleKey: "supplement_ingredient_accuracy", severity: "critical", autoFixable: false,
      ruleDescription: "Ingredient lists must be accurate and match product contents (21 CFR 111)",
      checkPrompt: "Check if supplement ingredient lists appear accurate, complete, and free from obvious placeholder text. Flag if ingredients listed seem implausible for the product type or if amounts are listed without appropriate units." },

    // ═══════════════════════════════════════════════════════════════════
    // CHILDCARE / EDUCATION — daycares, preschools, tutoring, camps
    // ═══════════════════════════════════════════════════════════════════
    { industry: "childcare", agency: "COPPA", ruleKey: "coppa_no_child_data_collection", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot collect personal data from children under 13 without parental consent (COPPA)",
      checkPrompt: "Check if the site collects any personal information from users without age verification. COPPA requires verifiable parental consent before collecting data from children under 13. Flag if forms lack age verification or parental consent mechanism." },
    { industry: "childcare", agency: "STATE", ruleKey: "childcare_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "State childcare license number required on advertising in most states",
      checkPrompt: "Check if the childcare facility's state license number is displayed. Most state childcare licensing agencies require the license number on all advertising. Flag if absent." },
    { industry: "childcare", agency: "FTC", ruleKey: "no_guaranteed_child_outcomes", severity: "warning", autoFixable: false,
      ruleDescription: "Cannot guarantee specific educational or developmental outcomes for children",
      checkPrompt: "Check for guaranteed outcome claims: 'your child will read by age 4', 'guaranteed college acceptance', 'proven to raise IQ'. Flag claims that guarantee specific educational outcomes without proper substantiation." },
    { industry: "childcare", agency: "FERPA", ruleKey: "ferpa_student_privacy", severity: "warning", autoFixable: false,
      ruleDescription: "Educational records are protected under FERPA — cannot share without consent",
      checkPrompt: "If the site is for a school or educational institution, check for FERPA privacy notice. Flag if student data collection is mentioned without FERPA-compliant privacy disclosure." },
    { industry: "childcare", agency: "STATE", ruleKey: "staff_background_check_disclosure", severity: "info", autoFixable: false,
      ruleDescription: "Childcare facilities should disclose staff background check policies",
      checkPrompt: "Check if the childcare facility discloses that staff undergo background checks. While not always legally required on websites, this is a trust and safety disclosure that regulators expect and parents seek." },
    { industry: "childcare", agency: "FTC", ruleKey: "no_misleading_ratios_staff", severity: "warning", autoFixable: false,
      ruleDescription: "Caregiver-to-child ratios claimed must be accurate and meet state minimums",
      checkPrompt: "Check for staff-to-child ratio claims: '1:4 ratio', 'small class sizes'. Flag if ratios appear unusually low (favorable) compared to state licensing requirements without qualification, as these must be accurate." },

    // ═══════════════════════════════════════════════════════════════════
    // AUTOMOTIVE — car dealers, repair shops, auto dealers
    // ═══════════════════════════════════════════════════════════════════
    { industry: "automotive", agency: "FTC", ruleKey: "ftc_used_car_buyers_guide", severity: "critical", autoFixable: false,
      ruleDescription: "Used car dealers must display FTC Buyers Guide for each vehicle (16 CFR 455)",
      checkPrompt: "If the site sells used vehicles, check if the FTC Used Car Buyers Guide (or reference to it) is mentioned for each vehicle. The Buyers Guide must disclose warranty terms. Flag if absent for used vehicle listings." },
    { industry: "automotive", agency: "STATE_DMV", ruleKey: "dealer_license_display", severity: "critical", autoFixable: false,
      ruleDescription: "Auto dealer license number required on all advertising",
      checkPrompt: "Check if the auto dealer's state license number is displayed. All state DMVs require dealer license numbers on all advertising including websites. Flag if absent." },
    { industry: "automotive", agency: "FTC", ruleKey: "no_misleading_mileage_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Vehicle mileage claims must be accurate; odometer disclosure required (49 USC 32705)",
      checkPrompt: "Check vehicle listings for mileage claims. Flag any that appear rounded suspiciously (100,000 vs 98,547), disclaim odometer accuracy without explanation, or use 'TMU' (true mileage unknown) without clear disclosure." },
    { industry: "automotive", agency: "CFPB/TILA", ruleKey: "auto_financing_disclosures", severity: "warning", autoFixable: false,
      ruleDescription: "Auto financing advertising must include APR and key terms (Truth in Lending Act)",
      checkPrompt: "Check financing advertisements: 'low monthly payments', '$X/month'. TILA requires that if specific payment terms are advertised, APR, down payment, and total cost must also be disclosed. Flag trigger term violations." },
    { industry: "automotive", agency: "FTC", ruleKey: "as_is_vehicle_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "As-is vehicle sales must clearly disclose no warranty applies",
      checkPrompt: "Check if as-is vehicles are sold. Verify 'as-is, no warranty' is clearly stated for each such vehicle. FTC Used Car Rule requires explicit as-is disclosure on the Buyers Guide." },
    { industry: "automotive", agency: "NHTSA", ruleKey: "no_false_safety_ratings", severity: "critical", autoFixable: false,
      ruleDescription: "Vehicle safety ratings must be from official sources and accurately stated",
      checkPrompt: "Check safety rating claims: '5-star safety rating'. Flag if the rating agency isn't identified, if ratings appear inaccurate compared to NHTSA/IIHS data, or if ratings are self-assigned." },
    { industry: "automotive", agency: "STATE_DMV", ruleKey: "bonded_dealer_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Dealer bond status required disclosure in many states",
      checkPrompt: "Check if the auto dealer discloses that they are bonded (surety bond) as required for dealer licensing. Many states require bonded status disclosure on dealer advertising. Flag if absent." },

    // ═══════════════════════════════════════════════════════════════════
    // BEAUTY / COSMETOLOGY — salons, spas, esthetics, laser clinics
    // ═══════════════════════════════════════════════════════════════════
    { industry: "beauty", agency: "STATE_COSMETOLOGY_BOARD", ruleKey: "cosmetology_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "Cosmetology/esthetics license number required on advertising in most states",
      checkPrompt: "Check if the salon, spa, or beauty professional's state license number is displayed. Most state cosmetology boards require license numbers on advertising. Flag if absent." },
    { industry: "beauty", agency: "FDA", ruleKey: "no_drug_effect_cosmetic_claims", severity: "critical", autoFixable: false,
      ruleDescription: "Cosmetics cannot claim to change body structure or function (drug-cosmetic boundary)",
      checkPrompt: "Check all product/service claims. Flag claims that cross into drug territory: 'repairs cells', 'permanently removes wrinkles', 'regrows hair', 'changes skin structure'. Cosmetics cannot make drug-effect claims without FDA approval." },
    { industry: "beauty", agency: "FDA", ruleKey: "no_medical_grade_without_clearance", severity: "warning", autoFixable: false,
      ruleDescription: "Medical grade claims for cosmetics require FDA clearance or prescription-only status",
      checkPrompt: "Check for 'medical grade', 'clinical strength', 'pharmaceutical grade' cosmetic claims. Flag if these appear for over-the-counter products without clarification that they are available only through licensed providers." },
    { industry: "beauty", agency: "FDA/STATE", ruleKey: "botox_medical_provider_only", severity: "critical", autoFixable: false,
      ruleDescription: "Botox and injectable treatments can only be performed by licensed medical providers",
      checkPrompt: "If the site offers Botox, fillers, or injectable services, check if it clearly states these are performed by a licensed medical professional (physician, PA, NP, or delegated RN). Flag if provider credentials are not clearly stated for injectables." },
    { industry: "beauty", agency: "FTC", ruleKey: "no_fake_before_after_beauty", severity: "warning", autoFixable: false,
      ruleDescription: "Before/after beauty treatment photos must be of actual clients, not stock or filtered",
      checkPrompt: "Check before/after photos for cosmetic treatments. Flag if photos appear to be stock images rather than actual clients, if photos are clearly heavily filtered beyond showing treatment results, or if disclaimer 'actual client' is absent." },
    { industry: "beauty", agency: "OSHA/STATE", ruleKey: "chemical_service_safety", severity: "info", autoFixable: false,
      ruleDescription: "Salons using chemical services should disclose safety and allergy test requirements",
      checkPrompt: "If the salon offers chemical services (color, perms, keratin treatments, chemical peels), check if allergy test requirements or safety protocols are mentioned. OSHA hazard communication standards apply to salon chemicals." },
    { industry: "beauty", agency: "STATE", ruleKey: "esthetician_license_display", severity: "warning", autoFixable: false,
      ruleDescription: "Individual esthetician license numbers should be displayed per state board requirements",
      checkPrompt: "Check if individual esthetician or cosmetologist license numbers are displayed for staff. Many state boards require individual license numbers on service provider advertising or display at place of business." },

    // ═══════════════════════════════════════════════════════════════════
    // VETERINARY — animal hospitals, vet clinics, pet services
    // ═══════════════════════════════════════════════════════════════════
    { industry: "veterinary", agency: "STATE_VET_BOARD", ruleKey: "vet_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "Veterinary license number required on advertising in all states",
      checkPrompt: "Check if the veterinarian's state license number is displayed. All state veterinary medical boards require license numbers on all advertising. Flag if absent." },
    { industry: "veterinary", agency: "FTC", ruleKey: "no_guaranteed_animal_cure", severity: "critical", autoFixable: false,
      ruleDescription: "No guaranteed cure or treatment outcome claims for animals",
      checkPrompt: "Check all content for guaranteed cure claims for animals: 'we will cure', 'guaranteed recovery', 'eliminates the condition'. Flag unqualified treatment guarantees for animal health conditions." },
    { industry: "veterinary", agency: "FDA", ruleKey: "no_fda_unapproved_vet_drugs", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise or promote FDA-unapproved veterinary drugs for specific diseases",
      checkPrompt: "Check for promotion of veterinary drugs or treatments that appear to be for specific diseases without FDA approval. Flag any veterinary drug claim that implies disease treatment beyond FDA-approved or USDA-licensed uses." },
    { industry: "veterinary", agency: "AVMA", ruleKey: "avma_advertising_guidelines", severity: "warning", autoFixable: false,
      ruleDescription: "Veterinary advertising must comply with AVMA Principles of Veterinary Medical Ethics",
      checkPrompt: "Check if veterinary advertising makes unsubstantiated superiority claims, uses misleading testimonials, or makes promises beyond what veterinary medicine can deliver. AVMA Principles of Veterinary Medical Ethics guide advertising." },
    { industry: "veterinary", agency: "FTC", ruleKey: "vet_emergency_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Veterinary sites should note to seek emergency care for urgent situations",
      checkPrompt: "Check if the veterinary site mentions that for pet emergencies, owners should contact an emergency veterinary clinic or call immediately. Flag if contact/appointment pages lack guidance for emergency situations." },
    { industry: "veterinary", agency: "STATE", ruleKey: "vet_telemedicine_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Veterinary telemedicine must disclose state licensing and VCPR requirements",
      checkPrompt: "If the site offers veterinary telemedicine, check if it discloses the veterinarian's license and clarifies that a valid Veterinarian-Client-Patient Relationship (VCPR) is required. State vet telemedicine laws vary." },

    // ═══════════════════════════════════════════════════════════════════
    // NONPROFIT — 501(c)(3) charities, foundations, nonprofits
    // ═══════════════════════════════════════════════════════════════════
    { industry: "nonprofit", agency: "IRS", ruleKey: "ein_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "EIN (Tax ID) should be disclosed on donation pages for donor tax records",
      checkPrompt: "Check if the nonprofit's EIN (Employer Identification Number / Tax ID) is disclosed, particularly on donation pages. Donors need this for tax records. Flag if absent on donation-related pages." },
    { industry: "nonprofit", agency: "IRS", ruleKey: "tax_deductibility_disclaimer", severity: "critical", autoFixable: false,
      ruleDescription: "Donation pages must accurately state extent of tax deductibility (IRS regulations)",
      checkPrompt: "Check donation pages for tax deductibility claims. Verify the statement accurately reflects deductibility: 'tax-deductible to the extent allowed by law'. Flag if the site claims donations are 'fully tax-deductible' without qualification for quid pro quo situations." },
    { industry: "nonprofit", agency: "STATE_AG", ruleKey: "state_charity_registration", severity: "warning", autoFixable: false,
      ruleDescription: "Most states require charity registration and registration number disclosure",
      checkPrompt: "Check if the nonprofit discloses state charity registration status. Most states require charities soliciting donations from residents to be registered. Flag if no registration disclosure appears on donation pages." },
    { industry: "nonprofit", agency: "FTC", ruleKey: "no_misleading_donation_use", severity: "critical", autoFixable: false,
      ruleDescription: "Charities cannot misrepresent how donations will be used (FTC Section 5)",
      checkPrompt: "Check donation solicitation language for misleading claims about how funds will be used: '100% goes to the cause' when overhead exists, specific program designations that may not be honored. Flag if donation use appears misrepresented." },
    { industry: "nonprofit", agency: "IRS", ruleKey: "form_990_availability", severity: "info", autoFixable: false,
      ruleDescription: "Form 990 must be made available to public upon request (IRS requirement)",
      checkPrompt: "Check if the nonprofit mentions availability of Form 990 (annual financial disclosure required by IRS for tax-exempt organizations). While not required on website, best practice is to note it's available upon request." },
    { industry: "nonprofit", agency: "IRS", ruleKey: "quid_pro_quo_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Quid pro quo contributions over $75 must disclose the non-deductible portion (IRS)",
      checkPrompt: "If the nonprofit offers benefits in exchange for donations (event tickets, merchandise), check if it discloses that only the portion above fair market value of the benefit is tax-deductible. Required by IRS for amounts over $75." },

    // ═══════════════════════════════════════════════════════════════════
    // FITNESS — gyms, personal trainers, yoga studios, martial arts
    // ═══════════════════════════════════════════════════════════════════
    { industry: "fitness", agency: "FTC", ruleKey: "no_guaranteed_fitness_results", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot guarantee specific fitness or weight loss results (FTC guides for weight loss)",
      checkPrompt: "Check for guaranteed fitness outcome claims: 'lose 30 lbs in 30 days guaranteed', 'six pack abs guaranteed', 'guaranteed transformation'. FTC guides require claims to be typical results. Flag guaranteed fitness outcomes." },
    { industry: "fitness", agency: "FTC", ruleKey: "exercise_injury_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Fitness services should include exercise risk and injury disclaimer",
      checkPrompt: "Check if the site includes a disclaimer about injury risk and recommends consulting a physician before starting exercise programs. Flag if fitness programs are advertised without any injury risk disclosure." },
    { industry: "fitness", agency: "FTC", ruleKey: "trainer_certification_display", severity: "warning", autoFixable: false,
      ruleDescription: "Personal trainer credentials and certifications should be disclosed",
      checkPrompt: "Check if personal trainers' certifications are displayed (NASM, ACE, ACSM, NSCA, etc.). Flag if the site promotes personal training services without any trainer credential disclosure. FTC considers this deceptive without disclosed qualifications." },
    { industry: "fitness", agency: "FTC/STATE", ruleKey: "membership_cancellation_terms", severity: "warning", autoFixable: false,
      ruleDescription: "Gym membership cancellation policies must be clearly disclosed before purchase",
      checkPrompt: "Check if membership cancellation terms are clearly disclosed: notice period required, cancellation fees, process. Many states have specific gym membership cancellation laws. Flag if absent or buried in fine print." },
    { industry: "fitness", agency: "FDA/FTC", ruleKey: "no_medical_fitness_claims", severity: "warning", autoFixable: false,
      ruleDescription: "Cannot claim fitness programs treat, cure, or prevent medical conditions",
      checkPrompt: "Check for medical benefit claims for fitness: 'cures back pain', 'treats depression', 'prevents heart disease', 'reverses diabetes'. Flag claims that present exercise as a medical treatment for specific conditions without qualification." },
    { industry: "fitness", agency: "FTC", ruleKey: "fitness_supplement_disclaimer", severity: "warning", autoFixable: false,
      ruleDescription: "Fitness supplement claims sold alongside services must meet FTC standards",
      checkPrompt: "If the fitness business also sells supplements, check if supplement claims meet FTC standards: no disease cure claims, substantiated health claims, required FDA disclaimers. Flag if supplements are sold without proper claim substantiation." },

    // ═══════════════════════════════════════════════════════════════════
    // ACCOUNTING / CPA — accountants, tax preparers, bookkeepers
    // ═══════════════════════════════════════════════════════════════════
    { industry: "accounting", agency: "STATE_CPA_BOARD", ruleKey: "cpa_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "CPA license number required on advertising in most states",
      checkPrompt: "Check if the CPA's state license number is displayed on the site. Most state CPA boards require license numbers on all advertising. Flag if absent for any firm using 'CPA' in their business name or marketing." },
    { industry: "accounting", agency: "IRS/FTC", ruleKey: "no_guaranteed_tax_refund", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot guarantee specific tax refund amounts or audit protection",
      checkPrompt: "Check for guaranteed tax outcome claims: 'guaranteed maximum refund', 'we guarantee you won't be audited', 'guaranteed tax savings of $X'. Flag these as FTC deceptive practice violations and IRS Circular 230 issues." },
    { industry: "accounting", agency: "AICPA", ruleKey: "aicpa_independence_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "CPAs performing attestation services must maintain independence (AICPA standards)",
      checkPrompt: "If the CPA firm provides auditing or attestation services, check if they disclose independence standards compliance. AICPA requires CPAs to disclose any independence impairments for attest clients." },
    { industry: "accounting", agency: "IRS", ruleKey: "irs_circular_230_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Tax advice provided in writing requires IRS Circular 230 disclaimer",
      checkPrompt: "Check if the CPA or tax preparer provides tax advice on the website (articles, FAQs, blog posts). If so, verify IRS Circular 230 disclosure is present on such content to limit covered opinion liability." },
    { industry: "accounting", agency: "STATE", ruleKey: "accounting_jurisdiction_disclosure", severity: "warning", autoFixable: false,
      ruleDescription: "Must disclose the states where the CPA is licensed to practice",
      checkPrompt: "Check if the CPA firm discloses which states they are licensed in, especially if serving clients remotely. Many state CPA boards require disclosure of licensing jurisdiction for out-of-state clients." },
    { industry: "accounting", agency: "FTC", ruleKey: "no_audit_outcome_guarantee", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot guarantee favorable audit outcomes or promise to eliminate tax liability",
      checkPrompt: "Check for audit guarantee claims: 'we will eliminate your tax debt', 'guaranteed audit-proof returns', 'IRS won't touch you'. Flag these as deceptive — no one can guarantee specific IRS or audit outcomes." },

    // ═══════════════════════════════════════════════════════════════════
    // PHARMACY — retail pharmacies, online pharmacies, compounding
    // ═══════════════════════════════════════════════════════════════════
    { industry: "pharmacy", agency: "STATE_BOP", ruleKey: "pharmacy_license_displayed", severity: "critical", autoFixable: false,
      ruleDescription: "State pharmacy license number required on all pharmacy advertising",
      checkPrompt: "Check if the pharmacy's state Board of Pharmacy license number is displayed. All state pharmacy boards require license numbers on pharmacy advertising. Flag if absent." },
    { industry: "pharmacy", agency: "DEA", ruleKey: "dea_registration_disclosure", severity: "critical", autoFixable: false,
      ruleDescription: "DEA registration number required for pharmacies dispensing controlled substances",
      checkPrompt: "Check if the pharmacy discloses its DEA registration number. Pharmacies dispensing Schedule II-V controlled substances must hold DEA registration. Flag if absent for pharmacies that dispense controlled substances." },
    { industry: "pharmacy", agency: "FDA/DEA", ruleKey: "no_rx_without_valid_prescription", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot advertise or facilitate dispensing Rx medications without a valid prescription",
      checkPrompt: "Check if the site implies or facilitates dispensing prescription medications without requiring a valid prescription from a licensed prescriber. Flag any language suggesting prescriptions can be obtained online without proper medical evaluation." },
    { industry: "pharmacy", agency: "HIPAA", ruleKey: "pharmacy_hipaa_privacy", severity: "critical", autoFixable: true, autoFixAction: "add_hipaa_notice",
      ruleDescription: "Pharmacies must provide HIPAA Notice of Privacy Practices (45 CFR 164.520)",
      checkPrompt: "Check if the pharmacy website has a HIPAA Notice of Privacy Practices. Pharmacies are covered entities under HIPAA and must provide this notice. Flag if absent." },
    { industry: "pharmacy", agency: "NABP", ruleKey: "nabp_vipps_for_online", severity: "warning", autoFixable: false,
      ruleDescription: "Online pharmacies should display NABP VIPPS seal (Verified Internet Pharmacy Practice Sites)",
      checkPrompt: "If the pharmacy sells medications online (not just provides information), check for the NABP VIPPS (Verified Internet Pharmacy Practice Sites) seal. Flag online pharmacies without this verification as potentially operating illegally." },
    { industry: "pharmacy", agency: "FDA", ruleKey: "no_counterfeit_drug_promotion", severity: "critical", autoFixable: false,
      ruleDescription: "Cannot promote or sell counterfeit, unapproved, or imported drugs (FD&C Act)",
      checkPrompt: "Check if the pharmacy site promotes unusually discounted prescription drugs, 'Canadian pharmacy' imports, or drugs from unverified sources. Flag any promotion of drugs that may be counterfeit or imported illegally." },
    { industry: "pharmacy", agency: "FDA", ruleKey: "rx_drug_advertising_restrictions", severity: "critical", autoFixable: false,
      ruleDescription: "Direct-to-consumer prescription drug advertising must include fair balance (21 CFR 202)",
      checkPrompt: "If the pharmacy or associated prescriber advertises specific prescription drugs, check for FDA-required 'fair balance': major side effects and contraindications must be disclosed prominently alongside benefits. Flag if absent." },
  ];

  for (const rule of rules) {
    await db.insert(regulatoryRules).values({
      industry: rule.industry,
      agency: rule.agency,
      ruleKey: rule.ruleKey,
      ruleDescription: rule.ruleDescription,
      checkPrompt: rule.checkPrompt,
      severity: rule.severity,
      autoFixable: rule.autoFixable,
      autoFixAction: rule.autoFixAction ?? null,
      appliesTo: rule.appliesTo ?? "all",
      active: true,
    });
  }

  await db.insert(systemSettings).values({
    settingKey: "regulatory_rules_v2",
    settingValue: "true",
    description: "Regulatory rules v2 — 200+ rules across 19 industries (FTC, TTB, ABA, HIPAA, HUD, FDA, SEC, FINRA, CFPB, DEA, EPA, USDA, COPPA, TCPA, NABP, CAN-SPAM, AVMA, AICPA, IRS, state agencies)",
  }).onDuplicateKeyUpdate({ set: { settingValue: "true" } });

  console.log("[RegulatoryRules] Seeded", rules.length, "rules across 19 industries");
}
