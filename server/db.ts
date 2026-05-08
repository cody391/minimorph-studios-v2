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
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`support_ticket_replies\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`ticketId\` int NOT NULL, \`authorId\` int NOT NULL,
      \`authorRole\` enum('customer','admin') NOT NULL, \`body\` text NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now())
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`rep_messages\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`repId\` int NOT NULL, \`senderRole\` enum('rep','admin') NOT NULL,
      \`body\` text NOT NULL, \`readAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now())
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
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`broadcasts\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`subject\` varchar(255) NOT NULL,
      \`audience\` enum('all_customers','active_contracts','all_reps','all_leads') NOT NULL,
      \`body\` text NOT NULL, \`recipientCount\` int NOT NULL DEFAULT 0,
      \`status\` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
      \`sentAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now())
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
      \`createdAt\` timestamp NOT NULL DEFAULT (now())
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
      \`ci_createdAt\` timestamp NOT NULL DEFAULT (now())
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`rep_availability\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`repId\` int NOT NULL, \`dayOfWeek\` int NOT NULL,
      \`startTime\` varchar(5) NOT NULL, \`endTime\` varchar(5) NOT NULL,
      \`isAvailable\` boolean NOT NULL DEFAULT true,
      \`timezone\` varchar(64) NOT NULL DEFAULT 'America/Chicago',
      \`ra_createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`ra_updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
    )`);
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`system_settings\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
      \`settingKey\` varchar(128) NOT NULL, \`settingValue\` text NOT NULL,
      \`description\` text,
      \`ss_updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      \`updatedBy\` int,
      UNIQUE KEY \`system_settings_key_unique\` (\`settingKey\`)
    )`);
    await conn.execute(`INSERT IGNORE INTO \`system_settings\` (\`settingKey\`, \`settingValue\`, \`description\`) VALUES
      ('lead_engine_active','true','Master switch for the entire lead generation engine'),
      ('job_scraper_active','true','Enable/disable the Google Maps scraping job'),
      ('job_scorer_active','true','Enable/disable the website scoring job'),
      ('job_enrichment_active','true','Enable/disable the business enrichment job'),
      ('job_outreach_active','true','Enable/disable the automated outreach job'),
      ('job_auto_feed_active','true','Enable/disable the auto-feed reps job'),
      ('job_reengagement_active','true','Enable/disable the cold lead re-engagement job'),
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
      \`createdAt\` timestamp NOT NULL DEFAULT (now())
    )`);

    await safe("ALTER TABLE `contracts` ADD COLUMN `originalPriceCents` int DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `effectivePriceCents` int DEFAULT NULL");
    await safe("ALTER TABLE `contracts` ADD COLUMN `contractDiscountPercent` decimal(5,2) DEFAULT NULL");

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

    // ── One-time customer data purge (v2 — re-runs to catch accounts created during broken period) ──
    // Flag key bumped to _v2 so it re-runs even if _v1 flag exists.
    try {
      const [flagRows] = await conn.execute<any[]>(
        "SELECT settingValue FROM `system_settings` WHERE settingKey = 'customer_purge_2026_05_v2' LIMIT 1"
      );
      if (!(flagRows as any[])[0]) {
        console.log("[SchemaRepair] Running one-time customer data purge...");
        const purgeTables = [
          "support_ticket_replies",
          "project_assets",
          "ai_chat_logs",
          "nurture_logs",
          "nps_surveys",
          "customer_referrals",
          "monthly_reports",
          "reports",
          "upsell_opportunities",
          "support_tickets",
          "contact_submissions",
          "commissions",
          "onboarding_projects",
          "orders",
          "contracts",
          "customers",
        ];
        for (const t of purgeTables) {
          try {
            const [[r]] = await conn.execute<any[]>(`SELECT COUNT(*) AS c FROM \`${t}\``);
            const count = (r as any).c;
            if (count > 0) await conn.execute(`DELETE FROM \`${t}\``);
            console.log(`[SchemaRepair]   ✓ ${t}: ${count} rows deleted`);
          } catch (e: any) {
            console.log(`[SchemaRepair]   skip ${t}: ${e.message.substring(0, 80)}`);
          }
        }
        // Delete customer user accounts (role=user) — preserve rep accounts
        try {
          const [repRows] = await conn.execute<any[]>("SELECT userId FROM `reps`");
          const repIds: number[] = (repRows as any[]).map((r: any) => r.userId).filter(Boolean);
          if (repIds.length > 0) {
            const ph = repIds.map(() => "?").join(",");
            const [[cr]] = await conn.execute<any[]>(
              `SELECT COUNT(*) AS c FROM \`users\` WHERE role='user' AND id NOT IN (${ph})`,
              repIds
            );
            const count = (cr as any).c;
            if (count > 0) {
              await conn.execute(
                `DELETE FROM \`users\` WHERE role='user' AND id NOT IN (${ph})`,
                repIds
              );
            }
            console.log(`[SchemaRepair]   ✓ users (non-rep): ${count} rows deleted`);
          } else {
            const [[cr]] = await conn.execute<any[]>("SELECT COUNT(*) AS c FROM `users` WHERE role='user'");
            const count = (cr as any).c;
            if (count > 0) await conn.execute("DELETE FROM `users` WHERE role='user'");
            console.log(`[SchemaRepair]   ✓ users: ${count} rows deleted`);
          }
        } catch (e: any) {
          console.log(`[SchemaRepair]   skip users: ${e.message.substring(0, 80)}`);
        }
        // Mark purge as done so it never runs again
        await conn.execute(
          "INSERT IGNORE INTO `system_settings` (settingKey, settingValue, description) VALUES ('customer_purge_2026_05_v2', 'true', 'One-time customer data purge — May 2026 v2')"
        );
        console.log("[SchemaRepair] Customer data purge complete.");
      }
    } catch (e: any) {
      console.log(`[SchemaRepair] Purge check skipped: ${e.message.substring(0, 80)}`);
    }

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

    // ── One-time admin password reset ─────────────────────────────────────
    try {
      const [flagRows] = await conn.execute<any[]>(
        "SELECT settingValue FROM `system_settings` WHERE settingKey = 'reset_admin_pw_v1' LIMIT 1"
      );
      if (!(flagRows as any[])[0]) {
        const newPassword = "MiniMorph2026!";
        const hash = await bcrypt.hash(newPassword, 10);
        await conn.execute(
          "UPDATE `users` SET passwordHash = ? WHERE email = 'cody@wmrum.com'",
          [hash]
        );
        await conn.execute(
          "INSERT IGNORE INTO `system_settings` (settingKey, settingValue, description) VALUES ('reset_admin_pw_v1', 'true', 'One-time admin password reset')"
        );
        console.log("[SchemaRepair] Admin password reset to MiniMorph2026!");
      }
    } catch (e: any) {
      console.log(`[SchemaRepair] Password reset skipped: ${e.message.substring(0, 80)}`);
    }

    // ── Clean up stale product keys from old catalog versions ─────────────
    await safe(`DELETE FROM \`product_catalog\` WHERE \`productKey\` IN ('content_addon', 'seo_addon', 'priority_support_old', 'extra_revision_block_old')`);
    // Reset v3 flag so catalog re-seeds on next startup with correct pitch scripts
    await safe(`DELETE FROM \`system_settings\` WHERE \`settingKey\` = 'product_catalog_v3'`);

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
      if (!existing.passwordHash && ENV.adminPassword) {
        updates.passwordHash = await bcrypt.hash(ENV.adminPassword, 12);
        updates.loginMethod = "email_password";
        needsUpdate = true;
        console.log("[AdminBootstrap] Set password for existing admin:", ENV.adminEmail);
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
